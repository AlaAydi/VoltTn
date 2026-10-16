export type UserRole = 'CITOYEN' | 'OPERATEUR' | 'TECHNICIEN' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  phone: string;
  governorate: string;
  meterNumber?: string;
  address?: string;
  createdAt: string;
  status: 'ACTIF' | 'BLOQUE';
}
