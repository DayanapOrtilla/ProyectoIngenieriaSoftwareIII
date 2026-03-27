import { Injectable, inject } from '@angular/core';
import { Observable, map, forkJoin }    from 'rxjs';
import { AppointmentRepository }  from '../../core/repositories/appointments/appointment.repository';
import { ProfessionalsService }   from '../../core/services/professionals.service';
import { AvailabilityRepository } from '../repositories/availability/availability.repository';
import type { Appointment }       from '../../core/models/appointment';
import type { Professional }      from '../../core/models/professional';
import type { Specialty }         from '../../core/models/professional';
import type { Patient }           from '../models/patient';
import { HttpParams } from '@angular/common/http';

export interface BookingState {
  specialty:    Specialty    | null;
  professional: Professional | null;
  patient:      Pick<Patient, 'id' | 'firstName' | 'lastName' | 'phone'> | null; // ← agregar
  date:         string       | null;
  startTime:    string       | null;
  endTime:      string       | null;
}

export const EMPTY_BOOKING: BookingState = {
  specialty:    null,
  professional: null,
  patient:      null,
  date:         null,
  startTime:    null,
  endTime:      null,
};

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private repo     = inject(AppointmentRepository);
  private profsSvc = inject(ProfessionalsService);
  private availRepo = inject(AvailabilityRepository);

  getAll(professionalId?: string, date?: string): Observable<Appointment[]> {
    return this.repo.findAll(professionalId, date);
  }

  getAvailableSpecialties(): Observable<Specialty[]> {
    return this.profsSvc.getAvailableSpecialties();
  }

  getProfessionalsBySpecialty(specialty: Specialty): Observable<Professional[]> {
    return this.profsSvc.getProfessionalsBySpecialty(specialty);
  }

  getAvailableSlots(professionalId: string, date: string): Observable<string[]> {
    const dayOfWeek = new Date(date + 'T00:00:00').getDay(); // 0=Dom, 1=Lun...

    return forkJoin({
      professional: this.profsSvc.getById(professionalId),
      availability: this.availRepo.findByProfessionalId(professionalId),
      appointments: this.repo.findAll(professionalId, date),
    }).pipe(
      map(({ professional, availability, appointments }) => {
        if (!professional) return [];

        // Buscar disponibilidad del día seleccionado
        const dayAvail = availability.find(
          a => a.dayOfWeek === dayOfWeek && a.isActive
        );

        // Si el profesional no trabaja ese día, no hay slots
        if (!dayAvail) return [];

        // Generar slots del día según el horario configurado
        const [startH, startM] = dayAvail.startTime.split(':').map(Number);
        const [endH,   endM  ] = dayAvail.endTime.split(':').map(Number);
        const allSlots = this.generateSlots(
          startH * 60 + startM,
          endH   * 60 + endM,
          professional.intervalMinutes
        );

        // Quitar slots ya ocupados
        const booked = appointments
          .filter(a => a.status !== 'CANCELADA' && a.status !== 'NO_ASISTE')
          .map(a => a.startTime);

        return allSlots.filter(slot => !booked.includes(slot));
      })
    );
  }

  confirmAppointment(booking: BookingState): Observable<Appointment> {
    return this.repo.save(booking);
  }

  calculateEndTime(startTime: string, intervalMinutes: number): string {
    const [h, m] = startTime.split(':').map(Number);
    const total  = h * 60 + m + intervalMinutes;
    return `${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
  }

  private generateSlots(startMin: number, endMin: number, interval: number): string[] {
    const slots: string[] = [];
    for (let min = startMin; min + interval <= endMin; min += interval) {
      const h = String(Math.floor(min / 60)).padStart(2, '0');
      const m = String(min % 60).padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
    return slots;
  }

  getHistory(professionalId?: string, date?: string): Observable<Appointment[]> {
    return this.repo.getHistory(professionalId, date);
  }
}