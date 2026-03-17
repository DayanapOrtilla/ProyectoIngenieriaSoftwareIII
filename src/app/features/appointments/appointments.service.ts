import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map, of } from 'rxjs';
import { MockService } from '../../shared/services/mock.service';
import type { Professional, Specialty } from '../../core/models/professional';
import type { Appointment } from '../../core/models/appointment';

export interface BookingState {
  specialty: Specialty | null;
  professional: Professional | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
}

export const EMPTY_BOOKING: BookingState = {
  specialty: null,
  professional: null,
  date: null,
  startTime: null,
  endTime: null,
};

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private mock = inject(MockService);

  getAvailableSpecialties(): Observable<Specialty[]> {
    return this.mock.getProfessionals().pipe(
      map(professionals => {
        const specialties = professionals
          .filter(p => p.isActive)
          .map(p => p.specialty);

        return [...new Set(specialties)] as Specialty[];
      })
    );
  }

  getProfessionalsBySpecialty(specialty: Specialty): Observable<Professional[]> {
    return this.mock.getProfessionals().pipe(
      map(professionals =>
        professionals.filter(p => p.isActive && p.specialty === specialty)
      )
    );
  }

  getAvailableSlots(professionalId: string, date: string): Observable<string[]> {
    const fechaNormalizada = this.normalizarFecha(date);

    if (!professionalId || !fechaNormalizada) {
      return of([]);
    }

    return combineLatest([
      this.mock.getProfessionals(),
      this.mock.getAppointments(professionalId, fechaNormalizada)
    ]).pipe(
      map(([professionals, appointments]) => {
        const professional = professionals.find(p => p.id === professionalId);

        if (!professional) {
          return [];
        }

        const interval = professional.intervalMinutes;
        const allSlots = this.generateSlots(8, 17, interval);

        const booked = appointments
          .filter(a => a.status !== 'CANCELLED' && a.status !== 'NO_SHOW')
          .map(a => a.startTime);

        return allSlots.filter(slot => !booked.includes(slot));
      })
    );
  }

  confirmAppointment(booking: BookingState): Observable<Appointment> {
    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      date: this.normalizarFecha(booking.date!),
      startTime: booking.startTime!,
      endTime: booking.endTime!,
      status: 'PENDING',
      patient: {
        id: 'pa1',
        firstName: 'Paciente',
        lastName: 'Actual',
        phone: '3000000000',
      },
      professional: {
        id: booking.professional!.id,
        firstName: booking.professional!.firstName,
        lastName: booking.professional!.lastName,
        specialty: booking.professional!.specialty,
      },
    };

    return of(newAppointment);
  }

  calculateEndTime(startTime: string, intervalMinutes: number): string {
    const [h, m] = startTime.split(':').map(Number);
    const total = h * 60 + m + intervalMinutes;
    const endH = String(Math.floor(total / 60)).padStart(2, '0');
    const endM = String(total % 60).padStart(2, '0');
    return `${endH}:${endM}`;
  }

  private generateSlots(startHour: number, endHour: number, intervalMinutes: number): string[] {
    const slots: string[] = [];

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += intervalMinutes) {
        const h = String(hour).padStart(2, '0');
        const m = String(min).padStart(2, '0');

        if (hour * 60 + min + intervalMinutes <= endHour * 60) {
          slots.push(`${h}:${m}`);
        }
      }
    }

    return slots;
  }

  private normalizarFecha(date: string): string {
    if (!date) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      const [dia, mes, anio] = date.split('/');
      return `${anio}-${mes}-${dia}`;
    }

    return date;
  }

  getAll(professionalId?: string, date?: string): Observable<Appointment[]> {
    const fechaNormalizada = date ? this.normalizarFecha(date) : undefined;
    return this.mock.getAppointments(professionalId, fechaNormalizada);
  }
}