import { Injectable }     from '@angular/core';
import { Observable, of } from 'rxjs';
import { PatientRepository }    from './patient.repository';
import type { Patient }         from '../../models/patient';
import type { CreatePatientDto, UpdatePatientDto } from '../../services/patients.service';

@Injectable()
export class MockPatientRepository extends PatientRepository {

  private data: Patient[] = [
    { id: 'pa1', document: '1234567890', firstName: 'Juan',  lastName: 'García', birthdate: new Date('2002-01-02'), phone: '3001234567', gender: 'MASCULINO', email: 'juan@email.com', isActive: true },
    { id: 'pa2', document: '9876543210', firstName: 'María', lastName: 'López', birthdate: new Date('1995-05-15'), phone: '3109876543', gender: 'FEMENINO',  isActive: true },
    { id: 'pa3', document: '1122334455', firstName: 'Pedro', lastName: 'Suárez', birthdate: new Date('1988-03-20'), phone: '3201122334', gender: 'MASCULINO', isActive: true },
    ];

  findAll(): Observable<Patient[]> {
    return of([...this.data]);
  }

  findById(id: string): Observable<Patient | undefined> {
    return of(this.data.find(p => p.id === id));
  }

  search(term: string): Observable<Patient[]> {
    if (!term || term.trim().length < 2) return of([]);
    const lower = term.toLowerCase().trim();
    return of(this.data.filter(p =>
      p.firstName.toLowerCase().includes(lower)  ||
      p.lastName.toLowerCase().includes(lower)   ||
      p.document.includes(lower)               ||
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(lower)
    ));
  }

  save(dto: CreatePatientDto): Observable<Patient> {
    const newPatient: Patient = {
      id:     crypto.randomUUID(),
      ...dto,
      gender: dto.gender as Patient['gender'],
    };
    this.data.push(newPatient);
    return of(newPatient);
  }

  update(id: string, dto: UpdatePatientDto): Observable<Patient> {
    const index = this.data.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Paciente no encontrado');
    this.data[index] = { ...this.data[index], ...dto };
    return of(this.data[index]);
  }

  deactivate(id: string): Observable<Patient> {
    return this.update(id, { isActive: false } as any);
  }

  delete(id: string): Observable<void> {
    const index = this.data.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Paciente no encontrado');
    this.data.splice(index, 1);
    return of(void 0);
  }
}