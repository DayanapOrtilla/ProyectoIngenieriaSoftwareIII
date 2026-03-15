import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router, ActivatedRoute }  from '@angular/router';
import { FormsModule }             from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subscription }            from 'rxjs';
import { AppointmentsService, BookingState, EMPTY_BOOKING } from '../appointments.service';
import { PatientsService, CreatePatientDto } from '../../patients/patients.service';
import { AuthService }             from '../../../core/services/auth.service';
import type { Professional }       from '../../../core/models/professional';
import type { Specialty }          from '../../../core/models/professional';
import type { Patient }            from '../../../core/models/patient';
import { SpecialtyLabelPipe }      from '../../../shared/pipes/specialty-label-pipe';

const SPECIALTY_DESCRIPTIONS: Record<Specialty, string> = {
  QUIROPRAXIA:    'Ajuste y alineación de columna vertebral',
  FISIOTERAPIA:   'Rehabilitación física y muscular',
  TERAPIA_NEURAL: 'Tratamiento del sistema nervioso',
};

@Component({
  selector:    'app-appointment-form',
  standalone:  true,
  imports:     [SpecialtyLabelPipe, FormsModule, ReactiveFormsModule],
  templateUrl: './appointment-form.html',
})
export class AppointmentFormComponent implements OnInit, OnDestroy {
  private svc            = inject(AppointmentsService);
  private patientsSvc    = inject(PatientsService);
  private auth           = inject(AuthService);
  private router         = inject(Router);
  private route          = inject(ActivatedRoute);
  private fb             = inject(FormBuilder);
  private subs           = new Subscription();

  // ── Modo del formulario ──────────────────────────────────
  // 'patient'   → ruta /appointments/book   (HU-2.2)
  // 'scheduler' → ruta /appointments/new    (HU-1.2)
  protected isSchedulerMode = signal(false);

  // ── Estado del wizard ────────────────────────────────────
  protected currentStep = 1;
  protected totalSteps  = 3;
  protected booking: BookingState = { ...EMPTY_BOOKING };
  protected confirmed   = false;
  protected loading     = false;
  protected errorMsg: string | null = null;

  // ── Paso 1: datos del paciente (modo agendador) ──────────
  protected searchTerm          = '';
  protected searchResults:  Patient[] = [];
  protected selectedPatient: Patient | null = null;
  protected showNewPatientForm  = false;
  protected searchLoading       = false;

  protected patientForm = this.fb.group({
    documentId: ['', [Validators.required]],
    firstName:  ['', [Validators.required]],
    lastName:   ['', [Validators.required]],
    phone:      ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    gender:     ['', [Validators.required]],
    email:      ['', [Validators.email]],
  });

  // ── Paso 1: especialidad y profesional ───────────────────
  protected specialties:   Specialty[]    = [];
  protected professionals: Professional[] = [];
  protected specialtyDescriptions         = SPECIALTY_DESCRIPTIONS;

  // ── Paso 2: fecha y hora ─────────────────────────────────
  protected availableSlots: string[] = [];

  protected get minDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  protected get maxDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 28);
    return d.toISOString().split('T')[0];
  }

  // ── Validaciones de pasos ────────────────────────────────
  protected get canGoStep2(): boolean {
    if (this.isSchedulerMode()) {
      return this.selectedPatient !== null &&
             this.booking.specialty    !== null &&
             this.booking.professional !== null;
    }
    return this.booking.specialty    !== null &&
           this.booking.professional !== null;
  }

  protected get canGoStep3(): boolean {
    return this.booking.date      !== null &&
           this.booking.startTime !== null;
  }

  // ── Ciclo de vida ────────────────────────────────────────
  ngOnInit(): void {
    this.isSchedulerMode.set(this.route.snapshot.data['mode'] === 'scheduler');
    console.log('isSchedulerMode:', this.isSchedulerMode); // verificar
    this.loadSpecialties();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ── Búsqueda de paciente (modo agendador) ────────────────
  protected onSearchChange(term: string): void {
    this.searchTerm    = term;
    this.selectedPatient = null;

    if (term.trim().length < 2) {
      this.searchResults = [];
      return;
    }

    this.searchLoading = true;
    const sub = this.patientsSvc.search(term).subscribe({
      next:  (data) => { this.searchResults = data; this.searchLoading = false; },
      error: ()     => { this.searchLoading = false; }
    });
    this.subs.add(sub);
  }

  protected selectPatient(patient: Patient): void {
    this.selectedPatient    = patient;
    this.searchResults      = [];
    this.searchTerm         = `${patient.firstName} ${patient.lastName}`;
    this.showNewPatientForm = false;
  }

  protected clearPatient(): void {
    this.selectedPatient    = null;
    this.searchTerm         = '';
    this.searchResults      = [];
    this.showNewPatientForm = false;
  }

  protected toggleNewPatientForm(): void {
    this.showNewPatientForm = !this.showNewPatientForm;
    this.selectedPatient    = null;
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
        this.selectedPatient    = patient;
        this.showNewPatientForm = false;
        this.searchTerm         = `${patient.firstName} ${patient.lastName}`;
        this.loading            = false;
      },
      error: () => { this.loading = false; }
    });
    this.subs.add(sub);
  }

  // ── Especialidad y profesional ───────────────────────────
  private loadSpecialties(): void {
    const sub = this.svc.getAvailableSpecialties().subscribe({
      next: (data) => { this.specialties = data; },
    });
    this.subs.add(sub);
  }

  protected selectSpecialty(specialty: Specialty): void {
    if (this.booking.specialty !== specialty) {
      this.booking.professional = null;
      this.professionals        = [];
    }
    this.booking.specialty = specialty;
    this.loading           = true;

    const sub = this.svc.getProfessionalsBySpecialty(specialty).subscribe({
      next:  (data) => { this.professionals = data; this.loading = false; },
      error: ()     => { this.loading = false; }
    });
    this.subs.add(sub);
  }

  protected selectProfessional(prof: Professional): void {
    this.booking.professional = prof;
  }

  // ── Fecha y hora ─────────────────────────────────────────
  protected onDateChange(date: string): void {
    this.booking.date      = date;
    this.booking.startTime = null;
    this.booking.endTime   = null;
    this.availableSlots    = [];

    if (!date || !this.booking.professional) return;

    this.loading = true;
    const sub = this.svc.getAvailableSlots(this.booking.professional.id, date).subscribe({
      next:  (slots) => { this.availableSlots = slots; this.loading = false; },
      error: ()      => { this.loading = false; }
    });
    this.subs.add(sub);
  }

  protected selectSlot(slot: string): void {
    this.booking.startTime = slot;
    this.booking.endTime   = this.svc.calculateEndTime(
      slot,
      this.booking.professional!.intervalMinutes
    );
  }

  // ── Confirmación ─────────────────────────────────────────
  protected confirm(): void {
    this.loading  = true;
    this.errorMsg = null;

    const sub = this.svc.confirmAppointment(this.booking).subscribe({
      next:  () => { this.loading = false; this.confirmed = true; },
      error: () => {
        this.loading  = false;
        this.errorMsg = 'Ocurrió un error al agendar la cita. Por favor intente de nuevo.';
      }
    });
    this.subs.add(sub);
  }

  // ── Navegación ───────────────────────────────────────────
  protected goToStep(step: number): void {
    this.errorMsg    = null;
    this.currentStep = step;
  }

  protected goBack(): void {
    this.router.navigate(['/appointments']);
  }

  protected goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // ── Helpers ──────────────────────────────────────────────
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
      year:    'numeric',
      month:   'long',
      day:     'numeric',
    });
  }

  protected isInvalid(field: string): boolean {
    const ctrl = this.patientForm.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }
}