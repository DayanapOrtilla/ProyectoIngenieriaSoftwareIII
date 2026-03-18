import { Injectable, inject } from '@angular/core';
import { HttpClient }          from '@angular/common/http';
import { Observable }          from 'rxjs';
import { PatientRepository }   from './patient.repository';
import type { Patient }        from '../../models/patient';
import type { CreatePatientDto } from '../../services/patients.service';
import { environment }         from '../../../../environments/environment';

@Injectable()
export class HttpPatientRepository extends PatientRepository {
  private http = inject(HttpClient);
  private url  = `${environment.apiUrl}/patients`;

  findAll(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.url);
  }

  findById(id: string): Observable<Patient | undefined> {
    return this.http.get<Patient>(`${this.url}/${id}`);
  }

  search(term: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.url}?search=${term}`);
  }

  save(dto: CreatePatientDto): Observable<Patient> {
    return this.http.post<Patient>(this.url, dto);
  }

  update(id: string, dto: Partial<CreatePatientDto>): Observable<Patient> {
    return this.http.put<Patient>(`${this.url}/${id}`, dto);
  }

  deactivate(id: string): Observable<Patient> {
    return this.http.patch<Patient>(`${this.url}/${id}/deactivate`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}