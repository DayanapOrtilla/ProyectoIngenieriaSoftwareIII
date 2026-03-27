import { Component, inject, OnInit, OnDestroy, signal, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { of, Subject, Subscription }            from 'rxjs';
import { AppointmentsService, BookingState, EMPTY_BOOKING } from '../../../core/services/appointments.service';
import { PatientsService, CreatePatientDto } from '../../../core/services/patients.service';
import { AuthService }             from '../../../core/services/auth.service';
import type { Professional }       from '../../../core/models/professional';
import type { Specialty }          from '../../../core/models/professional';
import type { Patient }            from '../../../core/models/patient';
import { SpecialtyLabelPipe }      from '../../../shared/pipes/specialty-label-pipe';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError, finalize } from 'rxjs/operators';
import { StatusLabelPipe } from '../../../shared/pipes/status-label-pipe';

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
  private cdr = inject(ChangeDetectorRef);
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

  private searchSubject = new Subject<string>();

  protected patientForm = this.fb.group({
    documentId: ['', [Validators.required]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    gender: ['', [Validators.required]],
    email: ['', [Validators.email]],
  });

  protected specialties = signal<Specialty[]>([]);
  protected professionals = signal<Professional[]>([]);
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

  // ESTA ES LA SOLUCIÓN:
  this.subs.add(
    this.searchSubject.pipe(
      debounceTime(300),           // Espera 300ms después de que dejes de escribir
      distinctUntilChanged(),      // No busca si el texto es igual al anterior
      switchMap(term => {
        if (term.trim().length < 3) {
          this.searchLoading = false;
          return of([]); 
        }
        this.searchLoading = true; // Encendemos spinner
        return this.patientsSvc.search(term).pipe(
          catchError(() => of([])), // Si hay error, devuelve lista vacía
          finalize(() => this.searchLoading = false) // ¡ESTO QUITA EL SPINNER SIEMPRE!
        );
      })
    ).subscribe(data => {
      this.searchResults = data || [];
      this.searchLoading = false; // Refuerzo para apagar el spinner
    })
  );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  protected onSearchChange(term: string): void {
    this.searchTerm = term;
    this.selectedPatient = null;

    // Si es menor a 3, limpiamos y forzamos refresco
    if (term.trim().length < 3) {
      this.searchResults = [];
      this.searchLoading = false;
      this.cdr.detectChanges(); 
      return;
    }

    this.searchLoading = true;
    this.cdr.detectChanges(); // Para que el spinner aparezca YA

    const sub = this.patientsSvc.search(term).subscribe({
      next: (data) => {
        this.searchResults = data || [];
        this.searchLoading = false;
        this.cdr.detectChanges(); // PARA QUE EL SPINNER SE QUITE Y SALGA SILVANA
      },
      error: () => {
        this.searchResults = [];
        this.searchLoading = false;
        this.cdr.detectChanges();
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
        this.specialties.set(data);
      },
    });

    this.subs.add(sub);
  }

  protected selectSpecialty(specialty: Specialty): void {
    if (this.booking.specialty !== specialty) {
      this.booking.professional = null;
      this.professionals.set([]);
      this.booking.date = null;
      this.booking.startTime = null;
      this.booking.endTime = null;
      this.availableSlots = [];
    }

    this.booking.specialty = specialty;
    this.loading = true;

    const sub = this.svc.getProfessionalsBySpecialty(specialty).subscribe({
      next: (data) => {
        this.professionals.set(data);

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
    this.availableSlots = []; // Limpiar lista vieja inmediatamente

    if (!date || !this.booking.professional) {
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    const sub = this.svc.getAvailableSlots(this.booking.professional.id, date).subscribe({
      next: (slots) => {
        this.availableSlots = slots || [];
        this.loading = false;
        this.cdr.detectChanges(); // PARA QUE APAREZCAN LOS BOTONES DE HORA
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
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
    // 1. Extraer datos y asegurar que no sean null para TS
  const dateValue = this.booking.date;
  const timeValue = this.booking.startTime;
  const professionalId = this.booking.professional?.id;
  
  // 2. Determinar el ID del paciente según el modo
  let patientId: string | undefined;
  
  if (this.isSchedulerMode()) {
    patientId = this.selectedPatient?.id;
  } else {
    // Si es modo paciente, sacamos el ID del usuario logueado
    patientId = this.auth.currentUser()?.id;
  }

  // 3. Validación de seguridad antes de disparar
  if (!dateValue || !timeValue || !professionalId || !patientId) {
    this.errorMsg = 'Faltan datos obligatorios para confirmar la cita.';
    this.cdr.detectChanges();
    return;
  }

  this.loading = true;
  this.errorMsg = null;
  this.cdr.detectChanges();

  // 4. PAYLOAD: Enviamos exactamente lo que el backend pide
  const appointmentPayload = {
    date: new Date(dateValue + 'T12:00:00'), // Instancia de Date real para el validador
    time: timeValue,                         // El string 'HH:mm'
    status: 'CONFIRMADA',                    // O 'PENDIENTE', según tu enum
    professionalId: professionalId,          // El UUID, no la función
    patientId: patientId                     // El UUID, no la función
  };

  const sub = this.svc.confirmAppointment(appointmentPayload as any).subscribe({
    next: () => {
      this.loading = false;
      this.confirmed = true;
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.loading = false;
      console.error('Error al guardar:', err);
      const errorData = err.error?.message;
      // Manejo de array de errores de NestJS
      this.errorMsg = Array.isArray(errorData) ? errorData[0] : (errorData || 'Error al confirmar la cita');
      this.cdr.detectChanges();
    }
  });

  this.subs.add(sub);
  }

  protected goToStep(step: number): void {
    this.errorMsg = null;
    this.currentStep = step;

    // Si pasamos al paso 2 y ya hay datos, disparamos la carga
    if (step === 2 && this.booking.date && this.booking.professional) {
      this.onDateChange(this.booking.date);
    }
    this.cdr.detectChanges();
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