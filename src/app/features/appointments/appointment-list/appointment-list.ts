import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink }          from '@angular/router';
import { FormsModule }         from '@angular/forms';
import { Subscription }        from 'rxjs';
import { AppointmentsService } from '../../../core/services/appointments.service';
import type { Appointment }    from '../../../core/models/appointment';
import type { Professional }   from '../../../core/models/professional';
import { StatusLabelPipe }     from '../../../shared/pipes/status-label-pipe';
import { StatusBadgePipe }     from '../../../shared/pipes/status-badge-pipe';
import { SpecialtyLabelPipe }  from '../../../shared/pipes/specialty-label-pipe';
import { ProfessionalsService } from '../../../core/services/professionals.service';

@Component({
  selector:    'app-appointment-list',
  standalone:  true,
  imports:     [RouterLink, FormsModule, StatusLabelPipe, StatusBadgePipe, SpecialtyLabelPipe],
  templateUrl: './appointment-list.html',
})
export class AppointmentListComponent implements OnInit, OnDestroy {
  private svc  = inject(AppointmentsService);
  private professionalSvc = inject(ProfessionalsService);
  private subs = new Subscription();

  // ── Estado ────────────────────────────────────────────────
  protected appointments = signal<Appointment[]>([]);
  protected professionals = signal<Professional[]>([]);
  protected loading = false;

  // ── Filtros ───────────────────────────────────────────────
  protected selectedProfessionalId = '';
  protected selectedDate = new Date().toISOString().split('T')[0];

  // ── Contadores ────────────────────────────────────────────
  protected get total() { return this.appointments().length; }
  protected get confirmed() { return this.appointments().filter(a => a.status === 'CONFIRMADA').length; }
  protected get pending() { return this.appointments().filter(a => a.status === 'PENDIENTE').length; }
  protected get completed() { return this.appointments().filter(a => a.status === 'COMPLETADA').length; }

  ngOnInit(): void {
    this.loadProfessionals();
    this.loadAppointments();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private loadProfessionals(): void {
    const sub = this.professionalSvc.getAll().subscribe({
      next: (data) => { this.professionals.set(data.filter(p => p.isActive)); },
    });
    this.subs.add(sub);
  }

  protected loadAppointments(): void {
    this.loading = true;
  
  // Usamos el nuevo método que respeta el flujo de roles del backend
  const sub = this.svc.getHistory(
    this.selectedProfessionalId || undefined, 
    this.selectedDate || undefined
    ).subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.loading = false;
      },
      error: () => this.loading = false
    });
    
    this.subs.add(sub);
  }

  protected onFilterChange(): void {
    this.loadAppointments();
  }
}