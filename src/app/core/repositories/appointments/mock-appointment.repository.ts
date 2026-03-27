import { Injectable }      from '@angular/core';
import { Observable, of }  from 'rxjs';
import { AppointmentRepository } from './appointment.repository';
import type { Appointment }      from '../../models/appointment';
import type { BookingState }     from '../../services/appointments.service';

@Injectable()
export class MockAppointmentRepository extends AppointmentRepository {

  private data: Appointment[] = [
    { id: 'a1', date: '2026-03-15', startTime: '08:00', endTime: '08:30', status: 'CONFIRMADA',
      patient:      { id: 'pa1', firstName: 'Juan',   lastName: 'García',    phone: '3001234567' },
      professional: { id: 'p1',  firstName: 'Carlos', lastName: 'Rodríguez', specialty: 'QUIROPRAXIA',    type: 'MEDICO'    }},
    { id: 'a2', date: '2026-03-15', startTime: '09:00', endTime: '09:45', status: 'PENDIENTE',
      patient:      { id: 'pa2', firstName: 'María',  lastName: 'López',     phone: '3109876543' },
      professional: { id: 'p2',  firstName: 'Ana',    lastName: 'Martínez',  specialty: 'FISIOTERAPIA',   type: 'TERAPISTA' }},
    { id: 'a3', date: '2026-03-15', startTime: '10:00', endTime: '11:00', status: 'COMPLETADA',
      patient:      { id: 'pa3', firstName: 'Pedro',  lastName: 'Suárez',    phone: '3201122334' },
      professional: { id: 'p3',  firstName: 'Luis',   lastName: 'Gómez',     specialty: 'TERAPIA_NEURAL', type: 'TERAPISTA' }},
    { id: 'a4', date: '2026-03-15', startTime: '11:00', endTime: '11:30', status: 'CANCELADA',
      patient:      { id: 'pa1', firstName: 'Juan',   lastName: 'García',    phone: '3001234567' },
      professional: { id: 'p1',  firstName: 'Carlos', lastName: 'Rodríguez', specialty: 'QUIROPRAXIA',    type: 'MEDICO'    }},
  ];

  findAll(professionalId?: string, date?: string): Observable<Appointment[]> {
    return of(this.data.filter(a => {
      const byProf = !professionalId || a.professional.id === professionalId;
      const byDate = !date           || a.date === date;
      return byProf && byDate;
    }));
  }

  save(booking: BookingState): Observable<Appointment> {
    const newAppointment: Appointment = {
      id:        crypto.randomUUID(),
      date:      booking.date!,
      startTime: booking.startTime!,
      endTime:   booking.endTime!,
      status:    'PENDIENTE',
      patient: {
        id:        booking.patient!.id,
        firstName: booking.patient!.firstName,
        lastName:  booking.patient!.lastName,
        phone:     booking.patient!.phone,
      },
      professional: {
        id:        booking.professional!.id,
        firstName: booking.professional!.firstName,
        lastName:  booking.professional!.lastName,
        specialty: booking.professional!.specialty,
        type:      booking.professional!.type,
      },
    };
    this.data.push(newAppointment);
    return of(newAppointment);
  }

  getHistory(professionalId?: string, date?: string): Observable<Appointment[]> {
    return of(this.data.filter(p => p.professional.id !== professionalId));
  }
}