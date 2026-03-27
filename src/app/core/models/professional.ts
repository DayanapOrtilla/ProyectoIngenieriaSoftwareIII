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