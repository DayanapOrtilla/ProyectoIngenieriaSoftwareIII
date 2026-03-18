export type ProfessionalType = 'MEDICO' | 'TERAPISTA';
export type Specialty        = 'TERAPIA_NEURAL' | 'QUIROPRAXIA' | 'FISIOTERAPIA';

export interface Professional {
  id:              string;
  firstName:       string;
  lastName:        string;
  type:            ProfessionalType;
  specialty:       Specialty;
  intervalMinutes: number;
  isActive:        boolean;
  email:           string;
}

export interface Availability {
  id:             string;
  professionalId: string;
  dayOfWeek:      number; // 0=Domingo, 1=Lunes … 6=Sábado
  startTime:      string; // "08:00"
  endTime:        string; // "17:00"
}