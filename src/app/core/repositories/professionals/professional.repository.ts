import { Observable } from 'rxjs';
import type { Professional, Specialty } from '../../models/professional';
import type { CreateProfessionalDto, UpdateProfessionalDto } from '../../services/professionals.service';

export abstract class ProfessionalRepository {
  abstract findAll(): Observable<Professional[]>;
  abstract getProfessionalBySpecialty(specialty: Specialty): Observable<Professional[]>;
  abstract findById(id: string): Observable<Professional | undefined>;
  abstract save(dto: CreateProfessionalDto): Observable<Professional>;
  abstract update(id: string, dto: UpdateProfessionalDto): Observable<Professional>;
}