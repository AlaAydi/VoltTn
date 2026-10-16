export type GridStatus = 'NORMAL' | 'ELEVEE' | 'SURCHARGE';

export interface Governorate {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  lat: number;
  lng: number;
  capacityMw: number;
  currentLoadMw: number;
  peakLoadMw: number;
  status: GridStatus;
  temperatureC: number;
  solarRadiationKwhM2: number;
  history24h: number[];
  colorHex?: string;
  normalizedHeight?: number;
}
