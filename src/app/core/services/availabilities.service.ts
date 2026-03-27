import { Injectable, inject } from '@angular/core';
import { Observable }         from 'rxjs';
import { Availability } from "../models/availability";
import { AvailabilityRepository } from '../repositories/availability/availability.repository';

export interface CreateAvailabilityDto {
    professionalId:   string;
    dayOfWeek:      number; // 0=Domingo, 1=Lunes … 6=Sábado
    startTime:      string; // "08:00"
    endTime:        string; // "17:00"
    isActive:       boolean;
}

export type UpdateAvailabilityDto = Partial<CreateAvailabilityDto>;

@Injectable({ providedIn : 'root'})
export class AvailabilityService {
    private repo =  inject(AvailabilityRepository);
    getAll(): Observable<Availability[]>{
        return this.repo.findAll();
    }

    getById(id: string): Observable<Availability | undefined> {
        return this.repo.findById(id);
    }

    getByProfessionalId(id: string): Observable<Availability[] | undefined> {
        return this.repo.findByProfessionalId(id);
    }

    create(dto: CreateAvailabilityDto): Observable<Availability> {
        return this.repo.save(dto);
    }

    update(id: string, dto: UpdateAvailabilityDto): Observable<Availability> {
        return this.repo.update(id, dto);
    }
    deactivate(id: string): Observable<Availability> {
        return this.repo.deactivate(id);
    }
}

