// src/app/features/dashboard/dashboard.component.ts

import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink }    from '@angular/router';
import { FormsModule }   from '@angular/forms';
import { Subscription }  from 'rxjs';
import { AuthService }   from '../../core/services/auth.service';
import type { Appointment }   from '../../core/models/appointment';
import type { Professional }  from '../../core/models/professional';
import { StatusLabelPipe }    from '../../shared/pipes/status-label-pipe';
import { StatusBadgePipe }    from '../../shared/pipes/status-badge-pipe';
import { SpecialtyLabelPipe } from '../../shared/pipes/specialty-label-pipe';
import { AppointmentsService } from '../../core/services/appointments.service';
import { ProfessionalsService } from '../../core/services/professionals.service';


@Component({
  selector:    'app-dashboard',
  standalone:  true,
  imports:     [RouterLink, FormsModule, StatusLabelPipe, StatusBadgePipe, SpecialtyLabelPipe, ],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  protected auth = inject(AuthService);
  private appointmentSvc = inject(AppointmentsService);
  private proffesionalSvc = inject(ProfessionalsService);

  // Arrays donde guardamos los datos cuando llegan del Observable
  protected appointments:  Appointment[]  = [];
  protected professionals: Professional[] = [];
  protected loading = false;

  // Filtros — propiedades normales ligadas al template con ngModel
  protected selectedDate             = new Date().toISOString().split('T')[0];
  protected selectedProfessionalId   = '';

  // Subscriptions agrupadas — las cancelamos todas juntas en ngOnDestroy
  // Para HTTP no es obligatorio (el Observable completa solo),
  // pero es buena práctica mantenerla desde el inicio
  private subs = new Subscription();

  // ── Visibilidad por rol ──────────────────────────────────
  // Getters en lugar de signals — Angular los evalúa cada vez
  // que el template los necesita, sin complejidad adicional
  protected get showAgenda()              { return this.auth.hasRole('ADMIN', 'AGENDADOR', 'MEDICO', 'TERAPISTA'); }
  protected get showQuickActions()        { return this.auth.hasRole('AGENDADOR'); }
  protected get showProfessionals()       { return this.auth.hasRole('ADMIN'); }
  protected get showPatientBooking()      { return this.auth.hasRole('PACIENTE'); }
  protected get showAppointmentMetrics()  { return this.auth.hasRole('ADMIN', 'AGENDADOR', 'MEDICO', 'TERAPISTA'); }
  protected get showPatientMetrics()      { return this.auth.hasRole('PACIENTE'); }

  // ── Datos filtrados ──────────────────────────────────────
  // Getter que filtra el array en memoria cada vez que cambia
  // un filtro. Cuando el backend esté listo, esto se convierte
  // en una nueva llamada al servicio con los filtros como params.
  protected get filteredAppointments(): Appointment[] {
    return this.appointments.filter(a => {
      const byDate = !this.selectedDate           || a.date === this.selectedDate;
      const byProf = !this.selectedProfessionalId || a.professional.id === this.selectedProfessionalId;
      return byDate && byProf;
    });
  }

  // ── Contadores para métricas ─────────────────────────────
  protected get totalToday()     { return this.filteredAppointments.length; }
  protected get totalConfirmed() { return this.filteredAppointments.filter(a => a.status === 'CONFIRMED').length; }
  protected get totalPending()   { return this.filteredAppointments.filter(a => a.status === 'PENDING').length; }
  protected get totalCompleted() { return this.filteredAppointments.filter(a => a.status === 'COMPLETED').length; }

  protected get activeProfessionals(): Professional[] {
    return this.professionals.filter(p => p.isActive);
  }

  // ── Ciclo de vida ────────────────────────────────────────
  ngOnInit(): void {
    this.loadAppointments();

    // Solo cargamos profesionales si el rol los necesita
    if (this.showProfessionals) {
      this.loadProfessionals();
    }
  }

  ngOnDestroy(): void {
    // Cancela todas las subscripciones al destruir el componente
    this.subs.unsubscribe();
  }

  // ── Métodos privados ─────────────────────────────────────
  private loadAppointments(): void {
    this.loading = true;

    const sub = this.appointmentSvc.getAll().subscribe({
      next: (data) => {
        this.appointments = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando citas:', err);
        this.loading = false;
      }
    });

    this.subs.add(sub); // agrega al grupo de subscripciones
  }

  private loadProfessionals(): void {
    const sub = this.proffesionalSvc.getAll().subscribe({
      next:  (data) => { this.professionals = data; },
      error: (err)  => { console.error('Error cargando profesionales:', err); }
    });

    this.subs.add(sub);
  }

  // Se llama desde el template cuando cambia un filtro
  protected onFilterChange(): void {
    this.loadAppointments();
  }
}