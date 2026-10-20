export type OutageType = 
  | 'PANNE_TRANSFORMATEUR' 
  | 'LIGNE_COUPEE' 
  | 'SURCHARGE_RESEAU' 
  | 'MAINTENANCE_PREVENTIVE' 
  | 'TRAVAUX_PROGRAMMES'
  | 'INTEMPERIES';

export type OutageStatus = 'SIGNALE' | 'EN_COURS' | 'RESOLU';
export type OutageSeverity = 'MINEURE' | 'MOYENNE' | 'MAJEURE';

export interface OutageReport {
  id: string;
  reference: string;
  governorate: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  type: OutageType;
  status: OutageStatus;
  severity: OutageSeverity;
  reportedAt: string;
  estimatedResolution: string;
  affectedCustomers: number;
  reportedBy: string;
  assignedTechnician?: string;
  notes: string;
  photoUrl?: string;
}
