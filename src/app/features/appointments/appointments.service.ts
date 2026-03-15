import { Injectable, inject } from '@angular/core';
import { Observable, of, map } from 'rxjs';
import { MockService }         from '../../shared/services/mock.service';
import type { Professional, Specialty }   from '../../core/models/professional';
import type { Appointment }    from '../../core/models/appointment';

// Estado temporal del wizard — solo vive en el componente
// pero lo tipamos aquí para reutilizarlo si hace falta
export interface BookingState {
  specialty:    Specialty    | null;
  professional: Professional | null;
  date:         string       | null;
  startTime:    string       | null;
  endTime:      string       | null;
}

export const EMPTY_BOOKING: BookingState = {
  specialty:    null,
  professional: null,
  date:         null,
  startTime:    null,
  endTime:      null,
};

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private mock = inject(MockService);

  // ── Paso 1 ───────────────────────────────────────────────

  // Especialidades únicas con al menos un profesional activo
  getAvailableSpecialties(): Observable<Specialty[]> {
    return this.mock.getProfessionals().pipe(
      map(professionals => {
        const specialties = professionals
          .filter(p => p.isActive)
          .map(p => p.specialty);
        // Set elimina duplicados, spread lo convierte a array
        return [...new Set(specialties)];
      })
    );
  }

  // Profesionales activos filtrados por especialidad
  getProfessionalsBySpecialty(specialty: Specialty): Observable<Professional[]> {
    return this.mock.getProfessionals().pipe(
      map(professionals =>
        professionals.filter(p => p.isActive && p.specialty === specialty)
      )
    );
  }

  // ── Paso 2 ───────────────────────────────────────────────

  // Slots disponibles para un profesional en una fecha dada
  getAvailableSlots(professionalId: string, date: string): Observable<string[]> {
    const professional = this.mock.getProfessionalById(professionalId);
    if (!professional) return of([]);

    const interval = professional.intervalMinutes;

    // Todos los slots posibles del día (08:00 a 17:00)
    const allSlots = this.generateSlots(8, 17, interval);

    // Filtramos los ya ocupados
    return this.mock.getAppointments(professionalId, date).pipe(
      map(appointments => {
        const booked = appointments
          .filter(a => a.status !== 'CANCELLED' && a.status !== 'NO_SHOW')
          .map(a => a.startTime);
        return allSlots.filter(slot => !booked.includes(slot));
      })
    );
  }

  // ── Paso 3 ───────────────────────────────────────────────

  confirmAppointment(booking: BookingState): Observable<Appointment> {
    // TODO: reemplazar con this.http.post<Appointment>('/api/appointments', payload)
    const newAppointment: Appointment = {
      id:        crypto.randomUUID(),
      date:      booking.date!,
      startTime: booking.startTime!,
      endTime:   booking.endTime!,
      status:    'PENDING',
      patient: {
        id:        'pa1',          // se reemplaza con el usuario logueado
        firstName: 'Paciente',
        lastName:  'Actual',
        phone:     '3000000000',
      },
      professional: {
        id:        booking.professional!.id,
        firstName: booking.professional!.firstName,
        lastName:  booking.professional!.lastName,
        specialty: booking.professional!.specialty,
      },
    };
    return of(newAppointment);
  }

  // ── Helpers ──────────────────────────────────────────────

  // Calcula la hora de fin sumando el intervalo en minutos
  calculateEndTime(startTime: string, intervalMinutes: number): string {
    const [h, m] = startTime.split(':').map(Number);
    const total  = h * 60 + m + intervalMinutes;
    const endH   = String(Math.floor(total / 60)).padStart(2, '0');
    const endM   = String(total % 60).padStart(2, '0');
    return `${endH}:${endM}`;
  }

  // Genera todos los slots posibles entre dos horas
  private generateSlots(startHour: number, endHour: number, intervalMinutes: number): string[] {
    const slots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += intervalMinutes) {
        const h = String(hour).padStart(2, '0');
        const m = String(min).padStart(2, '0');
        // Solo agregamos si el slot completo cabe antes de la hora fin
        if (hour * 60 + min + intervalMinutes <= endHour * 60) {
          slots.push(`${h}:${m}`);
        }
      }
    }
    return slots;
  }

  // Obtiene todos los profesionales
  getAll(professionalId?: string, date?: string): Observable<Appointment[]> {
    return this.mock.getAppointments(professionalId, date);
    }
}