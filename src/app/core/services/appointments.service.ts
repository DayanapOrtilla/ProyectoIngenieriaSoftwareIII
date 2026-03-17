import { Injectable, inject } from '@angular/core';
import { Observable, map }    from 'rxjs';
import { AppointmentRepository }  from '../../core/repositories/appointments/appointment.repository';
import { ProfessionalsService }   from '../../core/services/professionals.service';
import type { Appointment }       from '../../core/models/appointment';
import type { Professional }      from '../../core/models/professional';
import type { Specialty }         from '../../core/models/professional';
import type { Patient }           from '../models/patient';

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
    return this.profsSvc.getById(professionalId).pipe(
      map(professional => {
        if (!professional) return [];
        return this.generateSlots(8, 17, professional.intervalMinutes);
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

  private generateSlots(startHour: number, endHour: number, interval: number): string[] {
    const slots: string[] = [];
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += interval) {
        if (h * 60 + m + interval <= endHour * 60) {
          slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
        }
      }
    }
    return slots;
  }
}