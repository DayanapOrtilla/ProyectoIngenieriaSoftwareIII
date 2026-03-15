import { Injectable, inject } from '@angular/core';
import { Observable, of, map } from 'rxjs';
import { MockService }         from '../../shared/services/mock.service';
import type { Patient }        from '../../core/models/patient';

export interface CreatePatientDto {
  documentId: string;
  firstName:  string;
  lastName:   string;
  phone:      string;
  gender:     string;
  email?:     string;
}

@Injectable({ providedIn: 'root' })
export class PatientsService {
  private mock = inject(MockService);

  // Buscar por nombre o documento — búsqueda en tiempo real
  search(term: string): Observable<Patient[]> {
    if (!term || term.trim().length < 3) return of([]);

    const lower = term.toLowerCase().trim();

    return this.mock.getPatients().pipe(
      map(patients =>
        patients.filter(p =>
          p.firstName.toLowerCase().includes(lower)  ||
          p.lastName.toLowerCase().includes(lower)   ||
          p.documentId.includes(lower)               ||
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(lower)
        )
      )
    );
  }

  getAll(): Observable<Patient[]> {
    return this.mock.getPatients();
  }

  // TODO: reemplazar con this.http.post<Patient>('/api/patients', dto)
  create(dto: CreatePatientDto): Observable<Patient> {
    const newPatient: Patient = {
      id:         crypto.randomUUID(),
      documentId: dto.documentId,
      firstName:  dto.firstName,
      lastName:   dto.lastName,
      phone:      dto.phone,
      gender:     dto.gender as any,
      email:      dto.email,
    };
    return of(newPatient);
  }
}