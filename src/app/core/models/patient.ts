export type Gender = 'MASCULINO' | 'FEMENINO' | 'OTRO';

export interface Patient {
  id: string;
  document: string;
  firstName: string;
  lastName: string;
  birthdate?: Date;
  phone: string;
  gender: Gender;
  email?: string;
  isActive: boolean;
  userId?: string; // opcional: solo si creó cuenta
}