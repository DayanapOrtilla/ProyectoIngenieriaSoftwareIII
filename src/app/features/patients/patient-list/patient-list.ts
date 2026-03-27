import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink }       from '@angular/router';
import { FormsModule }      from '@angular/forms';
import { Subscription }     from 'rxjs';
import { AuthService }      from '../../../core/services/auth.service';
import { PatientsService }  from '../../../core/services/patients.service';
import type { Patient }     from '../../../core/models/patient';

@Component({
  selector:    'app-patient-list',
  standalone:  true,
  imports:     [RouterLink, FormsModule],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.css'
})
export class PatientListComponent implements OnInit, OnDestroy {
  private svc  = inject(PatientsService);
  private subs = new Subscription();
  protected auth = inject(AuthService);

  protected patients = signal<Patient[]> ([]);
  protected loading  = false;
  protected searchTerm = '';

  // Permisos por rol
  protected get canDelete()     { return this.auth.hasRole('ADMINISTRADOR'); }
  protected get canDeactivate() { return this.auth.hasRole('AGENDADOR', 'ADMINISTRADOR'); }

  protected get filtered(): Patient[] {
    if (!this.searchTerm || this.searchTerm.trim().length < 2) {
      return this.patients();
    }
    const lower = this.searchTerm.toLowerCase().trim();
    return this.patients().filter(p =>
      p.firstName.toLowerCase().includes(lower)  ||
      p.lastName.toLowerCase().includes(lower)   ||
      p.document.includes(lower)               ||
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(lower)
    );
  }

  protected get totalActive(): number {
    return this.patients().filter(p => p.isActive).length;
  }

  protected get totalInactive(): number {
    return this.patients().filter(p => !p.isActive).length;
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private load(): void {
    this.loading = true;
    const sub = this.svc.getAll().subscribe({
      next:  (data) => { this.patients.set(data); this.loading = false; },
      error: ()     => { this.loading = false; }
    });
    this.subs.add(sub);
  }

  protected deactivate(patient: Patient): void {
    const sub = this.svc.deactivate(patient.id).subscribe({
      next: () => { this.load(); }
    });
    this.subs.add(sub);
  }

  protected delete(patient: Patient): void {
    const sub = this.svc.delete(patient.id).subscribe({
      next: () => { this.load(); }
    });
    this.subs.add(sub);
  }
}