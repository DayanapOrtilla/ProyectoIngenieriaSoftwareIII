import { Injectable, inject } from '@angular/core';
import { Observable, map }    from 'rxjs';
import { ProfessionalRepository } from '../../core/repositories/professionals/professional.repository';
import { AvailabilityRepository } from '../repositories/availability/availability.repository';

import type { Professional }  from '../../core/models/professional';
import type { Specialty }     from '../../core/models/professional';
import type { Availability } from '../models/availability';
import { HttpParams } from '@angular/common/http';

export interface CreateProfessionalDto {
  firstName: string;
  lastName: string;
  type: 'MEDICO' | 'TERAPISTA';
  specialty: 'QUIROPRAXIA' | 'FISIOTERAPIA' | 'TERAPIA_NEURAL';
  intervalMinutes: number;
  email: string;
  isActive: boolean;
  password: string;
}

export type UpdateProfessionalDto = Partial<CreateProfessionalDto>;

@Injectable({ providedIn: 'root' })
export class ProfessionalsService {
  private repo = inject(ProfessionalRepository);
  private availRepo = inject(AvailabilityRepository)

  getAll(): Observable<Professional[]> {
    return this.repo.findAll();
  }

  getById(id: string): Observable<Professional | undefined> {
    return this.repo.findById(id);
  }

  getAvailableSpecialties(): Observable<Specialty[]> {
    return this.repo.findAll().pipe(
      map(profs => [...new Set(
        profs.filter(p => p.isActive).map(p => p.specialty)
      )])
    );
  }

  getProfessionalsBySpecialty(specialty: Specialty): Observable<Professional[]> {
    return this.repo.getProfessionalBySpecialty(specialty);
  }

  getAvailability(professionalId: string): Observable<Availability[]> {
    return this.availRepo.findByProfessionalId(professionalId);
  }

  saveAvailability(professionalId: string, availability: Availability[]): Observable<Availability[]> {
    return this.availRepo.saveAll(professionalId, availability);
  }

  create(dto: CreateProfessionalDto): Observable<Professional> {
    return this.repo.save(dto);
  }

  update(id: string, dto: UpdateProfessionalDto): Observable<Professional> {
    return this.repo.update(id, dto);
  }

  toggleActive(id: string, isActive: boolean): Observable<Professional> {
    return this.repo.update(id, { isActive });
  }
}