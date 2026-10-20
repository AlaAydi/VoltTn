export type SolarOrientation = 'SUD' | 'SUD_EST' | 'SUD_OUEST' | 'EST' | 'OUEST';

export interface SolarSimulationParams {
  surfaceM2: number;
  orientation: SolarOrientation;
  tiltAngleDeg: number;
  governorateId: string;
  monthlyBillTnd: number;
}

export interface SolarSimulationResult {
  installedPowerKwc: number;
  annualProductionKwh: number;
  annualSavingsTnd: number;
  systemCostTnd: number;
  stegSubsidyTnd: number; 
  netCostTnd: number;
  roiYears: number;
  co2SavedTonsPerYear: number;
  monthlyProductionChart: { month: string; kwh: number }[];
}
