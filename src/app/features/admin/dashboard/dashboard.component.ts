import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole } from '../../../models/user.model';
import { Tilt3dDirective } from '../../../shared/directives/tilt-3d.directive';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, Tilt3dDirective],
  template: `
    <div class="admin-page">
      
      <!-- En-tête Administration Système -->
      <div class="admin-header glass-card">
        <div class="header-left">
          <div class="badge-row">
            <span class="glass-badge badge-sun">
              <span class="material-symbols-rounded">admin_panel_settings</span>
              Supervision Système & Sécurité
            </span>
            <span class="glass-badge badge-nature">VoltTN Production v2.4</span>
          </div>
          <h1 class="header-title">Centre de Gestion & Gouvernance VoltTN</h1>
          <p class="header-desc">
            Gestion des 20 comptes utilisateurs, registre des modèles de prédiction IA, configuration des seuils et générateur d'états de démonstration.
          </p>
        </div>
        <div class="demo-generator-box">
          <span class="gen-title">Générateur Démo 1-Clic :</span>
          <div class="gen-buttons">
            <button class="btn-primary" (click)="adminService.simulateHeatwavePeak()">
              <span class="material-symbols-rounded">local_fire_department</span>
              <span>Canicule (+6°C)</span>
            </button>
            <button class="btn-sky" (click)="adminService.simulateStorm()">
              <span class="material-symbols-rounded">thunderstorm</span>
              <span>Tempête Nord</span>
            </button>
            <button class="btn-secondary" (click)="adminService.resetDemoData()">
              <span class="material-symbols-rounded">restart_alt</span>
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation par Onglets Administrateur -->
      <div class="tabs-nav glass-card">
        <button 
          class="tab-link" 
          [class.active]="activeTab() === 'users'" 
          (click)="activeTab.set('users')"
        >
          <span class="material-symbols-rounded">group</span>
          <span>Utilisateurs & Rôles ({{ adminService.users().length }})</span>
        </button>
        <button 
          class="tab-link" 
          [class.active]="activeTab() === 'ml'" 
          (click)="activeTab.set('ml')"
        >
          <span class="material-symbols-rounded">model_training</span>
          <span>Modèles IA & Prévision</span>
        </button>
        <button 
          class="tab-link" 
          [class.active]="activeTab() === 'thresholds'" 
          (click)="activeTab.set('thresholds')"
        >
          <span class="material-symbols-rounded">tune</span>
          <span>Seuils Régionaux</span>
        </button>
        <button 
          class="tab-link" 
          [class.active]="activeTab() === 'audit'" 
          (click)="activeTab.set('audit')"
        >
          <span class="material-symbols-rounded">history</span>
          <span>Journal d'Audit ({{ adminService.auditLogs().length }})</span>
        </button>
      </div>

      <!-- CONTENU ONGLET 1 : GESTION DES UTILISATEURS -->
      @if (activeTab() === 'users') {
        <div class="tab-content glass-card">
          <div class="table-top-bar">
            <div class="search-box">
              <span class="material-symbols-rounded">search</span>
              <input 
                type="text" 
                class="search-input" 
                placeholder="Rechercher par nom, email ou gouvernorat..." 
                [(ngModel)]="userSearch"
              />
            </div>
            <button class="btn-primary" (click)="openAddUserModal()">
              <span class="material-symbols-rounded">person_add</span>
              <span>Ajouter Utilisateur</span>
            </button>
          </div>

          <div class="table-responsive">
            <table class="volttn-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>Gouvernorat</th>
                  <th>Compteur / Info</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (u of filteredUsers(); track u.id) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <img [src]="u.avatar" [alt]="u.name" class="table-avatar" />
                        <div>
                          <div class="user-name">{{ u.name }}</div>
                          <div class="user-email">{{ u.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select 
                        class="role-select" 
                        [ngModel]="u.role" 
                        (ngModelChange)="onRoleChange(u, $event)"
                      >
                        <option value="CITOYEN">Citoyen</option>
                        <option value="OPERATEUR">Opérateur STEG</option>
                        <option value="TECHNICIEN">Technicien</option>
                        <option value="ADMIN">Administrateur</option>
                      </select>
                    </td>
                    <td>{{ u.governorate }}</td>
                    <td>
                      <span class="meter-tag">{{ u.meterNumber || 'Non associé' }}</span>
                    </td>
                    <td>
                      <span class="glass-badge" [ngClass]="u.status === 'ACTIF' ? 'badge-nature' : 'badge-coral'">
                        {{ u.status }}
                      </span>
                    </td>
                    <td>
                      <button 
                        class="btn-status-toggle" 
                        [class.btn-block]="u.status === 'ACTIF'"
                        (click)="adminService.toggleUserStatus(u.id)"
                      >
                        {{ u.status === 'ACTIF' ? 'Bloquer' : 'Débloquer' }}
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- CONTENU ONGLET 2 : REGISTRE MODÈLES IA -->
      @if (activeTab() === 'ml') {
        <div class="tab-content ml-models-grid">
          @for (model of adminService.models(); track model.id) {
            <div class="model-card glass-card" appTilt3d [maxTilt]="6">
              <div class="model-top">
                <div>
                  <div class="model-version-tag">{{ model.version }}</div>
                  <h3 class="model-name">{{ model.name }}</h3>
                  <span class="model-algo">{{ model.algorithm }}</span>
                </div>
                <span class="glass-badge" [ngClass]="model.status === 'ACTIF' ? 'badge-nature' : 'badge-sky'">
                  {{ model.status }}
                </span>
              </div>

              <p class="model-desc">{{ model.description }}</p>

              <div class="metrics-comparison">
                <div class="m-metric">
                  <span class="val">{{ model.maeMw }} MW</span>
                  <span class="lbl">MAE</span>
                </div>
                <div class="m-metric">
                  <span class="val">{{ model.rmseMw }} MW</span>
                  <span class="lbl">RMSE</span>
                </div>
                <div class="m-metric">
                  <span class="val highlight">{{ model.mapePercent }}%</span>
                  <span class="lbl">MAPE</span>
                </div>
                <div class="m-metric">
                  <span class="val">{{ model.featuresCount }}</span>
                  <span class="lbl">Features</span>
                </div>
              </div>

              <div class="model-footer">
                <span class="train-date">Entraîné le : {{ model.trainedAt }}</span>
                <div class="model-btn-row">
                  @if (model.status !== 'ACTIF') {
                    <button class="btn-secondary" (click)="adminService.activateModel(model.id)">
                      Activer en Prod
                    </button>
                  }
                  <button class="btn-primary" (click)="adminService.retrainModel(model.id)">
                    <span class="material-symbols-rounded">autorenew</span>
                    <span>Réentraîner</span>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- CONTENU ONGLET 3 : SEUILS RÉGIONAUX -->
      @if (activeTab() === 'thresholds') {
        <div class="tab-content glass-card">
          <div class="thresholds-header">
            <div>
              <h2 class="card-title">Configuration des Seuils d'Alerte MW</h2>
              <p class="card-sub">Déclenchement automatique des alertes en salle de contrôle STEG</p>
            </div>
          </div>

          <div class="thresholds-grid">
            @for (gov of getThresholdGovs(); track gov.id) {
              <div class="threshold-card glass-panel">
                <div class="th-name-row">
                  <span class="th-name">{{ gov.name }}</span>
                  <span class="th-val">{{ adminService.thresholds()[gov.id] || gov.capacityMw }} MW</span>
                </div>
                <input 
                  type="range" 
                  class="range-slider" 
                  min="200" 
                  [max]="gov.capacityMw * 1.1" 
                  [ngModel]="adminService.thresholds()[gov.id] || gov.capacityMw"
                  (ngModelChange)="onThresholdChange(gov.id, $event)"
                />
                <div class="th-info">
                  <span>Capacité nominale : {{ gov.capacityMw }} MW</span>
                  <span class="th-pct">
                    {{ Math.round(((adminService.thresholds()[gov.id] || gov.capacityMw) / gov.capacityMw) * 100) }}%
                  </span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- CONTENU ONGLET 4 : JOURNAL D'AUDIT -->
      @if (activeTab() === 'audit') {
        <div class="tab-content glass-card">
          <h2 class="card-title">Journal d'Audit & Traçabilité</h2>
          <p class="card-sub">Enregistrement infalsifiable des décisions opérateurs et modifications de modèles</p>

          <div class="audit-timeline">
            @for (log of adminService.auditLogs(); track log.id) {
              <div class="audit-item">
                <div class="audit-dot"></div>
                <div class="audit-card glass-panel">
                  <div class="audit-top">
                    <div>
                      <strong class="action-name">{{ log.action }}</strong>
                      <span class="target-name"> • {{ log.target }}</span>
                    </div>
                    <span class="log-time">{{ log.timestamp }}</span>
                  </div>
                  <div class="audit-meta">
                    Par : <strong>{{ log.userEmail }}</strong> ({{ log.userRole }})
                  </div>
                  <p class="audit-details">{{ log.details }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .admin-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 40px;
    }

    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 30px;
      border-radius: var(--radius-xl);
      gap: 20px;
      flex-wrap: wrap;
    }

    .badge-row {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }

    .header-title {
      font-size: 26px;
      font-weight: 900;
      color: var(--text-main);
      margin-bottom: 6px;
    }

    .header-desc {
      font-size: 14px;
      color: var(--text-muted);
      max-width: 600px;
    }

    .demo-generator-box {
      padding: 16px 20px;
      border-radius: var(--radius-lg);
      background: rgba(255, 255, 255, 0.9);
      border: 1.5px dashed var(--sun-gold);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .gen-title {
      font-size: 12px;
      font-weight: 800;
      color: #A35C00;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .gen-buttons {
      display: flex;
      gap: 8px;
    }

    /* Tabs */
    .tabs-nav {
      display: flex;
      gap: 8px;
      padding: 8px 12px;
      border-radius: var(--radius-lg);
      overflow-x: auto;
    }

    .tab-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: var(--radius-full);
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--transition-fast);

      &:hover { color: var(--text-main); }
      &.active {
        background: var(--sun-gradient);
        color: #FFFFFF;
        box-shadow: 0 4px 12px rgba(251, 133, 0, 0.35);
      }
    }

    .tab-content {
      padding: 24px;
      border-radius: var(--radius-xl);
    }

    .table-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.9);
      border: 1.5px solid rgba(29, 53, 87, 0.1);
      border-radius: var(--radius-full);
      width: 360px;
      max-width: 100%;

      .material-symbols-rounded { color: var(--text-light); }
    }

    .search-input {
      border: none;
      outline: none;
      background: transparent;
      font-size: 13.5px;
      width: 100%;
      color: var(--text-main);
    }

    .volttn-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;

      th {
        text-align: left;
        padding: 12px 14px;
        color: var(--text-muted);
        font-weight: 800;
        border-bottom: 2px solid rgba(29, 53, 87, 0.08);
      }

      td {
        padding: 12px 14px;
        color: var(--text-main);
        border-bottom: 1px solid rgba(29, 53, 87, 0.05);
      }
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .table-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--sun-gold);
    }

    .user-name {
      font-weight: 800;
      color: var(--text-main);
    }

    .user-email {
      font-size: 11.5px;
      color: var(--text-light);
    }

    .role-select {
      padding: 6px 10px;
      border-radius: var(--radius-md);
      border: 1px solid rgba(29, 53, 87, 0.12);
      background: rgba(255, 255, 255, 0.9);
      font-weight: 700;
      font-size: 12.5px;
      color: var(--text-main);
      cursor: pointer;
    }

    .meter-tag {
      font-family: var(--font-title);
      font-size: 12px;
      background: rgba(29, 53, 87, 0.06);
      padding: 3px 8px;
      border-radius: var(--radius-xs);
    }

    .btn-status-toggle {
      padding: 5px 12px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(29, 53, 87, 0.15);
      background: #FFFFFF;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      color: var(--nature-green);

      &.btn-block {
        color: var(--alert-coral);
        border-color: rgba(255, 107, 107, 0.3);
      }
    }

    /* ML Models */
    .ml-models-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
    }

    .model-card {
      padding: 24px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 16px;
    }

    .model-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .model-version-tag {
      font-size: 11px;
      font-weight: 800;
      color: var(--sun-amber);
      text-transform: uppercase;
    }

    .model-name {
      font-size: 18px;
      font-weight: 900;
      color: var(--text-main);
    }

    .model-algo {
      font-size: 12px;
      color: var(--text-light);
    }

    .model-desc {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.4;
    }

    .metrics-comparison {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.8);
    }

    .m-metric {
      display: flex;
      flex-direction: column;
      align-items: center;
      .val {
        font-family: var(--font-title);
        font-size: 16px;
        font-weight: 900;
        color: var(--text-main);
        &.highlight { color: var(--nature-green); }
      }
      .lbl {
        font-size: 10px;
        color: var(--text-light);
        font-weight: 700;
      }
    }

    .model-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid rgba(29, 53, 87, 0.08);
    }

    .train-date {
      font-size: 11.5px;
      color: var(--text-light);
    }

    .model-btn-row {
      display: flex;
      gap: 8px;
    }

    /* Thresholds */
    .thresholds-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 18px;
      margin-top: 16px;
    }

    .threshold-card {
      padding: 18px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .th-name-row {
      display: flex;
      justify-content: space-between;
      font-weight: 800;
      font-size: 14px;
      color: var(--text-main);
    }

    .th-val {
      color: var(--sun-amber);
    }

    .th-info {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-light);
    }

    .th-pct { font-weight: 700; color: var(--text-main); }

    /* Audit */
    .audit-timeline {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 18px;
    }

    .audit-item {
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }

    .audit-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--sun-gold);
      box-shadow: 0 0 8px var(--sun-gold);
      margin-top: 16px;
      flex-shrink: 0;
    }

    .audit-card {
      flex: 1;
      padding: 14px 18px;
      border-radius: var(--radius-md);
    }

    .audit-top {
      display: flex;
      justify-content: space-between;
      font-size: 13.5px;
      margin-bottom: 4px;
    }

    .action-name { color: var(--text-main); }
    .target-name { color: var(--sun-amber); font-weight: 700; }
    .log-time { font-size: 11px; color: var(--text-light); }
    .audit-meta { font-size: 11.5px; color: var(--text-light); margin-bottom: 6px; }
    .audit-details { font-size: 12.5px; color: var(--text-muted); }
  `]
})
export class AdminDashboardComponent {
  adminService = inject(AdminService);
  authService = inject(AuthService);

  activeTab = signal<'users' | 'ml' | 'thresholds' | 'audit'>('users');
  userSearch = '';
  Math = Math;

  filteredUsers(): User[] {
    const q = this.userSearch.trim().toLowerCase();
    const list = this.adminService.users();
    if (!q) return list;
    return list.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.governorate.toLowerCase().includes(q)
    );
  }

  onRoleChange(user: User, newRole: UserRole): void {
    this.adminService.changeUserRole(user.id, newRole);
  }

  onThresholdChange(govId: string, value: number): void {
    this.adminService.updateThreshold(govId, Number(value));
  }

  getThresholdGovs() {
    return [
      { id: 'gov-tunis', name: 'Tunis', capacityMw: 950 },
      { id: 'gov-benarous', name: 'Ben Arous', capacityMw: 620 },
      { id: 'gov-sousse', name: 'Sousse', capacityMw: 750 },
      { id: 'gov-sfax', name: 'Sfax', capacityMw: 880 },
      { id: 'gov-nabeul', name: 'Nabeul', capacityMw: 580 },
      { id: 'gov-bizerte', name: 'Bizerte', capacityMw: 510 }
    ];
  }

  openAddUserModal(): void {
    const name = prompt('Nom complet du nouvel utilisateur :');
    if (!name) return;
    const email = prompt('Email :');
    if (!email) return;
    const gov = prompt('Gouvernorat (ex: Tunis, Sfax, Sousse) :') || 'Tunis';

    this.adminService.addUser({
      name,
      email,
      governorate: gov,
      role: 'CITOYEN'
    });
  }
}
