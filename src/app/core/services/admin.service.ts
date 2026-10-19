import { Injectable, signal, computed } from '@angular/core';
import { User, UserRole } from '../../models/user.model';
import { MLModelVersion, AuditLog } from '../../models/ml-model.model';
import { ElectricityService } from './electricity.service';
import { NotificationService } from './notification.service';
import { DEMO_USERS } from './auth.service';

const INITIAL_USERS: User[] = [
  DEMO_USERS.CITOYEN,
  DEMO_USERS.OPERATEUR,
  DEMO_USERS.TECHNICIEN,
  DEMO_USERS.ADMIN,
  {
    id: 'usr-cit-02',
    name: 'Sarra Mahjoub',
    email: 'sarra.mahjoub@gmail.com',
    role: 'CITOYEN',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    phone: '+216 55 123 456',
    governorate: 'Sousse',
    meterNumber: 'MTR-SO-441200',
    createdAt: '2025-02-10',
    status: 'ACTIF'
  },
  {
    id: 'usr-cit-03',
    name: 'Tarak Chaabane',
    email: 'tarak.ch@planet.tn',
    role: 'CITOYEN',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    phone: '+216 24 998 877',
    governorate: 'Sfax',
    meterNumber: 'MTR-SF-778811',
    createdAt: '2025-03-01',
    status: 'ACTIF'
  },
  {
    id: 'usr-op-02',
    name: 'Houssem Ghrab',
    email: 'houssem.ghrab@steg.com.tn',
    role: 'OPERATEUR',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
    phone: '+216 71 889 001',
    governorate: 'Sousse',
    createdAt: '2024-05-18',
    status: 'ACTIF'
  },
  {
    id: 'usr-tech-02',
    name: 'Slim Ben Amor',
    email: 'slim.tech@steg.com.tn',
    role: 'TECHNICIEN',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    phone: '+216 93 456 789',
    governorate: 'Sousse',
    createdAt: '2024-08-04',
    status: 'ACTIF'
  },
  {
    id: 'usr-tech-03',
    name: 'Mounir Chaari',
    email: 'mounir.chaari@steg.com.tn',
    role: 'TECHNICIEN',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
    phone: '+216 97 112 233',
    governorate: 'Sfax',
    createdAt: '2024-09-12',
    status: 'ACTIF'
  },
  {
    id: 'usr-cit-04',
    name: 'Monia Khemir',
    email: 'monia.khemir@topnet.tn',
    role: 'CITOYEN',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=150&q=80',
    phone: '+216 52 334 455',
    governorate: 'Bizerte',
    meterNumber: 'MTR-BI-991122',
    createdAt: '2025-01-28',
    status: 'ACTIF'
  },
  {
    id: 'usr-cit-05',
    name: 'Nizar Ben Romdhane',
    email: 'nizar.romdhane@gmail.com',
    role: 'CITOYEN',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    phone: '+216 29 443 322',
    governorate: 'Nabeul',
    meterNumber: 'MTR-NA-556677',
    createdAt: '2025-02-14',
    status: 'BLOQUE'
  }
];

const INITIAL_MODELS: MLModelVersion[] = [
  {
    id: 'ml-01',
    name: 'VoltPredict-LightGBM',
    algorithm: 'LightGBM Regressor + Lag Features',
    version: 'v2.4.1',
    trainedAt: '2025-10-12',
    maeMw: 18.4,
    rmseMw: 24.1,
    mapePercent: 2.12,
    featuresCount: 42,
    status: 'ACTIF',
    description: 'Modèle de référence en production pour la prévision nationale J+1 et J+7.',
    horizonDays: 7
  },
  {
    id: 'ml-02',
    name: 'VoltPredict-XGBoost',
    algorithm: 'XGBoost with Weather Interaction',
    version: 'v2.3.8',
    trainedAt: '2025-09-28',
    maeMw: 21.2,
    rmseMw: 27.6,
    mapePercent: 2.45,
    featuresCount: 38,
    status: 'ARCHIVE',
    description: 'Ancienne version de production, robuste mais plus lente sur les pics soudains.',
    horizonDays: 7
  },
  {
    id: 'ml-03',
    name: 'DeepVolt-LSTM',
    algorithm: 'Bidirectional LSTM + Attention',
    version: 'v3.0.0-Beta',
    trainedAt: '2025-10-15',
    maeMw: 16.9,
    rmseMw: 22.3,
    mapePercent: 1.95,
    featuresCount: 56,
    status: 'EN_EVALUATION',
    description: 'Réseau de neurones récurrent en cours de validation pour la saison hivernale.',
    horizonDays: 14
  }
];

const INITIAL_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '16 Oct 2025 15:42',
    userEmail: 'admin@volttn.tn',
    userRole: 'ADMIN',
    action: 'Mise à jour seuil d\'alerte',
    target: 'Gouvernorat Ben Arous (Seuil 520 MW)',
    status: 'SUCCES',
    details: 'Augmentation préventive de la tolérance pendant travaux poste Mégrine.'
  },
  {
    id: 'log-2',
    timestamp: '16 Oct 2025 14:10',
    userEmail: 'operateur@volttn.tn',
    userRole: 'OPERATEUR',
    action: 'Validation dossier de fraude',
    target: 'Compteur MTR-SFX-3312',
    status: 'SUCCES',
    details: 'Dossier transmis au contentieux régional Sfax après analyse SHAP.'
  },
  {
    id: 'log-3',
    timestamp: '16 Oct 2025 13:25',
    userEmail: 'technicien@volttn.tn',
    userRole: 'TECHNICIEN',
    action: 'Clôture d\'intervention',
    target: 'Incident INC-2025-0814',
    status: 'SUCCES',
    details: 'Remplacement isolateur 10kV Sousse Ville validé et reconnecté.'
  },
  {
    id: 'log-4',
    timestamp: '16 Oct 2025 11:05',
    userEmail: 'admin@volttn.tn',
    userRole: 'ADMIN',
    action: 'Déploiement modèle ML',
    target: 'VoltPredict-LightGBM v2.4.1',
    status: 'SUCCES',
    details: 'Activation en production suite à l\'évaluation des métriques MAPE 2.12%.'
  }
];

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private usersSignal = signal<User[]>(INITIAL_USERS);
  private modelsSignal = signal<MLModelVersion[]>(INITIAL_MODELS);
  private auditLogsSignal = signal<AuditLog[]>(INITIAL_LOGS);

  // Seuils d'alerte configurables par gouvernorat
  private thresholdsSignal = signal<Record<string, number>>({
    'gov-tunis': 850,
    'gov-benarous': 530,
    'gov-sousse': 650,
    'gov-sfax': 750,
    'gov-nabeul': 500,
    'gov-bizerte': 420
  });

  readonly users = computed(() => this.usersSignal());
  readonly models = computed(() => this.modelsSignal());
  readonly auditLogs = computed(() => this.auditLogsSignal());
  readonly thresholds = computed(() => this.thresholdsSignal());

  constructor(
    private electricityService: ElectricityService,
    private notifService: NotificationService
  ) {}

  // Gestion des utilisateurs
  toggleUserStatus(userId: string): void {
    this.usersSignal.update(users =>
      users.map(u => {
        if (u.id === userId) {
          const nextStatus = u.status === 'ACTIF' ? 'BLOQUE' : 'ACTIF';
          this.addAuditLog('Modification statut utilisateur', `${u.email} -> ${nextStatus}`, 'SUCCES');
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  }

  changeUserRole(userId: string, newRole: UserRole): void {
    this.usersSignal.update(users =>
      users.map(u => {
        if (u.id === userId) {
          this.addAuditLog('Changement de rôle', `${u.email} -> ${newRole}`, 'SUCCES');
          return { ...u, role: newRole };
        }
        return u;
      })
    );
  }

  deleteUser(userId: string): void {
    const user = this.usersSignal().find(u => u.id === userId);
    if (user) {
      this.usersSignal.update(users => users.filter(u => u.id !== userId));
      this.addAuditLog('Suppression compte utilisateur', user.email, 'AVERTISSEMENT');
      this.notifService.showToast('Compte Supprimé', `Le compte ${user.name} a été supprimé.`, 'INFO');
    }
  }

  addUser(userData: Partial<User>): void {
    const newUser: User = {
      id: 'usr-' + Date.now(),
      name: userData.name || 'Utilisateur Démo',
      email: userData.email || `user${Date.now()}@volttn.tn`,
      role: userData.role || 'CITOYEN',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      phone: userData.phone || '+216 20 123 456',
      governorate: userData.governorate || 'Tunis',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'ACTIF'
    };
    this.usersSignal.update(list => [newUser, ...list]);
    this.addAuditLog('Création utilisateur', newUser.email, 'SUCCES');
    this.notifService.showToast('Utilisateur créé', `${newUser.name} ajouté avec succès.`, 'SUCCESS');
  }

  // Configuration des seuils
  updateThreshold(govId: string, maxMw: number): void {
    this.thresholdsSignal.update(map => ({ ...map, [govId]: maxMw }));
    this.addAuditLog('Ajustement seuil gouvernorat', `${govId} -> ${maxMw} MW`, 'SUCCES');
  }

  // Modèles ML
  activateModel(modelId: string): void {
    this.modelsSignal.update(models =>
      models.map(m => ({
        ...m,
        status: m.id === modelId ? 'ACTIF' : (m.status === 'ACTIF' ? 'ARCHIVE' : m.status)
      }))
    );
    this.addAuditLog('Activation modèle ML', `Modèle ${modelId} mis en production`, 'SUCCES');
    this.notifService.showToast('Modèle activé', 'Le modèle a été déployé pour toutes les prévisions.', 'SUCCESS');
  }

  retrainModel(modelId: string): Promise<boolean> {
    return new Promise(resolve => {
      this.notifService.showToast('Réentraînement démarré', 'Calcul des gradients sur les 24 derniers mois...', 'INFO');
      setTimeout(() => {
        this.modelsSignal.update(models =>
          models.map(m => {
            if (m.id === modelId) {
              const improvedMae = Math.max(14.5, Number((m.maeMw * 0.94).toFixed(1)));
              const improvedMape = Math.max(1.7, Number((m.mapePercent * 0.94).toFixed(2)));
              return {
                ...m,
                maeMw: improvedMae,
                mapePercent: improvedMape,
                trainedAt: new Date().toISOString().split('T')[0]
              };
            }
            return m;
          })
        );
        this.addAuditLog('Réentraînement ML terminé', `Modèle ${modelId} amélioré avec succès`, 'SUCCES');
        this.notifService.showToast('Réentraînement réussi', 'Nouvelles métriques MAE enregistrées.', 'SUCCESS');
        resolve(true);
      }, 1500);
    });
  }

  // Générateur de Démonstration (Effets spectaculaires pour la présentation)
  simulateHeatwavePeak(): void {
    this.electricityService.updateScenario({ tempDeltaC: 6, isHoliday: false, industrialActivityPct: 105 });
    this.electricityService.updateGovernorate('gov-tunis', { status: 'SURCHARGE', currentLoadMw: 920 });
    this.electricityService.updateGovernorate('gov-sousse', { status: 'SURCHARGE', currentLoadMw: 730 });
    this.electricityService.updateGovernorate('gov-benarous', { status: 'SURCHARGE', currentLoadMw: 610 });
    this.electricityService.updateGovernorate('gov-sfax', { status: 'SURCHARGE', currentLoadMw: 860 });
    this.addAuditLog('Simulation Canicule', 'Pic thermique +6°C appliqué à l\'ensemble du réseau', 'AVERTISSEMENT');
    this.notifService.showToast('Simulation Canicule Activée', 'Pic de charge déclenché : 4 gouvernorats en alerte de surcharge.', 'ALERT', 5000);
  }

  simulateStorm(): void {
    this.electricityService.updateGovernorate('gov-bizerte', { status: 'SURCHARGE', currentLoadMw: 495 });
    this.electricityService.updateGovernorate('gov-jendouba', { status: 'ELEVEE', currentLoadMw: 250 });
    this.addAuditLog('Simulation Tempête Nord', 'Réseaux Nord sous contrainte météo', 'AVERTISSEMENT');
    this.notifService.showToast('Alerte Tempête Simulée', 'Vents violents sur le Nord : coupures préventives engagées.', 'WARNING', 5000);
  }

  resetDemoData(): void {
    this.electricityService.resetScenario();
    this.electricityService.updateGovernorate('gov-tunis', { status: 'ELEVEE', currentLoadMw: 780 });
    this.electricityService.updateGovernorate('gov-sousse', { status: 'ELEVEE', currentLoadMw: 620 });
    this.electricityService.updateGovernorate('gov-benarous', { status: 'SURCHARGE', currentLoadMw: 540 });
    this.electricityService.updateGovernorate('gov-sfax', { status: 'ELEVEE', currentLoadMw: 730 });
    this.electricityService.updateGovernorate('gov-bizerte', { status: 'NORMAL', currentLoadMw: 390 });
    this.addAuditLog('Réinitialisation Démo', 'Toutes les métriques réseau revenues à l\'état nominal', 'SUCCES');
    this.notifService.showToast('Données Réinitialisées', 'État normal du réseau rétabli.', 'SUCCESS');
  }

  private addAuditLog(action: string, target: string, status: 'SUCCES' | 'AVERTISSEMENT' | 'ECHEC'): void {
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: 'À l\'instant',
      userEmail: 'admin@volttn.tn',
      userRole: 'ADMIN',
      action,
      target,
      status,
      details: 'Opération journalisée dans la console d\'administration VoltTN.'
    };
    this.auditLogsSignal.update(logs => [newLog, ...logs]);
  }
}
