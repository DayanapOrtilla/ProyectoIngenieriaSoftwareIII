import { Injectable, inject } from '@angular/core';
import { Observable, map }    from 'rxjs';
import { ProfessionalRepository } from '../../core/repositories/professionals/professional.repository';
import type { Professional }  from '../../core/models/professional';
import type { Specialty }     from '../../core/models/professional';

export interface CreateProfessionalDto {
  firstName:       string;
  lastName:        string;
  type:            'MEDICO' | 'TERAPISTA';
  specialty:       'QUIROPRAXIA' | 'FISIOTERAPIA' | 'TERAPIA_NEURAL';
  intervalMinutes: number;
  email:           string;
  isActive:        boolean;
}

export type UpdateProfessionalDto = Partial<CreateProfessionalDto>;

@Injectable({ providedIn: 'root' })
export class ProfessionalsService {
  private repo = inject(ProfessionalRepository);

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
    return this.repo.findAll().pipe(
      map(profs => profs.filter(p => p.isActive && p.specialty === specialty))
    );
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