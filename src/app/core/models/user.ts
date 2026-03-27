export type UserRole = 'ADMINISTRADOR' | 'AGENDADOR' | 'MEDICO' | 'TERAPISTA' | 'PACIENTE';

export interface User {
  id:       string;
  user:    string;
  role:     UserRole;
  isActive: boolean;
}

export interface AuthResponse {
  access_token: string;
  user:         User;
}

export interface LoginCredentials {
  user:    string;
  password: string;
}