export interface HourlyRecord {
  hour: string;
  kwh: number;
  costTnd: number;
  isPeak: boolean;
}

export interface DailyRecord {
  date: string;
  dayName: string;
  kwh: number;
  costTnd: number;
  previousWeekKwh: number;
}

export interface MonthlyRecord {
  month: string;
  monthAr: string;
  kwh: number;
  costTnd: number;
  solarProductionKwh?: number;
  regionalAverageKwh: number;
}

export interface CitizenConsumption {
  meterId: string;
  customerName: string;
  address: string;
  governorate: string;
  currentPowerKw: number;
  todayKwh: number;
  estimatedBillTnd: number;
  monthForecastKwh: number;
  regionalAverageKwh: number;
  co2SavedKg: number;
  solarPercentage: number;
  hourlyHistory: HourlyRecord[];
  dailyHistory: DailyRecord[];
  monthlyHistory: MonthlyRecord[];
}

export interface EnergyTip {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  savingsTndPerMonth: number;
  category: 'CHAUFFAGE_CLIM' | 'ECLAIRAGE' | 'ELECTROMENAGER' | 'SOLAIRE';
  icon: string;
  difficulty: 'FACILE' | 'MOYEN' | 'AVANCE';
}
