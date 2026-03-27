import type { UserRole } from '../app/core/models/user';

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  useMock: false,  // ← true mientras no hay implementación del backend
  mockUsers : [
    { id: '1', email: 'admin@piedra-azul.com',     password: 'admin123',    role: 'ADMINISTRADOR'      as UserRole, isActive: true },
    { id: '2', email: 'agenda@piedra-azul.com',    password: 'agenda123',   role: 'AGENDADOR'  as UserRole, isActive: true },
    { id: '3', email: 'medico@piedra-azul.com',    password: 'medico123',   role: 'MEDICO'     as UserRole, isActive: true },
    { id: '4', email: 'paciente@piedra-azul.com',  password: 'paciente123', role: 'PACIENTE'   as UserRole, isActive: true },
    { id: '5', email: 'nuevo@piedra-azul.com', password: '12345678', role: 'PACIENTE' as UserRole, isActive: true },
  ]
};