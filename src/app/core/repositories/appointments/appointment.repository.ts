import { Observable }      from 'rxjs';
import type { Appointment } from '../../models/appointment';
import type { BookingState } from '../../services/appointments.service';

export abstract class AppointmentRepository {
  abstract findAll(professionalId?: string, date?: string): Observable<Appointment[]>;
  abstract save(booking: BookingState): Observable<Appointment>;
  abstract getHistory(professionalId?: string, date?: string): Observable<Appointment[]>
}