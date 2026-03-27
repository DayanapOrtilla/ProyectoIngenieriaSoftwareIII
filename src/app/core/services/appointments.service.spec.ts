import { TestBed } from '@angular/core/testing';
import { of, firstValueFrom } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { AppointmentsService } from './appointments.service';
import { AppointmentRepository } from '../repositories/appointments/appointment.repository';
import { AvailabilityRepository } from '../repositories/availability/availability.repository';
import { ProfessionalsService } from './professionals.service';
import type { Appointment } from '../models/appointment';
import type { Professional, Specialty } from '../models/professional';
import type { BookingState } from './appointments.service';

// ─── Factories ────────────────────────────────────────────────────────────────

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 'a1', date: '2026-03-23', startTime: '09:00', endTime: '09:30',
    status: 'CONFIRMADA',
    patient:      { id: 'p1',  firstName: 'Juan',   lastName: 'García',    phone: '3001234567' },
    professional: { id: 'pr1', firstName: 'Carlos', lastName: 'Rodríguez', specialty: 'QUIROPRAXIA', type: 'MEDICO' },
    ...overrides,
  };
}

function makeProfessional(overrides: Partial<Professional> = {}): Professional {
  return {
    id: 'pr1', firstName: 'Carlos', lastName: 'Rodríguez',
    specialty: 'QUIROPRAXIA' as Specialty, type: 'MEDICO',
    intervalMinutes: 30, isActive: true,
    ...overrides,
  } as Professional;
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let mockRepo: any;
  let mockProfsSvc: any;
  let mockAvailRepo: any;

  beforeEach(() => {
    mockRepo = {
      findAll:    vi.fn().mockReturnValue(of([])),
      save:       vi.fn().mockReturnValue(of(makeAppointment())),
      getHistory: vi.fn().mockReturnValue(of([])),
    };
    mockProfsSvc = {
      getAll:                      vi.fn().mockReturnValue(of([])),
      getAvailableSpecialties:     vi.fn().mockReturnValue(of([])),
      getProfessionalsBySpecialty: vi.fn().mockReturnValue(of([])),
      getById:                     vi.fn().mockReturnValue(of(makeProfessional())),
    };
    mockAvailRepo = {
      findByProfessionalId: vi.fn().mockReturnValue(of([])),
    };

    TestBed.configureTestingModule({
      providers: [
        AppointmentsService,
        { provide: AppointmentRepository,  useValue: mockRepo      },
        { provide: ProfessionalsService,   useValue: mockProfsSvc  },
        { provide: AvailabilityRepository, useValue: mockAvailRepo },
      ],
    });

    service = TestBed.inject(AppointmentsService);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // HU 1.1 — Listar citas por médico y fecha
  // ══════════════════════════════════════════════════════════════════════════

  describe('getAll()', () => {
    it('[CA1] retorna todas las citas sin filtros', async () => {
      mockRepo.findAll.mockReturnValue(of([makeAppointment(), makeAppointment({ id: 'a2' })]));

      const result = await firstValueFrom(service.getAll());

      expect(mockRepo.findAll).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toHaveLength(2);
    });

    it('[CA2] filtra por professionalId cuando se indica', async () => {
      mockRepo.findAll.mockReturnValue(of([makeAppointment()]));

      await firstValueFrom(service.getAll('pr1'));

      expect(mockRepo.findAll).toHaveBeenCalledWith('pr1', undefined);
    });

    it('[CA3] filtra por fecha cuando se indica', async () => {
      mockRepo.findAll.mockReturnValue(of([makeAppointment()]));

      await firstValueFrom(service.getAll(undefined, '2026-03-23'));

      expect(mockRepo.findAll).toHaveBeenCalledWith(undefined, '2026-03-23');
    });

    it('[CA4] aplica ambos filtros simultáneamente', async () => {
      mockRepo.findAll.mockReturnValue(of([makeAppointment()]));

      await firstValueFrom(service.getAll('pr1', '2026-03-23'));

      expect(mockRepo.findAll).toHaveBeenCalledWith('pr1', '2026-03-23');
    });

    it('[CA5] retorna arreglo vacío si no hay citas para esa combinación', async () => {
      mockRepo.findAll.mockReturnValue(of([]));

      const result = await firstValueFrom(service.getAll('pr-99', '2099-01-01'));

      expect(result).toEqual([]);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // HU 2.2 — Slots disponibles para el paciente
  // ══════════════════════════════════════════════════════════════════════════

  describe('getAvailableSlots()', () => {

    it('[CA1] retorna slots libres excluyendo los ya ocupados (CONFIRMADA)', async () => {
      mockProfsSvc.getById.mockReturnValue(of(makeProfessional({ intervalMinutes: 30 })));
      mockAvailRepo.findByProfessionalId.mockReturnValue(of([
        { dayOfWeek: 1, startTime: '08:00', endTime: '10:00', isActive: true },
      ]));
      mockRepo.findAll.mockReturnValue(of([
        makeAppointment({ startTime: '08:00', status: 'CONFIRMADA' }),
      ]));

      // 2026-03-23 = Lunes (dayOfWeek = 1)
      const slots = await firstValueFrom(service.getAvailableSlots('pr1', '2026-03-23'));

      expect(slots).not.toContain('08:00');
      expect(slots).toContain('08:30');
      expect(slots).toContain('09:00');
    });

    it('[CA2] los slots de citas CANCELADA quedan libres', async () => {
      mockProfsSvc.getById.mockReturnValue(of(makeProfessional({ intervalMinutes: 30 })));
      mockAvailRepo.findByProfessionalId.mockReturnValue(of([
        { dayOfWeek: 1, startTime: '08:00', endTime: '09:00', isActive: true },
      ]));
      mockRepo.findAll.mockReturnValue(of([
        makeAppointment({ startTime: '08:00', status: 'CANCELADA' }),
      ]));

      const slots = await firstValueFrom(service.getAvailableSlots('pr1', '2026-03-23'));

      expect(slots).toContain('08:00');
    });

    it('[CA3] los slots de citas NO_ASISTE quedan libres', async () => {
      mockProfsSvc.getById.mockReturnValue(of(makeProfessional({ intervalMinutes: 30 })));
      mockAvailRepo.findByProfessionalId.mockReturnValue(of([
        { dayOfWeek: 1, startTime: '08:00', endTime: '09:00', isActive: true },
      ]));
      mockRepo.findAll.mockReturnValue(of([
        makeAppointment({ startTime: '08:00', status: 'NO_ASISTE' }),
      ]));

      const slots = await firstValueFrom(service.getAvailableSlots('pr1', '2026-03-23'));

      expect(slots).toContain('08:00');
    });

    it('[CA4] retorna arreglo vacío si el profesional no trabaja ese día', async () => {
      mockProfsSvc.getById.mockReturnValue(of(makeProfessional()));
      mockAvailRepo.findByProfessionalId.mockReturnValue(of([]));
      mockRepo.findAll.mockReturnValue(of([]));

      // 2026-03-22 = Domingo
      const slots = await firstValueFrom(service.getAvailableSlots('pr1', '2026-03-22'));

      expect(slots).toEqual([]);
    });

    it('[CA5] retorna arreglo vacío si el profesional no existe', async () => {
      mockProfsSvc.getById.mockReturnValue(of(null));
      mockAvailRepo.findByProfessionalId.mockReturnValue(of([]));
      mockRepo.findAll.mockReturnValue(of([]));

      const slots = await firstValueFrom(service.getAvailableSlots('no-existe', '2026-03-23'));

      expect(slots).toEqual([]);
    });

    it('[CA6] retorna arreglo vacío si la disponibilidad del día está inactiva', async () => {
      mockProfsSvc.getById.mockReturnValue(of(makeProfessional()));
      mockAvailRepo.findByProfessionalId.mockReturnValue(of([
        { dayOfWeek: 1, startTime: '08:00', endTime: '12:00', isActive: false },
      ]));
      mockRepo.findAll.mockReturnValue(of([]));

      const slots = await firstValueFrom(service.getAvailableSlots('pr1', '2026-03-23'));

      expect(slots).toEqual([]);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // calculateEndTime()
  // ══════════════════════════════════════════════════════════════════════════

  describe('calculateEndTime()', () => {
    it('[CA1] calcula correctamente con intervalo de 30 min', () => {
      expect(service.calculateEndTime('08:00', 30)).toBe('08:30');
    });

    it('[CA2] maneja el cambio de hora (08:45 + 30 = 09:15)', () => {
      expect(service.calculateEndTime('08:45', 30)).toBe('09:15');
    });

    it('[CA3] funciona con intervalo de 20 minutos', () => {
      expect(service.calculateEndTime('09:00', 20)).toBe('09:20');
    });

    it('[CA4] mantiene el cero a la izquierda en minutos', () => {
      expect(service.calculateEndTime('09:05', 5)).toBe('09:10');
    });

    it('[CA5] calcula correctamente para minutos impares', () => {
      expect(service.calculateEndTime('07:35', 20)).toBe('07:55');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // confirmAppointment()
  // ══════════════════════════════════════════════════════════════════════════

  describe('confirmAppointment()', () => {
    it('[CA1] delega correctamente al repositorio con el BookingState completo', async () => {
      const booking: BookingState = {
        specialty: 'QUIROPRAXIA' as Specialty,
        professional: makeProfessional(),
        patient: { id: 'p1', firstName: 'Juan', lastName: 'García', phone: '300' },
        date: '2026-03-23', startTime: '09:00', endTime: '09:30',
      };
      mockRepo.save.mockReturnValue(of(makeAppointment()));

      const result = await firstValueFrom(service.confirmAppointment(booking));

      expect(mockRepo.save).toHaveBeenCalledWith(booking);
      expect(result.id).toBe('a1');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // getHistory()
  // ══════════════════════════════════════════════════════════════════════════

  describe('getHistory()', () => {
    it('[CA1] delega al repositorio con professionalId y date', async () => {
      mockRepo.getHistory.mockReturnValue(of([makeAppointment()]));

      const result = await firstValueFrom(service.getHistory('pr1', '2026-03-23'));

      expect(mockRepo.getHistory).toHaveBeenCalledWith('pr1', '2026-03-23');
      expect(result).toHaveLength(1);
    });

    it('[CA2] funciona sin parámetros (retorna historial completo)', async () => {
      mockRepo.getHistory.mockReturnValue(of([makeAppointment(), makeAppointment({ id: 'a2' })]));

      const result = await firstValueFrom(service.getHistory());

      expect(mockRepo.getHistory).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toHaveLength(2);
    });
  });
});
