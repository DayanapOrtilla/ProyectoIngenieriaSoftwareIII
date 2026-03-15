import { Pipe, PipeTransform } from '@angular/core';
import type { AppointmentStatus } from '../../core/models/appointment';

const LABELS: Record<AppointmentStatus, string> = {
  PENDING:   'Pendiente',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Realizada',
  CANCELLED: 'Cancelada',
  NO_SHOW:   'No asistió',
};

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(status: AppointmentStatus): string {
    return LABELS[status] ?? status;
  }
}