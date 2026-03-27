import { Pipe, PipeTransform } from '@angular/core';
import type { Specialty } from '../../core/models/professional';

const LABELS: Record<Specialty, string> = {
  TERAPIA_NEURAL: 'TERAPIA NEURAL',
  QUIROPRAXIA:    'QUIROPRAXIA',
  FISIOTERAPIA:   'FISIOTERAPIA',
};

@Pipe({ name: 'specialtyLabel', standalone: true })
export class SpecialtyLabelPipe implements PipeTransform {
  transform(specialty: Specialty | null): string {
    if (!specialty) return '';
    return LABELS[specialty] ?? specialty;
  }
}