import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import type { Professional } from '../../core/models/professional';
import type { Patient } from '../../core/models/patient';
import type { Appointment } from '../../core/models/appointment';

@Injectable({ providedIn: 'root' })
export class MockService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  // cache local solo para búsquedas síncronas
  private professionalsCache: Professional[] = [
    { id: 'p1', firstName: 'Carlos', lastName: 'Rodríguez', type: 'MEDICO',    specialty: 'QUIROPRAXIA',    intervalMinutes: 30, isActive: true,  email: 'c.rodriguez@piedra-azul.com' },
    { id: 'p2', firstName: 'Ana',    lastName: 'Martínez',  type: 'TERAPISTA', specialty: 'FISIOTERAPIA',   intervalMinutes: 45, isActive: true,  email: 'a.martinez@piedra-azul.com'  },
    { id: 'p3', firstName: 'Luis',   lastName: 'Gómez',     type: 'TERAPISTA', specialty: 'TERAPIA_NEURAL', intervalMinutes: 60, isActive: true,  email: 'l.gomez@piedra-azul.com'     },
    { id: 'p4', firstName: 'Sofía',  lastName: 'Pérez',     type: 'MEDICO',    specialty: 'QUIROPRAXIA',    intervalMinutes: 30, isActive: false, email: 's.perez@piedra-azul.com'     },
  ];

  private patientsMock: Patient[] = [
    { id: 'pa1', documentId: '1234567890', firstName: 'Juan',  lastName: 'García', phone: '3001234567', gender: 'MASCULINO', email: 'juan@email.com' },
    { id: 'pa2', documentId: '9876543210', firstName: 'María', lastName: 'López',  phone: '3109876543', gender: 'FEMENINO'  },
    { id: 'pa3', documentId: '1122334455', firstName: 'Pedro', lastName: 'Suárez', phone: '3201122334', gender: 'MASCULINO' },
  ];

  getProfessionals(): Observable<Professional[]> {
    return this.http.get<Professional[]>(`${this.apiUrl}/professionals`);
  }

  getPatients(): Observable<Patient[]> {
    return of(this.patientsMock);
  }

  getAppointments(professionalId?: string, date?: string): Observable<Appointment[]> {
    let params = new HttpParams();

    if (professionalId) {
      params = params.set('professionalId', professionalId);
    }

    if (date) {
      params = params.set('date', date);
    }

    return this.http.get<Appointment[]>(`${this.apiUrl}/appointments`, { params });
  }

  getProfessionalById(id: string): Professional | undefined {
    return this.professionalsCache.find(p => p.id === id);
  }
}