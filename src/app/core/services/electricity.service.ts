import { Injectable, signal, computed } from '@angular/core';
import { Governorate, GridStatus } from '../../models/governorate.model';

export const TUNISIAN_GOVERNORATES: Governorate[] = [
  { id: 'gov-tunis', name: 'Tunis', nameAr: 'تونس', code: 'TN-11', lat: 36.8065, lng: 10.1815, capacityMw: 950, currentLoadMw: 780, peakLoadMw: 890, status: 'ELEVEE', temperatureC: 32, solarRadiationKwhM2: 5.6, history24h: [520, 480, 460, 470, 530, 640, 710, 750, 780, 810, 840, 890, 860, 820, 800, 780, 750, 720, 700, 680, 640, 600, 560, 530] },
  { id: 'gov-ariana', name: 'Ariana', nameAr: 'أريانة', code: 'TN-12', lat: 36.8665, lng: 10.1956, capacityMw: 480, currentLoadMw: 360, peakLoadMw: 430, status: 'NORMAL', temperatureC: 31, solarRadiationKwhM2: 5.5, history24h: [240, 220, 210, 220, 250, 310, 340, 350, 360, 380, 410, 430, 410, 390, 370, 360, 340, 330, 320, 300, 290, 270, 250, 240] },
  { id: 'gov-benarous', name: 'Ben Arous', nameAr: 'بن عروس', code: 'TN-13', lat: 36.7531, lng: 10.2189, capacityMw: 620, currentLoadMw: 540, peakLoadMw: 590, status: 'SURCHARGE', temperatureC: 33, solarRadiationKwhM2: 5.6, history24h: [320, 300, 290, 310, 380, 460, 510, 530, 540, 560, 580, 590, 570, 550, 540, 530, 500, 480, 460, 430, 400, 380, 350, 330] },
  { id: 'gov-manouba', name: 'Manouba', nameAr: 'منوبة', code: 'TN-14', lat: 36.8081, lng: 10.0972, capacityMw: 340, currentLoadMw: 230, peakLoadMw: 290, status: 'NORMAL', temperatureC: 32, solarRadiationKwhM2: 5.7, history24h: [150, 140, 135, 140, 160, 200, 220, 230, 230, 250, 270, 290, 270, 260, 240, 230, 220, 210, 200, 190, 180, 170, 160, 150] },
  { id: 'gov-nabeul', name: 'Nabeul', nameAr: 'نابل', code: 'TN-21', lat: 36.4561, lng: 10.7376, capacityMw: 580, currentLoadMw: 470, peakLoadMw: 530, status: 'ELEVEE', temperatureC: 30, solarRadiationKwhM2: 5.8, history24h: [280, 260, 250, 260, 300, 380, 420, 450, 470, 500, 520, 530, 510, 490, 470, 460, 440, 420, 400, 380, 350, 330, 300, 280] },
  { id: 'gov-zaghouan', name: 'Zaghouan', nameAr: 'زغوان', code: 'TN-22', lat: 36.4029, lng: 10.1429, capacityMw: 260, currentLoadMw: 170, peakLoadMw: 210, status: 'NORMAL', temperatureC: 33, solarRadiationKwhM2: 5.8, history24h: [110, 100, 95, 100, 120, 150, 165, 170, 170, 185, 200, 210, 200, 190, 180, 170, 160, 150, 140, 135, 130, 125, 115, 110] },
  { id: 'gov-bizerte', name: 'Bizerte', nameAr: 'بنزرت', code: 'TN-23', lat: 37.2744, lng: 9.8739, capacityMw: 510, currentLoadMw: 390, peakLoadMw: 460, status: 'NORMAL', temperatureC: 29, solarRadiationKwhM2: 5.4, history24h: [250, 230, 220, 230, 270, 340, 370, 390, 390, 420, 445, 460, 440, 420, 400, 390, 370, 350, 335, 315, 295, 280, 265, 250] },
  { id: 'gov-beja', name: 'Béja', nameAr: 'باجة', code: 'TN-31', lat: 36.7256, lng: 9.1817, capacityMw: 290, currentLoadMw: 195, peakLoadMw: 245, status: 'NORMAL', temperatureC: 34, solarRadiationKwhM2: 5.7, history24h: [120, 110, 105, 110, 135, 170, 190, 195, 195, 215, 235, 245, 230, 220, 210, 195, 185, 175, 165, 155, 145, 135, 125, 120] },
  { id: 'gov-jendouba', name: 'Jendouba', nameAr: 'جندوبة', code: 'TN-32', lat: 36.5011, lng: 8.7802, capacityMw: 270, currentLoadMw: 180, peakLoadMw: 230, status: 'NORMAL', temperatureC: 33, solarRadiationKwhM2: 5.5, history24h: [110, 100, 95, 100, 120, 155, 175, 180, 180, 200, 220, 230, 215, 205, 195, 180, 170, 160, 150, 140, 130, 120, 115, 110] },
  { id: 'gov-kef', name: 'Le Kef', nameAr: 'الكاف', code: 'TN-33', lat: 36.1742, lng: 8.7049, capacityMw: 240, currentLoadMw: 160, peakLoadMw: 200, status: 'NORMAL', temperatureC: 34, solarRadiationKwhM2: 5.8, history24h: [100, 90, 85, 90, 110, 140, 155, 160, 160, 175, 190, 200, 190, 180, 170, 160, 150, 140, 130, 125, 120, 110, 105, 100] },
  { id: 'gov-siliana', name: 'Siliana', nameAr: 'سليانة', code: 'TN-34', lat: 36.0849, lng: 9.3708, capacityMw: 210, currentLoadMw: 135, peakLoadMw: 175, status: 'NORMAL', temperatureC: 35, solarRadiationKwhM2: 5.9, history24h: [85, 75, 70, 75, 90, 115, 130, 135, 135, 150, 165, 175, 165, 155, 145, 135, 125, 120, 110, 105, 100, 95, 90, 85] },
  { id: 'gov-sousse', name: 'Sousse', nameAr: 'سوسة', code: 'TN-51', lat: 35.8256, lng: 10.63699, capacityMw: 750, currentLoadMw: 620, peakLoadMw: 710, status: 'ELEVEE', temperatureC: 32, solarRadiationKwhM2: 6.0, history24h: [380, 350, 340, 350, 420, 520, 580, 610, 620, 660, 690, 710, 680, 660, 640, 620, 590, 560, 530, 500, 460, 430, 400, 380] },
  { id: 'gov-monastir', name: 'Monastir', nameAr: 'المنستير', code: 'TN-52', lat: 35.7779, lng: 10.8262, capacityMw: 540, currentLoadMw: 430, peakLoadMw: 495, status: 'NORMAL', temperatureC: 31, solarRadiationKwhM2: 6.0, history24h: [260, 240, 230, 240, 290, 360, 410, 430, 430, 460, 480, 495, 475, 455, 440, 430, 410, 390, 370, 350, 320, 300, 280, 260] },
  { id: 'gov-mahdia', name: 'Mahdia', nameAr: 'المهدية', code: 'TN-53', lat: 35.5047, lng: 11.0622, capacityMw: 360, currentLoadMw: 260, peakLoadMw: 315, status: 'NORMAL', temperatureC: 30, solarRadiationKwhM2: 6.1, history24h: [160, 150, 145, 150, 180, 220, 250, 260, 260, 280, 300, 315, 300, 290, 275, 260, 250, 235, 220, 205, 190, 180, 170, 160] },
  { id: 'gov-sfax', name: 'Sfax', nameAr: 'صفاقس', code: 'TN-61', lat: 34.7406, lng: 10.7603, capacityMw: 880, currentLoadMw: 730, peakLoadMw: 820, status: 'ELEVEE', temperatureC: 33, solarRadiationKwhM2: 6.2, history24h: [450, 420, 400, 420, 500, 620, 690, 720, 730, 770, 800, 820, 790, 765, 745, 730, 700, 660, 620, 580, 540, 500, 470, 450] },
  { id: 'gov-kairouan', name: 'Kairouan', nameAr: 'القيروان', code: 'TN-41', lat: 35.6781, lng: 10.0963, capacityMw: 410, currentLoadMw: 310, peakLoadMw: 375, status: 'NORMAL', temperatureC: 37, solarRadiationKwhM2: 6.3, history24h: [190, 180, 170, 180, 210, 265, 295, 310, 310, 335, 360, 375, 360, 345, 330, 310, 295, 280, 260, 240, 225, 210, 200, 190] },
  { id: 'gov-kasserine', name: 'Kasserine', nameAr: 'القصرين', code: 'TN-42', lat: 35.1676, lng: 8.8365, capacityMw: 330, currentLoadMw: 220, peakLoadMw: 280, status: 'NORMAL', temperatureC: 36, solarRadiationKwhM2: 6.3, history24h: [140, 130, 125, 130, 155, 190, 210, 220, 220, 245, 265, 280, 265, 250, 235, 220, 205, 195, 185, 175, 165, 155, 145, 140] },
  { id: 'gov-sidibouzid', name: 'Sidi Bouzid', nameAr: 'سيدي بوزيد', code: 'TN-43', lat: 35.0382, lng: 9.4858, capacityMw: 310, currentLoadMw: 205, peakLoadMw: 260, status: 'NORMAL', temperatureC: 36, solarRadiationKwhM2: 6.4, history24h: [130, 120, 115, 120, 145, 175, 195, 205, 205, 225, 245, 260, 245, 235, 220, 205, 195, 185, 175, 160, 150, 140, 135, 130] },
  { id: 'gov-gabes', name: 'Gabès', nameAr: 'قابس', code: 'TN-81', lat: 33.8815, lng: 10.0982, capacityMw: 490, currentLoadMw: 380, peakLoadMw: 440, status: 'NORMAL', temperatureC: 34, solarRadiationKwhM2: 6.5, history24h: [230, 215, 205, 215, 260, 320, 360, 380, 380, 405, 425, 440, 420, 405, 390, 380, 360, 340, 320, 300, 280, 260, 245, 230] },
  { id: 'gov-medenine', name: 'Médenine', nameAr: 'مدنين', code: 'TN-82', lat: 33.3549, lng: 10.5055, capacityMw: 420, currentLoadMw: 315, peakLoadMw: 370, status: 'NORMAL', temperatureC: 35, solarRadiationKwhM2: 6.6, history24h: [195, 180, 170, 180, 215, 270, 300, 315, 315, 335, 355, 370, 355, 340, 325, 315, 300, 285, 265, 250, 235, 220, 205, 195] },
  { id: 'gov-tataouine', name: 'Tataouine', nameAr: 'تطاوين', code: 'TN-83', lat: 32.9297, lng: 10.4518, capacityMw: 250, currentLoadMw: 165, peakLoadMw: 210, status: 'NORMAL', temperatureC: 38, solarRadiationKwhM2: 6.9, history24h: [100, 95, 90, 95, 115, 140, 155, 165, 165, 185, 200, 210, 200, 190, 175, 165, 155, 145, 135, 125, 120, 115, 105, 100] },
  { id: 'gov-gafsa', name: 'Gafsa', nameAr: 'قفصة', code: 'TN-71', lat: 34.425, lng: 8.7842, capacityMw: 390, currentLoadMw: 290, peakLoadMw: 350, status: 'NORMAL', temperatureC: 37, solarRadiationKwhM2: 6.4, history24h: [175, 165, 155, 165, 195, 245, 275, 290, 290, 315, 335, 350, 335, 320, 305, 290, 275, 260, 240, 225, 210, 195, 185, 175] },
  { id: 'gov-tozeur', name: 'Tozeur', nameAr: 'توزر', code: 'TN-72', lat: 33.9197, lng: 8.1335, capacityMw: 220, currentLoadMw: 155, peakLoadMw: 195, status: 'NORMAL', temperatureC: 41, solarRadiationKwhM2: 6.8, history24h: [95, 90, 85, 90, 110, 130, 145, 155, 155, 170, 185, 195, 185, 175, 165, 155, 145, 135, 125, 115, 110, 105, 100, 95] },
  { id: 'gov-kebili', name: 'Kébili', nameAr: 'قبلي', code: 'TN-73', lat: 33.7044, lng: 8.969, capacityMw: 200, currentLoadMw: 135, peakLoadMw: 175, status: 'NORMAL', temperatureC: 40, solarRadiationKwhM2: 6.7, history24h: [85, 80, 75, 80, 95, 115, 125, 135, 135, 150, 165, 175, 165, 155, 145, 135, 125, 115, 105, 100, 95, 90, 85, 85] }
];

export interface ScenarioParams {
  tempDeltaC: number;
  isHoliday: boolean;
  industrialActivityPct: number;
  solarSurplusPct: number;
}

@Injectable({
  providedIn: 'root'
})
export class ElectricityService {
  private governoratesSignal = signal<Governorate[]>(TUNISIAN_GOVERNORATES);
  private scenarioSignal = signal<ScenarioParams>({
    tempDeltaC: 0,
    isHoliday: false,
    industrialActivityPct: 100,
    solarSurplusPct: 0
  });

  readonly governorates = computed(() => this.governoratesSignal());

  // Indicateurs globaux
  readonly totalCapacityMw = computed(() => 
    this.governoratesSignal().reduce((acc, g) => acc + g.capacityMw, 0)
  );

  readonly totalCurrentLoadMw = computed(() => {
    const base = this.governoratesSignal().reduce((acc, g) => acc + g.currentLoadMw, 0);
    const scenario = this.scenarioSignal();
    const tempImpact = scenario.tempDeltaC * 85; // +85 MW par °C au niveau national (effet climatisation)
    const holidayImpact = scenario.isHoliday ? -350 : 0;
    const industrialImpact = ((scenario.industrialActivityPct - 100) / 100) * 450;
    return Math.round(base + tempImpact + holidayImpact + industrialImpact);
  });

  readonly reserveMarginPct = computed(() => {
    const cap = this.totalCapacityMw();
    const load = this.totalCurrentLoadMw();
    return Math.round(((cap - load) / cap) * 100);
  });

  readonly nationalSolarMw = computed(() => {
    const baseSolar = 640; // MW solaires installés & injectés
    const surplus = (this.scenarioSignal().solarSurplusPct / 100) * baseSolar;
    return Math.round(baseSolar + surplus);
  });

  readonly solarSharePct = computed(() => {
    const solar = this.nationalSolarMw();
    const load = this.totalCurrentLoadMw();
    return Number(((solar / load) * 100).toFixed(1));
  });

  // Simulation de scénario
  updateScenario(params: Partial<ScenarioParams>): void {
    this.scenarioSignal.update(s => ({ ...s, ...params }));
  }

  resetScenario(): void {
    this.scenarioSignal.set({
      tempDeltaC: 0,
      isHoliday: false,
      industrialActivityPct: 100,
      solarSurplusPct: 0
    });
  }

  getScenario(): ScenarioParams {
    return this.scenarioSignal();
  }

  // Obtenir un gouvernorat par son id
  getGovernorate(id: string): Governorate | undefined {
    return this.governoratesSignal().find(g => g.id === id);
  }

  // Mettre à jour l'état d'un gouvernorat (par exemple via le générateur démo ou seuils)
  updateGovernorate(id: string, updates: Partial<Governorate>): void {
    this.governoratesSignal.update(govs =>
      govs.map(g => (g.id === id ? { ...g, ...updates } : g))
    );
  }

  // Prévision de charge J+1 (24h) et J+7
  getForecast(governorateId?: string, horizon: 'J+1' | 'J+7' = 'J+1') {
    const gov = governorateId ? this.getGovernorate(governorateId) : null;
    const basePeak = gov ? gov.peakLoadMw : 4850;
    const hours = horizon === 'J+1' 
      ? ['00h', '02h', '04h', '06h', '08h', '10h', '12h', '14h', '16h', '18h', '20h', '22h']
      : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    const scenario = this.scenarioSignal();
    const tempEffect = scenario.tempDeltaC * 0.03; // +3% par degré

    const actual = hours.map((_, i) => {
      const curve = Math.sin((i / (hours.length - 1)) * Math.PI) * 0.4 + 0.6;
      return Math.round(basePeak * curve * (1 + (Math.sin(i * 1.5) * 0.04)));
    });

    const predicted = actual.map((val) => Math.round(val * (1 + tempEffect)));
    const upperConfidence = predicted.map(v => Math.round(v * 1.05));
    const lowerConfidence = predicted.map(v => Math.round(v * 0.95));

    return {
      labels: hours,
      actual,
      predicted,
      upperConfidence,
      lowerConfidence,
      metrics: {
        mae: Number((18.4 + scenario.tempDeltaC * 1.2).toFixed(1)),
        rmse: Number((24.1 + scenario.tempDeltaC * 1.5).toFixed(1)),
        mape: Number((2.1 + scenario.tempDeltaC * 0.1).toFixed(2))
      }
    };
  }
}
