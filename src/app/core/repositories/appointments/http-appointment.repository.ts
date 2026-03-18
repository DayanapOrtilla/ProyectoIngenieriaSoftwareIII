import { Injectable, inject } from '@angular/core';
import { HttpClient }          from '@angular/common/http';
import { Observable }          from 'rxjs';
import { AppointmentRepository } from './appointment.repository';
import type { Appointment }      from '../../models/appointment';
import type { BookingState }     from '../../services/appointments.service';
import { environment }           from '../../../../environments/environment';

@Injectable()
export class HttpAppointmentRepository extends AppointmentRepository {
  private http = inject(HttpClient);
  private url  = `${environment.apiUrl}/appointments`;

  findAll(professionalId?: string, date?: string): Observable<Appointment[]> {
    const params: string[] = [];
    if (professionalId) params.push(`professionalId=${professionalId}`);
    if (date)           params.push(`date=${date}`);
    const query = params.length ? `?${params.join('&')}` : '';
    return this.http.get<Appointment[]>(`${this.url}${query}`);
  }

  save(booking: BookingState): Observable<Appointment> {
    return this.http.post<Appointment>(this.url, booking);
  }
}