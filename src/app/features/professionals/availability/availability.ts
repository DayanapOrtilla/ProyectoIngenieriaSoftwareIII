import { Component, inject, signal, OnInit, OnDestroy, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';
import { ProfessionalsService } from '../../../core/services/professionals.service';
import { Availability, DAY_LABELS, AVAIL_DAYS } from '../../../core/models/availability';
import { Professional } from '../../../core/models/professional';

interface DayConfig {
  dayOfWeek: number;
  label:     string;
  isActive:  boolean;
  startTime: string;
  endTime:   string;
}

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './availability.html',
  styleUrl: './availability.css',
})
export class AvailabilityComponent implements OnInit, OnDestroy {
  private svc = inject(ProfessionalsService);
  private subs = new Subscription();

  private _professionalId: string = '';

  // RECIBIMOS EL ID DESDE EL PADRE
  @Input({ required: true })
  set professionalId(value: string | null | undefined) {
    // VALIDACIÓN CRUCIAL: Solo dispara la carga si es un string real
    if (value && typeof value === 'string' && value.length > 30) {
      this._professionalId = value;
      this.initDefaultDays();
      this.loadAllData();
    } else {
      console.warn('ID de profesional inválido recibido:', value);
    }
  }

  get professionalId(): string {
    return this._professionalId;
  }

  protected loading = signal(false);
  protected saving = signal(false);
  protected errorMsg = signal<string | null>(null);
  protected saved = signal(false);

  protected professional: Professional | undefined;
  protected days: DayConfig[] = [];

  ngOnInit(): void {
    if (this.professionalId && this.professionalId.length>30) {
      this.initDefaultDays();
      this.loadAllData();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private initDefaultDays(): void {
    this.days = AVAIL_DAYS.map(day => ({
      dayOfWeek: day,
      label:     DAY_LABELS[day],
      isActive:  false,
      startTime: '08:00',
      endTime:   '17:00',
    }));
  }

  private loadAllData(): void {
    this.loading.set(true);
    
    // Ejecutamos ambas peticiones en paralelo para ser más eficientes
    const dataSub = forkJoin({
      prof: this.svc.getById(this.professionalId),
      avail: this.svc.getAvailability(this.professionalId)
    }).subscribe({
      next: ({ prof, avail }) => {
        this.professional = prof;
        
        if (avail && avail.length > 0) {
          avail.forEach(a => {
            const day = this.days.find(d => d.dayOfWeek === a.dayOfWeek);
            if (day) {
              day.isActive = a.isActive;
              day.startTime = a.startTime;
              day.endTime = a.endTime;
            }
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Error al cargar la configuración.');
        this.loading.set(false);
      }
    });
    this.subs.add(dataSub);
  }

  protected save(): void {
    if (!this.isValid()) return;

    this.saving.set(true);
    this.errorMsg.set(null);

    const availability: Availability[] = this.days.map(d => ({
      id: crypto.randomUUID(),
      professionalId: this.professionalId,
      dayOfWeek: d.dayOfWeek,
      startTime: d.startTime,
      endTime: d.endTime,
      isActive: d.isActive,
    }));

    const sub = this.svc.saveAvailability(this.professionalId, availability).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: () => {
        this.saving.set(false);
        this.errorMsg.set('Error al guardar la disponibilidad.');
      }
    });
    this.subs.add(sub);
  }

  protected calcSlots(day: DayConfig): number {
    if (!this.professional || !day.isActive) return 0;
    const [startH, startM] = day.startTime.split(':').map(Number);
    const [endH, endM] = day.endTime.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const interval = this.professional.intervalMinutes;
    return Math.max(0, Math.floor((endMin - startMin) / interval));
  }

  private isValid(): boolean {
    const invalid = this.days.find(d => d.isActive && d.endTime <= d.startTime);
    if (invalid) {
      this.errorMsg.set(`En ${invalid.label}: la hora de fin debe ser mayor a la de inicio.`);
      return false;
    }
    if (!this.days.some(d => d.isActive)) {
      this.errorMsg.set('Debes activar al menos un día.');
      return false;
    }
    return true;
  }
}