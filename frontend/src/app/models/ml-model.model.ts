export interface MLModelVersion {
  id: string;
  name: string;
  algorithm: string;
  version: string;
  trainedAt: string;
  maeMw: number;
  rmseMw: number;
  mapePercent: number;
  featuresCount: number;
  status: 'ACTIF' | 'ARCHIVE' | 'EN_EVALUATION';
  description: string;
  horizonDays: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  userRole: string;
  action: string;
  target: string;
  status: 'SUCCES' | 'AVERTISSEMENT' | 'ECHEC';
  details: string;
}
