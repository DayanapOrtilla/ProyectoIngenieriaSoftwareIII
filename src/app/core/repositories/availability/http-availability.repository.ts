import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable , map} from 'rxjs';
import { AvailabilityRepository } from './availability.repository';
import type { Availability } from '../../models/availability';
import type { CreateAvailabilityDto, UpdateAvailabilityDto } from '../../services/availabilities.service';
import { environment } from '../../../../environments/environment';

@Injectable()
export class HttpAvailabilityRepository extends AvailabilityRepository {
  private http = inject(HttpClient);
  private url  = `${environment.apiUrl}/availabilities`;

  findAll(): Observable<Availability[]> {
    return this.http.get<Availability[]>(this.url);
  }

  findById(id: string): Observable<Availability | undefined> {
    return this.http.get<Availability>(`${this.url}/${id}`);
  }

  /*
  //Filtrado del lado del servidor (más eficiente)
  findByProfessionalId(id: string): Observable<Availability[]> {
    const params = new HttpParams().set('professionalId', id);
    return this.http.get<Availability[]>(this.url, { params });
  } 
  */

  //Filtrado del lado del cliente
  findByProfessionalId(id: string): Observable<Availability[]> {
    return this.http.get<Availability[]>(`${this.url}/${id}/availability`);
  }

  save(dto: CreateAvailabilityDto): Observable<Availability> {
    return this.http.post<Availability>(this.url, dto);
  }

  update(id: string, dto: UpdateAvailabilityDto): Observable<Availability> {
    return this.http.put<Availability>(`${this.url}/${id}`, dto);
  }

  deactivate(id: string): Observable<Availability> {
    return this.http.patch<Availability>(`${this.url}/${id}/deactivate`, {});
  }

  saveAll(professionalId: string, availability: Availability[]): Observable<Availability[]> {
    return this.http.put<Availability[]>(`${this.url}/${professionalId}/availability`, availability);
  }
}