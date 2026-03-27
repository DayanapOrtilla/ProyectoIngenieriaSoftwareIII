import { Observable } from 'rxjs';
import type { Availability } from '../../models/availability';
import type { CreateAvailabilityDto, UpdateAvailabilityDto } from '../../services/availabilities.service';

export abstract class AvailabilityRepository {
  abstract findAll(): Observable<Availability[]>;
  abstract findById(id: string): Observable<Availability | undefined>;
  abstract save(dto: CreateAvailabilityDto): Observable<Availability>;
  abstract update(id: string, dto: UpdateAvailabilityDto): Observable<Availability>;
  abstract deactivate(id: string): Observable<Availability>;
  abstract findByProfessionalId(id: string): Observable<Availability[]>;
  abstract saveAll(professionalId: string, availability: Availability[]): Observable<Availability[]>;

}