import { Injectable, signal, computed } from '@angular/core';
import { OutageReport, OutageStatus, OutageSeverity, OutageType } from '../../models/outage.model';

const MOCK_OUTAGES: OutageReport[] = [
  {
    id: 'out-01',
    reference: 'INC-2025-0811',
    governorate: 'Tunis',
    district: 'Belvédère / Mutuelleville',
    address: 'Avenue de la Liberté, Tunis',
    lat: 36.8189,
    lng: 10.1798,
    type: 'PANNE_TRANSFORMATEUR',
    status: 'EN_COURS',
    severity: 'MAJEURE',
    reportedAt: 'Aujourd\'hui à 11:20',
    estimatedResolution: '16:30',
    affectedCustomers: 1420,
    reportedBy: 'Télémesure SCADA Poste Central',
    assignedTechnician: 'Karim Trabelsi',
    notes: 'Remplacement d\'un disjoncteur moyenne tension 30kV en cours d\'acheminement.'
  },
  {
    id: 'out-02',
    reference: 'INC-2025-0812',
    governorate: 'Ariana',
    district: 'Ennasr 2',
    address: 'Avenue Hédi Nouira, Ennasr 2',
    lat: 36.8711,
    lng: 10.1583,
    type: 'LIGNE_COUPEE',
    status: 'SIGNALE',
    severity: 'MOYENNE',
    reportedAt: 'Aujourd\'hui à 13:45',
    estimatedResolution: '17:00',
    affectedCustomers: 680,
    reportedBy: 'Citoyen (Signalement App)',
    assignedTechnician: 'Non assigné',
    notes: 'Câble aérien endommagé suite à des travaux de voirie.'
  },
  {
    id: 'out-03',
    reference: 'INC-2025-0813',
    governorate: 'Ben Arous',
    district: 'Zone Industrielle Mégrine',
    address: 'Rue de l\'Usine, Mégrine Riadh',
    lat: 36.7682,
    lng: 10.2312,
    type: 'SURCHARGE_RESEAU',
    status: 'EN_COURS',
    severity: 'MAJEURE',
    reportedAt: 'Aujourd\'hui à 12:10',
    estimatedResolution: '15:45',
    affectedCustomers: 2100,
    reportedBy: 'Capteur IoT Smart Grid',
    assignedTechnician: 'Équipe Mobile Nord-Est',
    notes: 'Délestage tournant préventif activé pour protéger le transformateur principal.'
  },
  {
    id: 'out-04',
    reference: 'INC-2025-0814',
    governorate: 'Sousse',
    district: 'Sousse Ville / Khezama',
    address: 'Route Touristique, Sousse',
    lat: 35.8456,
    lng: 10.6125,
    type: 'MAINTENANCE_PREVENTIVE',
    status: 'RESOLU',
    severity: 'MINEURE',
    reportedAt: 'Aujourd\'hui à 08:00',
    estimatedResolution: 'Résolu à 10:15',
    affectedCustomers: 350,
    reportedBy: 'Planification Réseau Sousse',
    assignedTechnician: 'Slim Ben Amor',
    notes: 'Élagage d\'arbres à proximité de la ligne 10kV terminé sans incident.'
  },
  {
    id: 'out-05',
    reference: 'INC-2025-0815',
    governorate: 'Sfax',
    district: 'Route de Téniour Km 4',
    address: 'Ceinture Bourguiba, Sfax',
    lat: 34.7645,
    lng: 10.7412,
    type: 'INTEMPERIES',
    status: 'EN_COURS',
    severity: 'MOYENNE',
    reportedAt: 'Aujourd\'hui à 10:30',
    estimatedResolution: '18:00',
    affectedCustomers: 920,
    reportedBy: 'Centre d\'Appels STEG',
    assignedTechnician: 'Mounir Chaari',
    notes: 'Fort vent de sirocco ayant provoqué un court-circuit sur l\'isolateur.'
  },
  {
    id: 'out-06',
    reference: 'INC-2025-0816',
    governorate: 'Bizerte',
    district: 'Corniche de Bizerte',
    address: 'Boulevard Hassan Nouri, Bizerte',
    lat: 37.2834,
    lng: 9.8789,
    type: 'PANNE_TRANSFORMATEUR',
    status: 'SIGNALE',
    severity: 'MINEURE',
    reportedAt: 'Aujourd\'hui à 14:15',
    estimatedResolution: '18:30',
    affectedCustomers: 180,
    reportedBy: 'Citoyen (Signalement App)',
    assignedTechnician: 'Non assigné',
    notes: 'Bruit anormal et étincelles signalés sur le poste de quartier.'
  },
  {
    id: 'out-07',
    reference: 'INC-2025-0817',
    governorate: 'Nabeul',
    district: 'Hammamet Nord',
    address: 'Avenue de la Paix, Hammamet',
    lat: 36.4124,
    lng: 10.6289,
    type: 'MAINTENANCE_PREVENTIVE',
    status: 'RESOLU',
    severity: 'MINEURE',
    reportedAt: 'Hier à 15:00',
    estimatedResolution: 'Résolu à 17:30',
    affectedCustomers: 220,
    reportedBy: 'District Nabeul',
    assignedTechnician: 'Khaled Jlassi',
    notes: 'Remplacement d\'un câble souterrain vieillissant.'
  },
  {
    id: 'out-08',
    reference: 'INC-2025-0818',
    governorate: 'Kairouan',
    district: 'Médina / Bab El Jalladine',
    address: 'Rue Ali Belhaouane, Kairouan',
    lat: 35.6721,
    lng: 10.1012,
    type: 'SURCHARGE_RESEAU',
    status: 'SIGNALE',
    severity: 'MOYENNE',
    reportedAt: 'Aujourd\'hui à 14:40',
    estimatedResolution: '19:00',
    affectedCustomers: 850,
    reportedBy: 'Poste HT Kairouan-Ouest',
    assignedTechnician: 'Non assigné',
    notes: 'Forte demande en climatisation due à 42°C mesurés.'
  }
];

// Générer 22 incidents supplémentaires pour atteindre les 30 requis
const OTHER_GOVS = ['Monastir', 'Mahdia', 'Gabès', 'Médenine', 'Gafsa', 'Jendouba', 'Béja', 'Le Kef', 'Siliana', 'Zaghouan', 'Tozeur', 'Kébili', 'Tataouine', 'Sidi Bouzid', 'Kasserine', 'Manouba'];
for (let i = 9; i <= 30; i++) {
  const gov = OTHER_GOVS[i % OTHER_GOVS.length];
  MOCK_OUTAGES.push({
    id: `out-${i.toString().padStart(2, '0')}`,
    reference: `INC-2025-08${i + 10}`,
    governorate: gov,
    district: `Secteur Centre ${gov}`,
    address: `Rue Principale, ${gov}`,
    lat: 35.0 + (Math.sin(i) * 1.6),
    lng: 9.8 + (Math.cos(i) * 0.9),
    type: i % 4 === 0 ? 'PANNE_TRANSFORMATEUR' : (i % 3 === 0 ? 'LIGNE_COUPEE' : 'MAINTENANCE_PREVENTIVE'),
    status: i % 3 === 0 ? 'RESOLU' : (i % 2 === 0 ? 'EN_COURS' : 'SIGNALE'),
    severity: i % 5 === 0 ? 'MAJEURE' : (i % 2 === 0 ? 'MOYENNE' : 'MINEURE'),
    reportedAt: `Aujourd\'hui à ${10 + (i % 5)}:${(i * 7) % 60}`,
    estimatedResolution: `${16 + (i % 4)}:00`,
    affectedCustomers: 120 + (i * 45),
    reportedBy: i % 2 === 0 ? 'Capteur IoT' : 'Citoyen',
    assignedTechnician: i % 3 === 0 ? 'Karim Trabelsi' : (i % 2 === 0 ? 'Équipe de garde' : undefined),
    notes: `Intervention programmée sur réseau local ${gov}.`
  });
}

@Injectable({
  providedIn: 'root'
})
export class OutageService {
  private outagesSignal = signal<OutageReport[]>(MOCK_OUTAGES);
  private selectedOutageSignal = signal<OutageReport | null>(MOCK_OUTAGES[0]);

  readonly outages = computed(() => this.outagesSignal());
  readonly selectedOutage = computed(() => this.selectedOutageSignal());

  readonly stats = computed(() => {
    const list = this.outagesSignal();
    return {
      total: list.length,
      active: list.filter(o => o.status !== 'RESOLU').length,
      inProgress: list.filter(o => o.status === 'EN_COURS').length,
      reported: list.filter(o => o.status === 'SIGNALE').length,
      resolved: list.filter(o => o.status === 'RESOLU').length,
      totalAffected: list.filter(o => o.status !== 'RESOLU').reduce((sum, o) => sum + o.affectedCustomers, 0)
    };
  });

  selectOutage(outage: OutageReport | null): void {
    this.selectedOutageSignal.set(outage);
  }

  updateOutageStatus(id: string, status: OutageStatus, notes?: string): void {
    this.outagesSignal.update(list =>
      list.map(o => (o.id === id ? { ...o, status, notes: notes || o.notes } : o))
    );
    if (this.selectedOutageSignal()?.id === id) {
      this.selectedOutageSignal.update(curr => curr ? { ...curr, status, notes: notes || curr.notes } : null);
    }
  }

  assignTechnician(id: string, techName: string): void {
    this.outagesSignal.update(list =>
      list.map(o => (o.id === id ? { ...o, assignedTechnician: techName, status: 'EN_COURS' } : o))
    );
  }

  reportOutage(data: Partial<OutageReport>): OutageReport {
    const newReport: OutageReport = {
      id: 'out-' + Date.now(),
      reference: 'INC-' + Math.floor(1000 + Math.random() * 9000),
      governorate: data.governorate || 'Tunis',
      district: data.district || 'Centre',
      address: data.address || 'Adresse signalée',
      lat: data.lat || 36.8065,
      lng: data.lng || 10.1815,
      type: data.type || 'AUTRE' as any,
      status: 'SIGNALE',
      severity: data.severity || 'MOYENNE',
      reportedAt: 'À l\'instant',
      estimatedResolution: 'En cours d\'évaluation',
      affectedCustomers: data.affectedCustomers || 1,
      reportedBy: data.reportedBy || 'Citoyen (Application)',
      notes: data.notes || 'Signalement enregistré par un citoyen.',
      photoUrl: data.photoUrl
    };

    this.outagesSignal.update(list => [newReport, ...list]);
    this.selectedOutageSignal.set(newReport);
    return newReport;
  }
}
