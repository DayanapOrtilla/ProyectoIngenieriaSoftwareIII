import { Pipe, PipeTransform } from '@angular/core';
import type { AppointmentStatus } from '../../core/models/appointment';

const LABELS: Record<AppointmentStatus, string> = {
  PENDIENTE:   'PENDIENTE',
  CONFIRMADA: 'CONFIRMADA',
  COMPLETADA: 'COMPLETADA',
  CANCELADA: 'CANCELADA',
  NO_ASISTE:   'NO ASISTE',
};

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(status: AppointmentStatus): string {
    return LABELS[status] ?? status;
  }
}