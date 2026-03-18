import { Injectable }        from '@angular/core';
import { Observable, of }    from 'rxjs';
import { ProfessionalRepository } from './professional.repository';
import type { Professional } from '../../models/professional';
import type { CreateProfessionalDto, UpdateProfessionalDto } from '../../../../app/core/services/professionals.service';

@Injectable()
export class MockProfessionalRepository extends ProfessionalRepository {

  private data: Professional[] = [
    { id: 'p1', firstName: 'Carlos', lastName: 'Rodríguez', type: 'MEDICO',    specialty: 'QUIROPRAXIA',    intervalMinutes: 30, isActive: true,  email: 'c.rodriguez@piedra-azul.com' },
    { id: 'p2', firstName: 'Ana',    lastName: 'Martínez',  type: 'TERAPISTA', specialty: 'FISIOTERAPIA',   intervalMinutes: 45, isActive: true,  email: 'a.martinez@piedra-azul.com'  },
    { id: 'p3', firstName: 'Luis',   lastName: 'Gómez',     type: 'TERAPISTA', specialty: 'TERAPIA_NEURAL', intervalMinutes: 60, isActive: true,  email: 'l.gomez@piedra-azul.com'     },
    { id: 'p4', firstName: 'Sofía',  lastName: 'Pérez',     type: 'MEDICO',    specialty: 'QUIROPRAXIA',    intervalMinutes: 30, isActive: false, email: 's.perez@piedra-azul.com'     },
  ];

  findAll(): Observable<Professional[]> {
    return of([...this.data]);
  }

  findById(id: string): Observable<Professional | undefined> {
    return of(this.data.find(p => p.id === id));
  }

  save(dto: CreateProfessionalDto): Observable<Professional> {
    const newProf: Professional = { id: crypto.randomUUID(), ...dto };
    this.data.push(newProf);
    return of(newProf);
  }

  update(id: string, dto: UpdateProfessionalDto): Observable<Professional> {
    const index = this.data.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Profesional no encontrado');
    this.data[index] = { ...this.data[index], ...dto };
    return of(this.data[index]);
  }
}