export type UserRole = 'ADMIN' | 'AGENDADOR' | 'MEDICO' | 'TERAPISTA' | 'PACIENTE';

export interface User {
  id:       string;
  email:    string;
  role:     UserRole;
  isActive: boolean;
}

export interface AuthResponse {
  access_token: string;
  user:         User;
}

export interface LoginCredentials {
  email:    string;
  password: string;
}