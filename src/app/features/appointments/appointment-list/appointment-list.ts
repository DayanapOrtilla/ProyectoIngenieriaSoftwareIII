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
import { environment } from '../../../../environments/environment';

@Component({
  selector:    'app-appointment-list',
  standalone:  true,
  imports:     [RouterLink, FormsModule, StatusLabelPipe, StatusBadgePipe, SpecialtyLabelPipe],
  templateUrl: './appointment-list.html',
})
export class AppointmentListComponent implements OnInit, OnDestroy {
  private appointmenSvc   = inject(AppointmentsService);
  private professionalSvc = inject(ProfessionalsService);
  private subs = new Subscription();

  protected appointments  = signal<Appointment[]>([]);
  protected professionals = signal<Professional[]>([]);
  protected loading = false;

  protected selectedProfessionalId = '';
  protected selectedDate = new Date().toISOString().split('T')[0];

  // Re-agendamiento
  protected showRescheduleModal = false;
  protected selectedAppointment: Appointment | null = null;
  protected rescheduleDate = '';
  protected rescheduleTime = '';
  protected rescheduleReason = '';
  protected rescheduleLoading = false;
  protected rescheduleError: string | null = null;

  protected get total()     { return this.appointments().length; }
  protected get confirmed() { return this.appointments().filter(a => a.status === 'CONFIRMADA').length; }
  protected get pending()   { return this.appointments().filter(a => a.status === 'PENDIENTE').length; }
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
    const sub = this.appointmenSvc.getHistory(
      undefined,
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

  protected exportCsv(): void {
    const token = localStorage.getItem('pa_token');
    let url = `${environment.apiUrl}/appointments/export?`;
    if (this.selectedProfessionalId) url += `professionalId=${this.selectedProfessionalId}&`;
    if (this.selectedDate) url += `date=${this.selectedDate}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `citas_${this.selectedDate || 'todas'}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
      });
  }

  protected openReschedule(appt: Appointment): void {
    this.selectedAppointment = appt;
    this.rescheduleDate = appt.date;
    this.rescheduleTime = appt.time;
    this.rescheduleReason = '';
    this.rescheduleError = null;
    this.showRescheduleModal = true;
  }

  protected closeReschedule(): void {
    this.showRescheduleModal = false;
    this.selectedAppointment = null;
    this.rescheduleError = null;
  }

  protected confirmReschedule(): void {
    if (!this.rescheduleDate || !this.rescheduleTime) {
      this.rescheduleError = 'La fecha y hora son obligatorias.';
      return;
    }

    if (!this.selectedAppointment) return;

    this.rescheduleLoading = true;
    this.rescheduleError = null;

    const sub = this.appointmenSvc.reschedule(
      this.selectedAppointment.id,
      this.rescheduleDate,
      this.rescheduleTime,
      this.rescheduleReason
    ).subscribe({
      next: () => {
        this.rescheduleLoading = false;
        this.closeReschedule();
        this.loadAppointments();
      },
      error: (err) => {
        this.rescheduleLoading = false;
        this.rescheduleError = err.error?.message || 'Error al re-agendar la cita.';
      }
    });
    this.subs.add(sub);
  }

  protected update(id: string) {
    // TODO: implement
  }

  protected delete(id: string) {
    this.appointmenSvc.delete(id);
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