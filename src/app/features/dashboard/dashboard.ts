// src/app/features/dashboard/dashboard.component.ts

import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
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
  protected appointments = signal<Appointment[]> ([]);
  protected professionals = signal<Professional[]> ([]);
  protected loading = false;

  // Filtros â€” propiedades normales ligadas al template con ngModel
  protected selectedDate             = new Date().toISOString().split('T')[0];
  protected selectedProfessionalId   = '';

  // Subscriptions agrupadas â€” las cancelamos todas juntas en ngOnDestroy
  // Para HTTP no es obligatorio (el Observable completa solo),
  // pero es buena prÃ¡ctica mantenerla desde el inicio
  private subs = new Subscription();

  // â”€â”€ Visibilidad por rol â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Getters en lugar de signals â€” Angular los evalÃºa cada vez
  // que el template los necesita, sin complejidad adicional
  protected get showAgenda()              { return this.auth.hasRole('ADMINISTRADOR', 'AGENDADOR', 'MEDICO', 'TERAPISTA'); }
  protected get showQuickActions()        { return this.auth.hasRole('AGENDADOR'); }
  protected get showProfessionals()       { return this.auth.hasRole('ADMINISTRADOR'); }
  protected get showPatientBooking()      { return this.auth.hasRole('PACIENTE'); }
  protected get showAppointmentMetrics()  { return this.auth.hasRole('ADMINISTRADOR', 'AGENDADOR', 'MEDICO', 'TERAPISTA'); }
  protected get showPatientMetrics()      { return this.auth.hasRole('PACIENTE'); }

  // â”€â”€ Datos filtrados â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Getter que filtra el array en memoria cada vez que cambia
  // un filtro. Cuando el backend estÃ© listo, esto se convierte
  // en una nueva llamada al servicio con los filtros como params.
  protected get filteredAppointments(): Appointment[] {
    return this.appointments().filter(a => {
      const byDate = !this.selectedDate           || a.date === this.selectedDate;
      const byProf = !this.selectedProfessionalId || a.professional.id === this.selectedProfessionalId;
      return byDate && byProf;
    });
  }

  protected get userName(): string {
  const currentUser = this.auth.currentUser();
  if (currentUser?.firstName || currentUser?.lastName) {
    return ((currentUser?.firstName ?? '') + ' ' + (currentUser?.lastName ?? '')).trim() || currentUser?.user || 'Usuario';
  }
  return currentUser?.user || 'Usuario';
}

  // â”€â”€ Contadores para mÃ©tricas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  protected get totalToday()     { return this.filteredAppointments.length; }
  protected get totalConfirmed() { return this.filteredAppointments.filter(a => a.status === 'CONFIRMADA').length; }
  protected get totalPending()   { return this.filteredAppointments.filter(a => a.status === 'PENDIENTE').length; }
  protected get totalCompleted() { return this.filteredAppointments.filter(a => a.status === 'COMPLETADA').length; }

  protected get activeProfessionals(): Professional[] {
    return this.professionals().filter(p => p.isActive);
  }

  

  // â”€â”€ Ciclo de vida â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ MÃ©todos privados â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private loadAppointments(): void {
  this.loading = true;

  let obs;

  if (this.auth.userRole() === 'PACIENTE') {
    // El paciente ve solo sus citas
    obs = this.appointmentSvc.getMyAppointments();
  } else {
    // ADMIN, AGENDADOR, MEDICO ven citas filtradas por profesional/fecha
    obs = this.appointmentSvc.findByProfessional(this.selectedProfessionalId, this.selectedDate);
  }

  const sub = obs.subscribe({
    next: (data) => {
      this.appointments.set(data);
      this.loading = false;
    },
    error: (err) => {
      console.error('Error cargando citas:', err);
      this.loading = false;
    }
  });

  this.subs.add(sub);
}

  private loadProfessionals(): void {
    const sub = this.proffesionalSvc.getAll().subscribe({
      next:  (data) => { this.professionals.set(data); },
      error: (err)  => { console.error('Error cargando profesionales:', err); }
    });

    this.subs.add(sub);
  }

  // Se llama desde el template cuando cambia un filtro
  protected onFilterChange(): void {
    this.loadAppointments();
  }

  formatTime(horaMilitar: string): string {
    if (!horaMilitar) return '';
    
    // Dividimos las horas y minutos
    const [horas, minutos] = horaMilitar.split(':');
    let horasNum = parseInt(horas, 10);
    const ampm = horasNum >= 12 ? 'pm' : 'am';
    
    // Convertimos al formato de 12 horas
    horasNum = horasNum % 12;
    horasNum = horasNum ? horasNum : 12; // El '0' se convierte en '12'
    
    // Agregamos el cero a la izquierda si es necesario
    const horasStr = horasNum < 10 ? '0' + horasNum : horasNum;
    
    return `${horasStr}:${minutos} ${ampm}`;
  }
}

