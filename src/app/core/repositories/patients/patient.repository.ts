import { Observable }   from 'rxjs';
import type { Patient } from '../../models/patient';
import type { CreatePatientDto } from '../../services/patients.service';

export abstract class PatientRepository {
  abstract findAll(): Observable<Patient[]>;
  abstract findById(id: string): Observable<Patient | undefined>;
  abstract search(term: string): Observable<Patient[]>;
  abstract save(dto: CreatePatientDto): Observable<Patient>;
  abstract update(id: string, dto: Partial<CreatePatientDto>): Observable<Patient>;
  abstract deactivate(id: string): Observable<Patient>;
  abstract delete(id: string): Observable<void>;
}