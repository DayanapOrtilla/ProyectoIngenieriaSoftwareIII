// src/app/shared/services/mock.service.ts

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';  // ← of convierte un array en Observable
import type { Professional } from '../../core/models/professional';
import type { Patient }      from '../../core/models/patient';
import type { Appointment }  from '../../core/models/appointment';

@Injectable({ providedIn: 'root' })
export class MockService {

  getProfessionals(): Observable<Professional[]> {
    return of([
      { id: 'p1', firstName: 'Carlos', lastName: 'Rodríguez', type: 'MEDICO',    specialty: 'QUIROPRAXIA',    intervalMinutes: 30, isActive: true,  email: 'c.rodriguez@piedra-azul.com' },
      { id: 'p2', firstName: 'Ana',    lastName: 'Martínez',  type: 'TERAPISTA', specialty: 'FISIOTERAPIA',   intervalMinutes: 45, isActive: true,  email: 'a.martinez@piedra-azul.com'  },
      { id: 'p3', firstName: 'Luis',   lastName: 'Gómez',     type: 'TERAPISTA', specialty: 'TERAPIA_NEURAL', intervalMinutes: 60, isActive: true,  email: 'l.gomez@piedra-azul.com'     },
      { id: 'p4', firstName: 'Sofía',  lastName: 'Pérez',     type: 'MEDICO',    specialty: 'QUIROPRAXIA',    intervalMinutes: 30, isActive: false, email: 's.perez@piedra-azul.com'     },
    ]);
  }

  getPatients(): Observable<Patient[]> {
    return of([
      { id: 'pa1', documentId: '1234567890', firstName: 'Juan',  lastName: 'García', phone: '3001234567', gender: 'MASCULINO', email: 'juan@email.com' },
      { id: 'pa2', documentId: '9876543210', firstName: 'María', lastName: 'López',  phone: '3109876543', gender: 'FEMENINO'  },
      { id: 'pa3', documentId: '1122334455', firstName: 'Pedro', lastName: 'Suárez', phone: '3201122334', gender: 'MASCULINO' },
    ]);
  }

  // Conecxión con backend real ()
  //getPatients(): Observable<Patient[]> {
  //return this.http.get<Patient[]>(`${this.apiUrl}/patients`);


  getAppointments(professionalId?: string, date?: string): Observable<Appointment[]> {
    const all: Appointment[] = [
      { id: 'a1', date: '2026-03-15', startTime: '08:00', endTime: '08:30', status: 'CONFIRMED',
        patient: { id: 'pa1', firstName: 'Juan',  lastName: 'García',  phone: '3001234567' },
        professional: { id: 'p1', firstName: 'Carlos', lastName: 'Rodríguez', specialty: 'QUIROPRAXIA'    }},
      { id: 'a2', date: '2026-03-15', startTime: '09:00', endTime: '09:45', status: 'PENDING',
        patient: { id: 'pa2', firstName: 'María', lastName: 'López',   phone: '3109876543' },
        professional: { id: 'p2', firstName: 'Ana',    lastName: 'Martínez',  specialty: 'FISIOTERAPIA'   }},
      { id: 'a3', date: '2026-03-15', startTime: '10:00', endTime: '11:00', status: 'COMPLETED',
        patient: { id: 'pa3', firstName: 'Pedro', lastName: 'Suárez',  phone: '3201122334' },
        professional: { id: 'p3', firstName: 'Luis',   lastName: 'Gómez',     specialty: 'TERAPIA_NEURAL' }},
      { id: 'a4', date: '2026-03-15', startTime: '11:00', endTime: '11:30', status: 'CANCELLED',
        patient: { id: 'pa1', firstName: 'Juan',  lastName: 'García',  phone: '3001234567' },
        professional: { id: 'p1', firstName: 'Carlos', lastName: 'Rodríguez', specialty: 'QUIROPRAXIA'    }},
    ];

    // Filtramos aquí dentro del servicio, no en el componente
    // Cuando llegue el backend, estos filtros se convierten en query params: /api/appointments?professionalId=p1&date=2026-03-15
    return of(
      all.filter(a => {
        const byProf = !professionalId || a.professional.id === professionalId;
        const byDate = !date           || a.date === date;
        return byProf && byDate;
      })
    );
  }


  getProfessionalById(id: string): Professional | undefined {
    const professionals: Professional[] = [
      { id: 'p1', firstName: 'Carlos', lastName: 'Rodríguez', type: 'MEDICO',    specialty: 'QUIROPRAXIA',    intervalMinutes: 30, isActive: true,  email: 'c.rodriguez@piedra-azul.com' },
      { id: 'p2', firstName: 'Ana',    lastName: 'Martínez',  type: 'TERAPISTA', specialty: 'FISIOTERAPIA',   intervalMinutes: 45, isActive: true,  email: 'a.martinez@piedra-azul.com'  },
      { id: 'p3', firstName: 'Luis',   lastName: 'Gómez',     type: 'TERAPISTA', specialty: 'TERAPIA_NEURAL', intervalMinutes: 60, isActive: true,  email: 'l.gomez@piedra-azul.com'     },
      { id: 'p4', firstName: 'Sofía',  lastName: 'Pérez',     type: 'MEDICO',    specialty: 'QUIROPRAXIA',    intervalMinutes: 30, isActive: false, email: 's.perez@piedra-azul.com'     },
    ];
    return professionals.find(p => p.id === id);
  }

}