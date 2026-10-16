import { Injectable, signal, computed } from '@angular/core';
import { FraudAlert, FraudSeverity, FraudStatus, ShapFactor } from '../../models/fraud.model';

const GOVERNORATES_SAMPLE = ['Tunis', 'Sfax', 'Sousse', 'Ben Arous', 'Nabeul', 'Ariana', 'Bizerte', 'Kairouan', 'Gabès', 'Monastir'];
const ANOMALY_TYPES = [
  'Bypass compteur (dérivation de phase)',
  'Chute de consommation brutale post-canicule',
  'Consommation nulle en journée / forte la nuit',
  'Index figé malgré activité déclarée',
  'Inversion de polarité du tore de mesure',
  'Sous-comptage suspect sur abonnement triphasé'
];

function generateMockFrauds(): FraudAlert[] {
  const frauds: FraudAlert[] = [];
  const severities: FraudSeverity[] = ['CRITIQUE', 'MOYENNE', 'FAIBLE'];
  const statuses: FraudStatus[] = ['NOUVEAU', 'EN_INSPECTION', 'VALIDE', 'REJETE'];

  for (let i = 1; i <= 50; i++) {
    const gov = GOVERNORATES_SAMPLE[i % GOVERNORATES_SAMPLE.length];
    const score = Math.min(99, Math.max(45, Math.round(98 - (i * 1.1) + (Math.sin(i) * 8))));
    const severity: FraudSeverity = score >= 80 ? 'CRITIQUE' : (score >= 65 ? 'MOYENNE' : 'FAIBLE');
    const status: FraudStatus = i <= 6 ? 'NOUVEAU' : (i <= 18 ? 'EN_INSPECTION' : (i % 2 === 0 ? 'VALIDE' : 'REJETE'));
    const drop = Math.round(40 + (score * 0.45));
    const loss = Math.round((drop * 18) + (i * 35));

    const shapFactors: ShapFactor[] = [
      {
        name: 'drop_pct',
        nameFr: 'Chute brutale de kWh',
        impactScore: Number((0.35 + (drop / 200)).toFixed(2)),
        description: 'Baisse de charge de ' + drop + '% par rapport au profil saisonnier',
        observedValue: `-${drop}%`,
        referenceValue: '± 5%'
      },
      {
        name: 'night_ratio',
        nameFr: 'Ratio consommation nocturne',
        impactScore: Number((0.20 + (i % 3) * 0.08).toFixed(2)),
        description: 'Consommation disproportionnée entre 01h et 05h',
        observedValue: `${(45 + (i % 20))}%`,
        referenceValue: '12% moyenne'
      },
      {
        name: 'temp_correlation',
        nameFr: 'Décorrélation météo',
        impactScore: Number((0.15 + (i % 2) * 0.05).toFixed(2)),
        description: 'Absence de hausse lors des pics de canicule à ' + gov,
        observedValue: 'R = -0.12',
        referenceValue: 'R > +0.75'
      },
      {
        name: 'neighborhood_var',
        nameFr: 'Écart aux voisins directs',
        impactScore: Number((0.12 + (score / 400)).toFixed(2)),
        description: 'Consommation 3.8x inférieure aux abonnés mitoyens de même surface',
        observedValue: '110 kWh/m',
        referenceValue: '420 kWh/m'
      }
    ];

    frauds.push({
      id: `FRD-2025-${i.toString().padStart(4, '0')}`,
      meterId: `MTR-${gov.substring(0, 3).toUpperCase()}-${3000 + i * 27}`,
      customerName: `Abonné #${10420 + i * 31}`,
      governorate: gov,
      address: `Zone Résidentielle Secteur ${((i % 7) + 1)}, ${gov}`,
      suspicionScore: score,
      severity,
      status,
      detectionDate: `2025-10-${Math.max(1, 16 - Math.floor(i / 3)).toString().padStart(2, '0')}`,
      kwhDropPercentage: drop,
      estimatedLossTnd: loss,
      anomalyType: ANOMALY_TYPES[i % ANOMALY_TYPES.length],
      shapFactors,
      inspectorNotes: status === 'EN_INSPECTION' ? 'Équipe technique mandatée pour vérification du scellé physique.' : undefined
    });
  }

  return frauds;
}

@Injectable({
  providedIn: 'root'
})
export class FraudService {
  private alertsSignal = signal<FraudAlert[]>(generateMockFrauds());
  private selectedAlertSignal = signal<FraudAlert | null>(null);

  readonly alerts = computed(() => this.alertsSignal());
  readonly selectedAlert = computed(() => this.selectedAlertSignal());

  readonly stats = computed(() => {
    const list = this.alertsSignal();
    return {
      total: list.length,
      critical: list.filter(a => a.severity === 'CRITIQUE').length,
      newAlerts: list.filter(a => a.status === 'NOUVEAU').length,
      underInspection: list.filter(a => a.status === 'EN_INSPECTION').length,
      validated: list.filter(a => a.status === 'VALIDE').length,
      totalLossTnd: list.reduce((sum, a) => sum + a.estimatedLossTnd, 0)
    };
  });

  selectAlert(alert: FraudAlert | null): void {
    this.selectedAlertSignal.set(alert);
  }

  updateStatus(id: string, newStatus: FraudStatus, notes?: string): void {
    this.alertsSignal.update(list =>
      list.map(a => (a.id === id ? { ...a, status: newStatus, inspectorNotes: notes || a.inspectorNotes } : a))
    );

    if (this.selectedAlertSignal()?.id === id) {
      this.selectedAlertSignal.update(curr => curr ? { ...curr, status: newStatus, inspectorNotes: notes || curr.inspectorNotes } : null);
    }
  }

  validateFraud(id: string): void {
    this.updateStatus(id, 'VALIDE', 'Fraude confirmée après contre-mesure. Dossier transmis au contentieux.');
  }

  rejectFraud(id: string): void {
    this.updateStatus(id, 'REJETE', 'Fausse alerte confirmée (bâtiment inoccupé temporairement).');
  }

  requestInspection(id: string): void {
    this.updateStatus(id, 'EN_INSPECTION', 'Ordre de mission envoyé à l\'équipe de contrôle régionale.');
  }
}
