export interface Availability {
  id:             string;
  professionalId: string;
  dayOfWeek:      number; // 0=Domingo, 1=Lunes … 6=Sábado
  startTime:      string; // "08:00"
  endTime:        string; // "17:00"
  isActive:       boolean;
}

export const DAY_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

export const AVAIL_DAYS = [1, 2, 3, 4, 5, 6, 0];