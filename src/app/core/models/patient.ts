export type Gender = 'MASCULINO' | 'FEMENINO' | 'OTRO';

export interface Patient {
  id:         string;
  documentId: string;
  firstName:  string;
  lastName:   string;
  phone:      string;
  gender:     Gender;
  email?:     string;
  isActive:   boolean;
  userId?:    string; // opcional: solo si creó cuenta
}