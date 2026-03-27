import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { AppointmentListComponent } from './appointment-list';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { ProfessionalsService } from '../../../core/services/professionals.service';
import { AppointmentRepository } from '../../../core/repositories/appointments/appointment.repository';
import { AvailabilityRepository } from '../../../core/repositories/availability/availability.repository';
import type { Appointment } from '../../../core/models/appointment';
import type { Professional } from '../../../core/models/professional';

// ─── Factories ────────────────────────────────────────────────────────────────

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 'a1', date: '2026-03-23', startTime: '09:00', endTime: '09:30',
    status: 'CONFIRMADA',
    patient:      { id: 'p1',  firstName: 'Juan',   lastName: 'García',    phone: '300' },
    professional: { id: 'pr1', firstName: 'Carlos', lastName: 'Rodríguez', specialty: 'QUIROPRAXIA', type: 'MEDICO' },
    ...overrides,
  };
}

function makeProfessional(overrides = {}): Professional {
  return {
    id: 'pr1', firstName: 'Carlos', lastName: 'Rodríguez',
    specialty: 'QUIROPRAXIA', type: 'MEDICO', intervalMinutes: 30, isActive: true,
    ...overrides,
  } as Professional;
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('AppointmentListComponent — HU 1.1: Listar citas por médico y fecha', () => {
  let component: AppointmentListComponent;
  let mockAppSvc: any;
  let mockProfSvc: any;

  beforeEach(() => {
    mockAppSvc = {
      getHistory:                  vi.fn().mockReturnValue(of([])),
      getAll:                      vi.fn().mockReturnValue(of([])),
      getAvailableSpecialties:     vi.fn().mockReturnValue(of([])),
      confirmAppointment:          vi.fn().mockReturnValue(of(null)),
      calculateEndTime:            vi.fn(),
      getAvailableSlots:           vi.fn().mockReturnValue(of([])),
      getProfessionalsBySpecialty: vi.fn().mockReturnValue(of([])),
    };
    mockProfSvc = {
      getAll:                      vi.fn().mockReturnValue(of([])),
      getAvailableSpecialties:     vi.fn().mockReturnValue(of([])),
      getProfessionalsBySpecialty: vi.fn().mockReturnValue(of([])),
      getById:                     vi.fn().mockReturnValue(of(null)),
    };

    TestBed.configureTestingModule({
      imports: [AppointmentListComponent],
      providers: [
        provideRouter([]),  // ← soluciona NG0201: ActivatedRoute y RouterLink
        { provide: AppointmentsService,   useValue: mockAppSvc  },
        { provide: ProfessionalsService,  useValue: mockProfSvc },
        { provide: AppointmentRepository,  useValue: { findAll: vi.fn().mockReturnValue(of([])), save: vi.fn(), getHistory: vi.fn().mockReturnValue(of([])) } },
        { provide: AvailabilityRepository, useValue: { findByProfessionalId: vi.fn().mockReturnValue(of([])) } },
      ],
    });

    const fixture = TestBed.createComponent(AppointmentListComponent);
    component = fixture.componentInstance;
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Contadores reactivos
  // ══════════════════════════════════════════════════════════════════════════

  describe('Getters de contadores', () => {
    it('[CA1] total() retorna la cantidad correcta de citas', () => {
      (component as any).appointments.set([
        makeAppointment({ status: 'CONFIRMADA' }),
        makeAppointment({ id: 'a2', status: 'PENDIENTE' }),
        makeAppointment({ id: 'a3', status: 'COMPLETADA' }),
      ]);
      expect((component as any).total).toBe(3);
    });

    it('[CA2] confirmed() cuenta solo citas CONFIRMADA', () => {
      (component as any).appointments.set([
        makeAppointment({ status: 'CONFIRMADA' }),
        makeAppointment({ id: 'a2', status: 'CONFIRMADA' }),
        makeAppointment({ id: 'a3', status: 'PENDIENTE' }),
      ]);
      expect((component as any).confirmed).toBe(2);
    });

    it('[CA3] pending() cuenta solo citas PENDIENTE', () => {
      (component as any).appointments.set([
        makeAppointment({ status: 'PENDIENTE' }),
        makeAppointment({ id: 'a2', status: 'CONFIRMADA' }),
      ]);
      expect((component as any).pending).toBe(1);
    });

    it('[CA4] completed() cuenta solo citas COMPLETADA', () => {
      (component as any).appointments.set([
        makeAppointment({ status: 'COMPLETADA' }),
        makeAppointment({ id: 'a2', status: 'COMPLETADA' }),
        makeAppointment({ id: 'a3', status: 'CANCELADA' }),
      ]);
      expect((component as any).completed).toBe(2);
    });

    it('[CA5] todos los contadores son 0 cuando no hay citas', () => {
      (component as any).appointments.set([]);
      expect((component as any).total).toBe(0);
      expect((component as any).confirmed).toBe(0);
      expect((component as any).pending).toBe(0);
      expect((component as any).completed).toBe(0);
    });

    it('[CA6] CANCELADA y NO_ASISTE no incrementan contadores positivos', () => {
      (component as any).appointments.set([
        makeAppointment({ status: 'CANCELADA' }),
        makeAppointment({ id: 'a2', status: 'NO_ASISTE' }),
      ]);
      expect((component as any).confirmed).toBe(0);
      expect((component as any).pending).toBe(0);
      expect((component as any).completed).toBe(0);
      expect((component as any).total).toBe(2);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // loadAppointments()
  // ══════════════════════════════════════════════════════════════════════════

  describe('loadAppointments()', () => {
    it('[CA1] llama a getHistory con profesional y fecha seleccionados', () => {
      mockAppSvc.getHistory.mockReturnValue(of([]));
      (component as any).selectedProfessionalId = 'pr1';
      (component as any).selectedDate           = '2026-03-23';

      (component as any).loadAppointments();

      expect(mockAppSvc.getHistory).toHaveBeenCalledWith('pr1', '2026-03-23');
    });

    it('[CA2] pasa undefined si no hay profesional seleccionado', () => {
      mockAppSvc.getHistory.mockReturnValue(of([]));
      (component as any).selectedProfessionalId = '';
      (component as any).selectedDate           = '2026-03-23';

      (component as any).loadAppointments();

      expect(mockAppSvc.getHistory).toHaveBeenCalledWith(undefined, '2026-03-23');
    });

    it('[CA3] actualiza el signal appointments con los datos recibidos', () => {
      const citas = [makeAppointment(), makeAppointment({ id: 'a2' })];
      mockAppSvc.getHistory.mockReturnValue(of(citas));

      (component as any).loadAppointments();

      expect((component as any).appointments()).toHaveLength(2);
    });

    it('[CA4] loading pasa a false tras respuesta exitosa', () => {
      mockAppSvc.getHistory.mockReturnValue(of([makeAppointment()]));

      (component as any).loadAppointments();

      expect((component as any).loading).toBe(false);
    });

    it('[CA5] loading pasa a false incluso si el backend falla', () => {
      mockAppSvc.getHistory.mockReturnValue(throwError(() => new Error('500')));

      (component as any).loadAppointments();

      expect((component as any).loading).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // loadProfessionals()
  // ══════════════════════════════════════════════════════════════════════════

  describe('loadProfessionals()', () => {
    it('[CA1] guarda solo los profesionales activos', () => {
      mockProfSvc.getAll.mockReturnValue(of([
        makeProfessional({ id: 'pr1', isActive: true }),
        makeProfessional({ id: 'pr2', isActive: false }),
        makeProfessional({ id: 'pr3', isActive: true }),
      ]));

      (component as any).loadProfessionals();

      const activos = (component as any).professionals();
      expect(activos).toHaveLength(2);
      expect(activos.every((p: Professional) => p.isActive)).toBe(true);
    });

    it('[CA2] guarda arreglo vacío si no hay profesionales activos', () => {
      mockProfSvc.getAll.mockReturnValue(of([
        makeProfessional({ isActive: false }),
      ]));

      (component as any).loadProfessionals();

      expect((component as any).professionals()).toHaveLength(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // onFilterChange()
  // ══════════════════════════════════════════════════════════════════════════

  describe('onFilterChange()', () => {
    it('[CA1] al cambiar el filtro recarga las citas', () => {
      mockAppSvc.getHistory.mockReturnValue(of([]));

      (component as any).onFilterChange();

      expect(mockAppSvc.getHistory).toHaveBeenCalled();
    });

    it('[CA2] la recarga usa los filtros actuales al momento del cambio', () => {
      mockAppSvc.getHistory.mockReturnValue(of([]));
      (component as any).selectedProfessionalId = 'pr99';
      (component as any).selectedDate           = '2026-04-01';

      (component as any).onFilterChange();

      expect(mockAppSvc.getHistory).toHaveBeenCalledWith('pr99', '2026-04-01');
    });
  });
});
