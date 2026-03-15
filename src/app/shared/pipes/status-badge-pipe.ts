import { Pipe, PipeTransform } from '@angular/core';
import type { AppointmentStatus } from '../../core/models/appointment';

const BADGES: Record<AppointmentStatus, string> = {
  PENDING:   'bg-warning text-dark',
  CONFIRMED: 'bg-primary',
  COMPLETED: 'bg-success',
  CANCELLED: 'bg-danger',
  NO_SHOW:   'bg-secondary',
};

@Pipe({ name: 'statusBadge', standalone: true })
export class StatusBadgePipe implements PipeTransform {
  transform(status: AppointmentStatus): string {
    return BADGES[status] ?? 'bg-secondary';
  }
}