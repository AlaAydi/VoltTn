export type FraudSeverity = 'FAIBLE' | 'MOYENNE' | 'CRITIQUE';
export type FraudStatus = 'NOUVEAU' | 'VALIDE' | 'REJETE' | 'EN_INSPECTION';

export interface ShapFactor {
  name: string;
  nameFr: string;
  impactScore: number; 
  description: string;
  observedValue: string;
  referenceValue: string;
}

export interface FraudAlert {
  id: string;
  meterId: string;
  customerName: string;
  governorate: string;
  address: string;
  suspicionScore: number; 
  severity: FraudSeverity;
  status: FraudStatus;
  detectionDate: string;
  kwhDropPercentage: number;
  estimatedLossTnd: number;
  anomalyType: string;
  shapFactors: ShapFactor[];
  inspectorNotes?: string;
}
