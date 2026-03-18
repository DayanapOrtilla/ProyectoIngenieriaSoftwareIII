import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
<<<<<<< HEAD
import { Subscription }            from 'rxjs';
import { AppointmentsService, BookingState, EMPTY_BOOKING } from '../../../core/services/appointments.service';
import { PatientsService, CreatePatientDto } from '../../../core/services/patients.service';
import { AuthService }             from '../../../core/services/auth.service';
import type { Professional }       from '../../../core/models/professional';
import type { Specialty }          from '../../../core/models/professional';
import type { Patient }            from '../../../core/models/patient';
import { SpecialtyLabelPipe }      from '../../../shared/pipes/specialty-label-pipe';
=======
import { Subscription } from 'rxjs';
import { AppointmentsService, BookingState, EMPTY_BOOKING } from '../appointments.service';
import { PatientsService, CreatePatientDto } from '../../patients/patients.service';
import { AuthService } from '../../../core/services/auth.service';
import type { Professional, Specialty } from '../../../core/models/professional';
import type { Patient } from '../../../core/models/patient';
import { SpecialtyLabelPipe } from '../../../shared/pipes/specialty-label-pipe';
>>>>>>> d1d6e2b283614a3e9f889296394e84fafa10fd01

const SPECIALTY_DESCRIPTIONS: Record<Specialty, string> = {
  QUIROPRAXIA: 'Ajuste y alineación de columna vertebral',
  FISIOTERAPIA: 'Rehabilitación física y muscular',
  TERAPIA_NEURAL: 'Tratamiento del sistema nervioso',
};

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [SpecialtyLabelPipe, FormsModule, ReactiveFormsModule],
  templateUrl: './appointment-form.html',
})
export class AppointmentFormComponent implements OnInit, OnDestroy {
  private svc = inject(AppointmentsService);
  private patientsSvc = inject(PatientsService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private subs = new Subscription();

  protected isSchedulerMode = signal(false);

  protected currentStep = 1;
  protected totalSteps = 3;
  protected booking: BookingState = { ...EMPTY_BOOKING };
  protected confirmed = false;
  protected loading = false;
  protected errorMsg: string | null = null;

  protected searchTerm = '';
  protected searchResults: Patient[] = [];
  protected selectedPatient: Patient | null = null;
  protected showNewPatientForm = false;
  protected searchLoading = false;

  protected patientForm = this.fb.group({
    documentId: ['', [Validators.required]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    gender: ['', [Validators.required]],
    email: ['', [Validators.email]],
  });

  protected specialties: Specialty[] = [];
  protected professionals: Professional[] = [];
  protected specialtyDescriptions = SPECIALTY_DESCRIPTIONS;

  protected availableSlots: string[] = [];

  protected get minDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  protected get maxDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 28);
    return d.toISOString().split('T')[0];
  }

  protected get canGoStep2(): boolean {
    if (this.isSchedulerMode()) {
      return (
        this.selectedPatient !== null &&
        this.booking.specialty !== null &&
        this.booking.professional !== null
      );
    }

    return (
      this.booking.specialty !== null &&
      this.booking.professional !== null
    );
  }

  protected get canGoStep3(): boolean {
    return this.booking.date !== null && this.booking.startTime !== null;
  }

  ngOnInit(): void {
    this.isSchedulerMode.set(this.route.snapshot.data['mode'] === 'scheduler');
    this.loadSpecialties();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  protected onSearchChange(term: string): void {
    this.searchTerm = term;
    this.selectedPatient = null;

    if (term.trim().length < 2) {
      this.searchResults = [];
      return;
    }

    this.searchLoading = true;

    const sub = this.patientsSvc.search(term).subscribe({
      next: (data) => {
        this.searchResults = data;
        this.searchLoading = false;
      },
      error: () => {
        this.searchLoading = false;
      }
    });

    this.subs.add(sub);
  }

  protected selectPatient(patient: Patient): void {
    this.selectedPatient = patient;
    this.searchResults = [];
    this.searchTerm = `${patient.firstName} ${patient.lastName}`;
    this.showNewPatientForm = false;
  }

  protected clearPatient(): void {
    this.selectedPatient = null;
    this.searchTerm = '';
    this.searchResults = [];
    this.showNewPatientForm = false;
  }

  protected toggleNewPatientForm(): void {
    this.showNewPatientForm = !this.showNewPatientForm;
    this.selectedPatient = null;

    if (this.showNewPatientForm) {
      this.patientForm.reset();
    }
  }

  protected saveNewPatient(): void {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const sub = this.patientsSvc.create(this.patientForm.value as CreatePatientDto).subscribe({
      next: (patient) => {
        this.selectedPatient = patient;
        this.showNewPatientForm = false;
        this.searchTerm = `${patient.firstName} ${patient.lastName}`;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    this.subs.add(sub);
  }

  private loadSpecialties(): void {
    const sub = this.svc.getAvailableSpecialties().subscribe({
      next: (data) => {
        this.specialties = data;
      },
    });

    this.subs.add(sub);
  }

  protected selectSpecialty(specialty: Specialty): void {
    if (this.booking.specialty !== specialty) {
      this.booking.professional = null;
      this.professionals = [];
      this.booking.date = null;
      this.booking.startTime = null;
      this.booking.endTime = null;
      this.availableSlots = [];
    }

    this.booking.specialty = specialty;
    this.loading = true;

    const sub = this.svc.getProfessionalsBySpecialty(specialty).subscribe({
      next: (data) => {
        this.professionals = data;

        if (data.length > 0) {
          this.booking.professional = data[0];
        } else {
          this.booking.professional = null;
        }

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    this.subs.add(sub);
  }

  protected selectProfessional(prof: Professional): void {
    this.booking.professional = prof;
    this.booking.startTime = null;
    this.booking.endTime = null;
    this.availableSlots = [];

    if (this.booking.date) {
      this.onDateChange(this.booking.date);
    }
  }

  protected onDateChange(date: string): void {
    this.booking.date = date;
    this.booking.startTime = null;
    this.booking.endTime = null;
    this.availableSlots = [];

    if (!date || !this.booking.professional) {
      return;
    }

    this.loading = true;

    const sub = this.svc.getAvailableSlots(this.booking.professional.id, date).subscribe({
      next: (slots) => {
        this.availableSlots = slots;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    this.subs.add(sub);
  }

  protected selectSlot(slot: string): void {
    this.booking.startTime = slot;
    this.booking.endTime = this.svc.calculateEndTime(
      slot,
      this.booking.professional!.intervalMinutes
    );
  }

  protected confirm(): void {
<<<<<<< HEAD
    // Modo paciente: asigna el usuario actual como paciente
    if (!this.isSchedulerMode()) {
      const user = this.auth.currentUser();
      this.booking.patient = {
        id:        user!.id,
        firstName: user!.email.split('@')[0], // temporal hasta tener perfil completo
        lastName:  '',
        phone:     '',
      };
    }
    // Modo agendador: el paciente ya está en this.selectedPatient
    else if (this.selectedPatient) {
      this.booking.patient = {
        id:        this.selectedPatient.id,
        firstName: this.selectedPatient.firstName,
        lastName:  this.selectedPatient.lastName,
        phone:     this.selectedPatient.phone,
      };
    }

=======
>>>>>>> d1d6e2b283614a3e9f889296394e84fafa10fd01
    this.loading = true;
    this.errorMsg = null;

    const sub = this.svc.confirmAppointment(this.booking).subscribe({
      next: () => {
        this.loading = false;
        this.confirmed = true;
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Ocurrió un error al agendar la cita. Por favor intente de nuevo.';
      }
    });

    this.subs.add(sub);
  }

  protected goToStep(step: number): void {
    this.errorMsg = null;
    this.currentStep = step;
  }

  protected goBack(): void {
    this.router.navigate(['/appointments']);
  }

  protected goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  protected isSelectedSpecialty(s: Specialty): boolean {
    return this.booking.specialty === s;
  }

  protected isSelectedProfessional(p: Professional): boolean {
    return this.booking.professional?.id === p.id;
  }

  protected isSelectedSlot(slot: string): boolean {
    return this.booking.startTime === slot;
  }

  protected formatDate(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  protected isInvalid(field: string): boolean {
    const ctrl = this.patientForm.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }
}