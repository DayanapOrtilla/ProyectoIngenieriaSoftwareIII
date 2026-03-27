import { Injectable }        from '@angular/core';
import { Observable, of }    from 'rxjs';
import { AvailabilityRepository } from './availability.repository';
import type { Availability } from '../../models/availability';
import type { CreateAvailabilityDto, UpdateAvailabilityDto } from '../../services/availabilities.service';

@Injectable()
export class MockAvailabilityRepository extends AvailabilityRepository {

  private data: Availability[] = [
    { id: 'av1', professionalId: 'p1', dayOfWeek: 0, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av2', professionalId: 'p1', dayOfWeek: 1, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av3', professionalId: 'p1', dayOfWeek: 2, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av4', professionalId: 'p1', dayOfWeek: 3, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av5', professionalId: 'p1', dayOfWeek: 4, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av6', professionalId: 'p1', dayOfWeek: 5, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av7', professionalId: 'p1', dayOfWeek: 6, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av8', professionalId: 'p1', dayOfWeek: 0, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av9', professionalId: 'p1', dayOfWeek: 1, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av10', professionalId: 'p1', dayOfWeek: 2, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av11', professionalId: 'p1', dayOfWeek: 3, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av12', professionalId: 'p1', dayOfWeek: 4, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av13', professionalId: 'p1', dayOfWeek: 5, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av14', professionalId: 'p1', dayOfWeek: 6, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av15', professionalId: 'p1', dayOfWeek: 0, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av16', professionalId: 'p1', dayOfWeek: 1, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av17', professionalId: 'p1', dayOfWeek: 2, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av18', professionalId: 'p1', dayOfWeek: 3, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av19', professionalId: 'p1', dayOfWeek: 4, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av20', professionalId: 'p1', dayOfWeek: 5, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av21', professionalId: 'p1', dayOfWeek: 6, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av22', professionalId: 'p1', dayOfWeek: 0, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av23', professionalId: 'p1', dayOfWeek: 1, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av24', professionalId: 'p1', dayOfWeek: 2, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av25', professionalId: 'p1', dayOfWeek: 3, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av26', professionalId: 'p1', dayOfWeek: 4, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av27', professionalId: 'p1', dayOfWeek: 5, startTime: '08:00',    endTime: '13:00', isActive: false },
    { id: 'av28', professionalId: 'p1', dayOfWeek: 6, startTime: '08:00',    endTime: '13:00', isActive: false },
  ];

  findAll(): Observable<Availability[]> {
    return of([...this.data]);
  }

  findById(id: string): Observable<Availability | undefined> {
    return of(this.data.find(p => p.id === id));
  }

  findByProfessionalId(id: string): Observable<Availability[]> {
    return of(this.data.filter(p => p.professionalId === id));
  }

  save(dto: CreateAvailabilityDto): Observable<Availability> {
    const newAvail: Availability = { 
      id: crypto.randomUUID(), ...dto };
    this.data.push(newAvail);
    return of(newAvail);
  }

  update(id: string, dto: UpdateAvailabilityDto): Observable<Availability> {
    const index = this.data.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Disponibilidad no encontrada');
    this.data[index] = { ...this.data[index], ...dto };
    return of(this.data[index]);
  }

  deactivate(id: string): Observable<Availability> {
      return this.update(id, {isActive: false} as any);
  }

  saveAll(professionalId: string, availability: Availability[]): Observable<Availability[]> {
    this.data = this.data.filter(p => p.professionalId !== professionalId);
    this.data.push(...availability);
    return of(availability);  
  }
}