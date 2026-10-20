import { Injectable } from '@angular/core';
import { SolarSimulationParams, SolarSimulationResult, SolarOrientation } from '../../models/solar.model';

// Rendement solaire moyen par région tunisienne (kWh/kWc/an)
const SOLAR_YIELD_MAP: Record<string, number> = {
  'gov-tunis': 1680,
  'gov-ariana': 1690,
  'gov-benarous': 1685,
  'gov-manouba': 1700,
  'gov-nabeul': 1720,
  'gov-bizerte': 1640,
  'gov-sousse': 1780,
  'gov-monastir': 1790,
  'gov-mahdia': 1810,
  'gov-sfax': 1850,
  'gov-kairouan': 1860,
  'gov-gabes': 1920,
  'gov-medenine': 1980,
  'gov-tataouine': 2120, // Ensoleillement maximal du Sahara
  'gov-tozeur': 2080,
  'gov-kebili': 2060,
  'gov-gafsa': 1910
};

const ORIENTATION_FACTORS: Record<SolarOrientation, number> = {
  SUD: 1.0,
  SUD_EST: 0.96,
  SUD_OUEST: 0.96,
  EST: 0.86,
  OUEST: 0.85
};

@Injectable({
  providedIn: 'root'
})
export class SolarService {
  simulate(params: SolarSimulationParams): SolarSimulationResult {
    const yieldKwhPerKwc = SOLAR_YIELD_MAP[params.governorateId] || 1750;
    const orientationFactor = ORIENTATION_FACTORS[params.orientation] || 0.95;

    // 1 kWc nécessite environ 6.2 m² de panneaux photovoltaïques modernes (400Wc/panneau)
    const installedPowerKwc = Number((params.surfaceM2 / 6.2).toFixed(1));
    
    // Production annuelle brute
    const annualProductionKwh = Math.round(installedPowerKwc * yieldKwhPerKwc * orientationFactor * 0.84); // Performance Ratio ~84%

    // Économies financières en Dinars Tunisiens (tarif moyen STEG ~0.340 DT/kWh avec tranches supérieures)
    const annualSavingsTnd = Math.round(annualProductionKwh * 0.335);

    // Coût brut du système clé en main (onduleur + panneaux + pose certifiée ANME : ~3100 DT / kWc)
    const systemCostTnd = Math.round(installedPowerKwc * 3100);

    // Prime ANME Fonds de Transition Énergétique (FTE) + Crédit Prosol STEG (environ 25% du montant)
    const stegSubsidyTnd = Math.round(systemCostTnd * 0.25);
    const netCostTnd = systemCostTnd - stegSubsidyTnd;

    // Durée d'amortissement (ROI)
    const roiYears = Number((netCostTnd / (annualSavingsTnd || 1)).toFixed(1));

    // CO2 évité (mix énergétique tunisien ~0.55 kg CO2 par kWh)
    const co2SavedTonsPerYear = Number(((annualProductionKwh * 0.55) / 1000).toFixed(2));

    // Répartition de production sur 12 mois
    const monthCoeffs = [0.06, 0.07, 0.085, 0.095, 0.11, 0.12, 0.125, 0.115, 0.09, 0.075, 0.065, 0.06];
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    const monthlyProductionChart = months.map((month, idx) => ({
      month,
      kwh: Math.round(annualProductionKwh * monthCoeffs[idx])
    }));

    return {
      installedPowerKwc,
      annualProductionKwh,
      annualSavingsTnd,
      systemCostTnd,
      stegSubsidyTnd,
      netCostTnd,
      roiYears,
      co2SavedTonsPerYear,
      monthlyProductionChart
    };
  }
}
