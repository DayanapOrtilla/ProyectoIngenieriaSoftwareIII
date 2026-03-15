import { Pipe, PipeTransform } from '@angular/core';
import type { Specialty } from '../../core/models/professional';

const LABELS: Record<Specialty, string> = {
  TERAPIA_NEURAL: 'Terapia neural',
  QUIROPRAXIA:    'Quiropraxia',
  FISIOTERAPIA:   'Fisioterapia',
};

@Pipe({ name: 'specialtyLabel', standalone: true })
export class SpecialtyLabelPipe implements PipeTransform {
  transform(specialty: Specialty | null): string {
    if (!specialty) return '';
    return LABELS[specialty] ?? specialty;
  }
}