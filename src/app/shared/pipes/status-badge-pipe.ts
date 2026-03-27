import { Pipe, PipeTransform } from '@angular/core';
import type { AppointmentStatus } from '../../core/models/appointment';

const BADGES: Record<AppointmentStatus, string> = {
  PENDIENTE:   'bg-warning text-dark',
  CONFIRMADA: 'bg-primary',
  COMPLETADA: 'bg-success',
  CANCELADA: 'bg-danger',
  NO_ASISTE:   'bg-secondary',
};

@Pipe({ name: 'statusBadge', standalone: true })
export class StatusBadgePipe implements PipeTransform {
  transform(status: AppointmentStatus): string {
    return BADGES[status] ?? 'bg-secondary';
  }
}