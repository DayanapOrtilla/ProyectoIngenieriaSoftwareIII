import type { Patient } from './patient'; 
import type { Professional } from './professional';

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'; 

export interface Appointment { 
    id: string; 
    date: string; // "2026-03-20" 
    startTime: string; // "09:00" 
    endTime: string; // "09:30" 
    status: AppointmentStatus; notes?: string; 
    patient: Pick<Patient, 'id' | 'firstName' | 'lastName' | 'phone'>; 
    professional: Pick<Professional, 'id' | 'firstName' | 'lastName' | 'specialty' | 'type'>; 
}