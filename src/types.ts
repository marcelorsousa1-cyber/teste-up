export type Role = 'PARTNER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'UNDER_REVIEW' | 'SUSPENDED';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  role: Role;
  status: UserStatus;
  adminCode?: string;
  createdAt: string;
}

export type LeadStatus = 'PENDING' | 'IN_SERVICE' | 'COMPLETED' | 'REJECTED';
export type VehicleType = 'Carro' | 'Caminhão' | 'Camionete' | 'Moto' | 'Agrícola';

export interface Lead {
  id: string;
  partnerId: string;
  partnerName?: string;
  clientName: string;
  clientPhone: string;
  vehicleType: VehicleType;
  location?: {
    latitude: number;
    longitude: number;
  };
  status: LeadStatus;
  serviceValue?: number;
  commissionPercent?: number;
  commissionValue?: number;
  qrCode?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  partnerId: string;
  month: string;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  dueDate: string;
  createdAt: string;
}

export interface AppConfig {
  primaryColor: string;
}
