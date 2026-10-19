import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SystemSchedulerService } from '../../../core/services/system-scheduler.service';
import { ElectricityService } from '../../../core/services/electricity.service';
import { User, UserRole } from '../../../models/user.model';
import { Tilt3dDirective } from '../../../shared/directives/tilt-3d.directive';

export interface ServiceHealth {
  name: string;
  category: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  latencyMs: number;
  uptimePct: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, Tilt3dDirective],
  template: `
    <div class="admin-page">
      
      <!-- En-tête Administration Système & Gouvernance -->
      <div class="admin-header glass-card animate-float">
        <div class="header-left">
          <div class="badge-row">
            <span class="glass-badge badge-sun">
              <span class="material-symbols-rounded">admin_panel_settings</span>
              Supervision Système & Sécurité
            </span>
            <span class="glass-badge badge-nature">VoltTN Production v2.4</span>
            <span class="glass-badge badge-sky">{{ activeUsersCount }} Utilisateurs Connectés en Direct</span>
          </div>
          <h1 class="header-title">Centre de Gestion & Gouvernance VoltTN</h1>
          <p class="header-desc">
            Gestion complète des utilisateurs et rôles, registre des modèles IA prédictifs, import de jeux de données, supervision des microservices et générateur de démonstration.
          </p>
        </div>
        
        <!-- Boîte Générateur Démo 1-Clic -->
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
          <span>Modèles IA & Réentraînement</span>
        </button>
        <button 
          class="tab-link" 
          [class.active]="activeTab() === 'regions'" 
          (click)="activeTab.set('regions')"
        >
          <span class="material-symbols-rounded">tune</span>
          <span>Régions & Seuils d'Alerte (24)</span>
        </button>
        <button 
          class="tab-link" 
          [class.active]="activeTab() === 'data'" 
          (click)="activeTab.set('data')"
        >
          <span class="material-symbols-rounded">upload_file</span>
          <span>Données & Imports CSV</span>
        </button>
        <button 
          class="tab-link" 
          [class.active]="activeTab() === 'supervision'" 
          (click)="activeTab.set('supervision')"
        >
          <span class="material-symbols-rounded">dns</span>
          <span>Supervision Services & Audit</span>
        </button>
      </div>

      <!-- ================= ONGLET 1 : UTILISATEURS & RÔLES ================= -->
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
                  <th>Rôle Actuel</th>
                  <th>Gouvernorat</th>
                  <th>Compteur Associé</th>
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
                      <div class="action-btn-group">
                        <button 
                          class="btn-status-toggle" 
                          [class.btn-block]="u.status === 'ACTIF'"
                          (click)="adminService.toggleUserStatus(u.id)"
                        >
                          {{ u.status === 'ACTIF' ? 'Bloquer' : 'Débloquer' }}
                        </button>
                        <button 
                          class="btn-delete-user" 
                          title="Supprimer ce compte"
                          (click)="adminService.deleteUser(u.id)"
                        >
                          <span class="material-symbols-rounded">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ================= ONGLET 2 : MODÈLES IA & RÉENTRAÎNEMENT ================= -->
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
                  {{ model.status === 'ACTIF' ? 'EN PRODUCTION' : model.status }}
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
                  <span class="lbl">Variables</span>
                </div>
              </div>

              <div class="model-footer">
                <span class="train-date">Entraîné : {{ model.trainedAt }}</span>
                <div class="model-btn-row">
                  @if (model.status !== 'ACTIF') {
                    <button class="btn-secondary" (click)="adminService.activateModel(model.id)">
                      Activer en Prod
                    </button>
                  }
                  <button class="btn-primary" (click)="triggerRetraining(model.id)">
                    <span class="material-symbols-rounded">autorenew</span>
                    <span>Réentraîner</span>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- ================= ONGLET 3 : RÉGIONS & SEUILS D'ALERTE (24 GOUVERNORATS) ================= -->
      @if (activeTab() === 'regions') {
        <div class="tab-content glass-card">
          <div class="thresholds-header">
            <div>
              <h2 class="card-title">Paramétrage des Capacités & Seuils des 24 Gouvernorats</h2>
              <p class="card-sub">Définition des capacités en MW, des seuils de déclenchement d'alertes SCADA et des tarifs</p>
            </div>
          </div>

          <div class="thresholds-grid">
            @for (gov of eleService.governorates(); track gov.id) {
              <div class="threshold-card glass-panel">
                <div class="th-name-row">
                  <div>
                    <strong class="th-name">{{ gov.name }}</strong>
                    <span class="th-sub">({{ gov.nameAr }})</span>
                  </div>
                  <span class="th-val">{{ adminService.thresholds()[gov.id] || gov.capacityMw }} MW</span>
                </div>
                <input 
                  type="range" 
                  class="range-slider" 
                  [min]="gov.capacityMw * 0.5" 
                  [max]="gov.capacityMw * 1.2" 
                  [ngModel]="adminService.thresholds()[gov.id] || gov.capacityMw"
                  (ngModelChange)="onThresholdChange(gov.id, $event)"
                />
                <div class="th-info">
                  <span>Capacité nominale : {{ gov.capacityMw }} MW</span>
                  <span class="th-pct">
                    Seuil alerte : {{ Math.round(((adminService.thresholds()[gov.id] || gov.capacityMw) / gov.capacityMw) * 100) }}%
                  </span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ================= ONGLET 4 : DONNÉES & IMPORTS CSV ================= -->
      @if (activeTab() === 'data') {
        <div class="tab-content data-mgmt-layout">
          
          <!-- Carte Import Fichier CSV -->
          <div class="import-card glass-card">
            <h3 class="card-title">Importer l'Historique de Consommation (CSV / Excel)</h3>
            <p class="card-sub">Téléchargez les relevés télétransmis des 100 000 compteurs basse tension</p>

            <div class="drop-zone" (click)="simulateFileSelect()">
              <span class="material-symbols-rounded drop-icon">cloud_upload</span>
              <strong class="drop-text">{{ selectedFileName() || 'Glissez-déposez votre fichier CSV ici ou cliquez pour parcourir' }}</strong>
              <span class="drop-sub">Format attendu : meter_id, timestamp, kwh, voltage_v, power_factor</span>
            </div>

            @if (selectedFileName()) {
              <div class="csv-preview-box glass-panel animate-float">
                <div class="preview-header">
                  <span class="preview-badge">Prévisualisation (5 premières lignes) :</span>
                  <span class="line-count">14 820 lignes détectées</span>
                </div>
                <pre class="csv-code">
MTR-TN-882419, 2025-10-19 08:00, 1.45, 228.4, 0.94
MTR-TN-882419, 2025-10-19 08:15, 1.62, 229.1, 0.95
MTR-SF-778811, 2025-10-19 08:00, 3.12, 226.5, 0.92
MTR-SO-441200, 2025-10-19 08:00, 0.88, 230.2, 0.96
MTR-BI-991122, 2025-10-19 08:00, 2.05, 227.8, 0.93</pre>
                
                <button class="btn-primary" (click)="confirmImport()">
                  <span class="material-symbols-rounded">file_download_done</span>
                  <span>Ingérer les Données dans le Data Warehouse STEG</span>
                </button>
              </div>
            }
          </div>

          <!-- Jours Fériés Tunisiens & Calendrier -->
          <div class="holidays-card glass-card">
            <h3 class="card-title">Calendrier des Jours Fériés en Tunisie</h3>
            <p class="card-sub">Prise en compte dans le modèle IA pour la baisse de charge industrielle (-350 MW)</p>

            <div class="holidays-list">
              @for (h of tunisianHolidays; track h.name) {
                <div class="holiday-item glass-panel">
                  <div class="h-date-box">
                    <span class="h-day">{{ h.date.split(' ')[0] }}</span>
                    <span class="h-month">{{ h.date.split(' ')[1] }}</span>
                  </div>
                  <div class="h-info">
                    <strong class="h-name">{{ h.name }}</strong>
                    <span class="h-impact">Impact estimé : {{ h.impactMw }} MW</span>
                  </div>
                  <span class="glass-badge badge-sky">Férié Chômé</span>
                </div>
              }
            </div>
          </div>

        </div>
      }

      <!-- ================= ONGLET 5 : SUPERVISION SERVICES & AUDIT ================= -->
      @if (activeTab() === 'supervision') {
        <div class="tab-content supervision-layout">
          
          <!-- État des Microservices -->
          <div class="services-health-card glass-card">
            <div class="table-top-bar">
              <h3 class="card-title">État Opérationnel des Microservices VoltTN</h3>
              <span class="glass-badge badge-nature">Tous les Services Opérationnels</span>
            </div>

            <div class="services-grid">
              @for (s of microservices(); track s.name) {
                <div class="service-item glass-panel">
                  <div class="s-top">
                    <div class="s-dot" [class.online]="s.status === 'ONLINE'"></div>
                    <strong>{{ s.name }}</strong>
                  </div>
                  <div class="s-cat">{{ s.category }}</div>
                  <div class="s-metrics">
                    <span>Latence : <strong>{{ s.latencyMs }} ms</strong></span>
                    <span>Disponibilité : <strong class="text-nature">{{ s.uptimePct }}%</strong></span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Journal d'Audit & Export -->
          <div class="audit-card-wrapper glass-card">
            <div class="table-top-bar">
              <div>
                <h3 class="card-title">Journal d'Audit en Temps Réel</h3>
                <span class="card-sub">{{ adminService.auditLogs().length }} événements répertoriés</span>
              </div>
              <button class="btn-secondary" (click)="exportAuditLogs()">
                <span class="material-symbols-rounded">file_download</span>
                <span>Exporter Audit (CSV)</span>
              </button>
            </div>

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

        </div>
      }

    </div>
  `,
  styles: [`
    .admin-page {
      display: flex;
      flex-direction: column;
      gap: 22px;
      padding-bottom: 50px;
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
      gap: 8px;
      margin-bottom: 10px;
      flex-wrap: wrap;
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
      max-width: 650px;
    }

    .demo-generator-box {
      padding: 16px 20px;
      border-radius: var(--radius-lg);
      background: rgba(255, 255, 255, 0.95);
      border: 1.5px dashed var(--sun-gold);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .gen-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #A35C00;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .gen-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
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
      border: 1px solid rgba(29, 53, 87, 0.08);
      background: rgba(255, 255, 255, 0.85);
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--transition-fast);

      .material-symbols-rounded { font-size: 18px; }

      &:hover { color: var(--text-main); }
      &.active {
        background: var(--text-main);
        color: #FFFFFF;
        border-color: transparent;
      }
    }

    .tab-content {
      padding: 24px;
      border-radius: var(--radius-xl);
    }

    /* Users Table */
    .table-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.9);
      border: 1.5px solid rgba(29, 53, 87, 0.1);
      width: 320px;
      max-width: 100%;
      .search-input { border: none; outline: none; background: transparent; font-size: 13.5px; width: 100%; }
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
    }

    .user-name { font-weight: 800; color: var(--text-main); font-size: 13.5px; }
    .user-email { font-size: 11.5px; color: var(--text-light); }

    .role-select {
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(29, 53, 87, 0.15);
      background: rgba(255, 255, 255, 0.9);
      font-size: 12px;
      font-weight: 700;
      outline: none;
    }

    .meter-tag {
      font-size: 11.5px;
      font-family: monospace;
      background: rgba(29, 53, 87, 0.06);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
    }

    .action-btn-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-status-toggle {
      padding: 4px 12px;
      border-radius: var(--radius-full);
      border: 1px solid var(--nature-green);
      background: var(--nature-light);
      color: var(--nature-green);
      font-size: 11.5px;
      font-weight: 800;
      cursor: pointer;
      &.btn-block {
        border-color: var(--alert-coral);
        background: var(--alert-coral-light);
        color: var(--alert-coral);
      }
    }

    .btn-delete-user {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(255, 107, 107, 0.1);
      border: 1px solid rgba(255, 107, 107, 0.3);
      color: var(--alert-coral);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      .material-symbols-rounded { font-size: 16px; }
      &:hover { background: var(--alert-coral); color: #FFFFFF; }
    }

    /* ML Models */
    .ml-models-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }

    .model-card {
      padding: 24px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .model-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .model-version-tag { font-size: 11px; font-weight: 800; color: var(--sun-amber); }
    .model-name { font-size: 17px; font-weight: 900; color: var(--text-main); }
    .model-algo { font-size: 11.5px; color: var(--text-light); }
    .model-desc { font-size: 12.5px; color: var(--text-muted); line-height: 1.35; }

    .metrics-comparison {
      display: flex;
      justify-content: space-between;
      background: rgba(255, 251, 242, 0.8);
      padding: 10px;
      border-radius: var(--radius-md);
      text-align: center;
      .val { font-size: 15px; font-weight: 900; color: var(--text-main); &.highlight { color: var(--nature-green); } }
      .lbl { font-size: 10.5px; color: var(--text-light); font-weight: 700; display: block; }
    }

    .model-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid rgba(29, 53, 87, 0.08);
      .train-date { font-size: 11px; color: var(--text-light); }
    }

    .model-btn-row { display: flex; gap: 8px; }

    /* Thresholds */
    .thresholds-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .threshold-card {
      padding: 16px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .th-name-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      .th-name { font-size: 13.5px; font-weight: 800; color: var(--text-main); }
      .th-sub { font-size: 11px; color: var(--text-light); margin-left: 4px; }
      .th-val { font-size: 15px; font-weight: 900; color: var(--sun-amber); }
    }

    .th-info {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-light);
    }

    .range-slider { width: 100%; accent-color: var(--sun-gold); }

    /* Data Management */
    .data-mgmt-layout, .supervision-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 22px;
    }

    .drop-zone {
      border: 2px dashed rgba(29, 53, 87, 0.2);
      border-radius: var(--radius-lg);
      padding: 30px 20px;
      text-align: center;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      margin: 16px 0;
      background: rgba(255, 251, 242, 0.5);
      transition: all var(--transition-fast);
      &:hover { border-color: var(--sun-gold); background: #FFFFFF; }
      .drop-icon { font-size: 40px; color: var(--sun-amber); }
      .drop-text { font-size: 13.5px; color: var(--text-main); }
      .drop-sub { font-size: 11px; color: var(--text-light); }
    }

    .csv-preview-box {
      padding: 16px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 700;
    }

    .csv-code {
      font-family: monospace;
      font-size: 11.5px;
      background: rgba(29, 53, 87, 0.05);
      padding: 10px;
      border-radius: var(--radius-sm);
      color: var(--text-main);
      overflow-x: auto;
    }

    .holidays-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 14px;
    }

    .holiday-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
    }

    .h-date-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--sun-light);
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      min-width: 44px;
      .h-day { font-size: 15px; font-weight: 900; color: #A35C00; }
      .h-month { font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
    }

    .h-info { flex: 1; display: flex; flex-direction: column; font-size: 12.5px; }
    .h-name { color: var(--text-main); }
    .h-impact { font-size: 11px; color: var(--text-light); }

    /* Services Grid */
    .services-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 14px;
    }

    .service-item {
      padding: 14px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .s-top {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-main);
    }

    .s-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--nature-green);
      box-shadow: 0 0 8px rgba(82, 183, 136, 0.8);
    }

    .s-cat { font-size: 11px; color: var(--text-light); }
    .s-metrics {
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      color: var(--text-muted);
      margin-top: 6px;
    }

    /* Timeline Audit */
    .audit-timeline {
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-height: 420px;
      overflow-y: auto;
      margin-top: 14px;
    }

    .audit-item { display: flex; gap: 12px; align-items: flex-start; }
    .audit-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--sun-gold); margin-top: 14px; flex-shrink: 0; }
    .audit-card { flex: 1; padding: 12px 16px; border-radius: var(--radius-md); }
    .audit-top { display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 2px; }
    .action-name { color: var(--text-main); }
    .target-name { color: var(--sun-amber); font-weight: 700; }
    .log-time { font-size: 10.5px; color: var(--text-light); }
    .audit-meta { font-size: 11px; color: var(--text-light); margin-bottom: 4px; }
    .audit-details { font-size: 12px; color: var(--text-muted); }

    @media (max-width: 1024px) {
      .data-mgmt-layout, .supervision-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminDashboardComponent {
  adminService = inject(AdminService);
  authService = inject(AuthService);
  eleService = inject(ElectricityService);
  notifService = inject(NotificationService);
  schedulerService = inject(SystemSchedulerService);

  activeTab = signal<'users' | 'ml' | 'regions' | 'data' | 'supervision'>('users');
  userSearch = '';
  Math = Math;
  activeUsersCount = 1428;

  selectedFileName = signal<string | null>(null);

  tunisianHolidays = [
    { date: '20 Mar', name: 'Fête de l\'Indépendance', impactMw: -350 },
    { date: '09 Avr', name: 'Journée des Martyrs', impactMw: -280 },
    { date: '01 Mai', name: 'Fête du Travail', impactMw: -410 },
    { date: '25 Juil', name: 'Fête de la République', impactMw: -380 },
    { date: '15 Oct', name: 'Fête de l\'Évacuation', impactMw: -320 },
    { date: '12 Nov', name: 'Aïd el-Fitr (Estimation)', impactMw: -450 }
  ];

  microservices = signal<ServiceHealth[]>([
    { name: 'Open-Meteo Gateway', category: 'API Externe Météo', status: 'ONLINE', latencyMs: 42, uptimePct: 99.94 },
    { name: 'LightGBM Predictor', category: 'Service ML & Infér.', status: 'ONLINE', latencyMs: 18, uptimePct: 99.98 },
    { name: 'SCADA Telemetry Broker', category: 'Ingestion Réseau', status: 'ONLINE', latencyMs: 12, uptimePct: 99.99 },
    { name: 'Notification Push Daemon', category: 'Messagerie & SMS', status: 'ONLINE', latencyMs: 65, uptimePct: 99.91 }
  ]);

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

  triggerRetraining(modelId: string): void {
    this.adminService.retrainModel(modelId);
  }

  simulateFileSelect(): void {
    this.selectedFileName.set('telemesure_steg_conso_octobre_2025.csv');
    this.notifService.showToast('Fichier Détecté', 'Fichier télémesure_steg_conso.csv prêt à être importé.', 'INFO');
  }

  confirmImport(): void {
    this.notifService.showToast(
      'Import Réussi !',
      '14 820 relevés de compteurs intégrés au Data Warehouse STEG avec succès.',
      'SUCCESS',
      4000
    );
    this.selectedFileName.set(null);
  }

  exportAuditLogs(): void {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      'Date,Utilisateur,Role,Action,Cible,Statut\n' +
      this.adminService.auditLogs().map(l => `${l.timestamp},${l.userEmail},${l.userRole},${l.action},${l.target},${l.status}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_VoltTN_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notifService.showToast('Audit Téléchargé', 'Fichier CSV du journal d\'audit prêt.', 'SUCCESS');
  }
}
