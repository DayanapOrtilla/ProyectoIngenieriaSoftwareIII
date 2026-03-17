import { Injectable, inject } from '@angular/core';
import { HttpClient }          from '@angular/common/http';
import { Observable }          from 'rxjs';
import { ProfessionalRepository }  from './professional.repository';
import type { Professional }       from '../../models/professional';
import type { CreateProfessionalDto, UpdateProfessionalDto } from '../../../../app/core/services/professionals.service';
import { environment }             from '../../../../environments/environment';

@Injectable()
export class HttpProfessionalRepository extends ProfessionalRepository {
  private http = inject(HttpClient);
  private url  = `${environment.apiUrl}/professionals`;

  findAll(): Observable<Professional[]> {
    return this.http.get<Professional[]>(this.url);
  }

  findById(id: string): Observable<Professional | undefined> {
    return this.http.get<Professional>(`${this.url}/${id}`);
  }

  save(dto: CreateProfessionalDto): Observable<Professional> {
    return this.http.post<Professional>(this.url, dto);
  }

  update(id: string, dto: UpdateProfessionalDto): Observable<Professional> {
    return this.http.put<Professional>(`${this.url}/${id}`, dto);
  }
}