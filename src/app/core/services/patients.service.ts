import { Injectable, inject } from '@angular/core';
import { Observable }         from 'rxjs';
import { PatientRepository }  from '../../core/repositories/patients/patient.repository';
import type { Gender, Patient }       from '../../core/models/patient';

export interface CreatePatientDto {
  documentId: string;
  firstName:  string;
  lastName:   string;
  phone:      string;
  gender:     Gender;
  email?:     string;
  isActive:   boolean;
}

export type UpdatePatientDto = Partial<CreatePatientDto>;

@Injectable({ providedIn: 'root' })
export class PatientsService {
  private repo = inject(PatientRepository);

  getAll(): Observable<Patient[]> {
    return this.repo.findAll();
  }

  getById(id: string): Observable<Patient | undefined> {
    return this.repo.findById(id);
  }

  search(term: string): Observable<Patient[]> {
    return this.repo.search(term);
  }

  create(dto: CreatePatientDto): Observable<Patient> {
    return this.repo.save(dto);
  }

  update(id: string, dto: UpdatePatientDto): Observable<Patient> {
    return this.repo.update(id, dto);
  }

  deactivate(id: string): Observable<Patient> {
    return this.repo.deactivate(id);
  }

  delete(id: string): Observable<void> {
    return this.repo.delete(id);
  }
}