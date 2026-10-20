import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
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
          (click)="setTab('users')"
        >
          <span class="material-symbols-rounded">group</span>
          <span>Utilisateurs & Rôles ({{ adminService.users().length }})</span>
        </button>
        <button 
          class="tab-link" 
          [class.active]="activeTab() === 'ml'" 
          (click)="setTab('ml')"
        >
          <span class="material-symbols-rounded">model_training</span>
          <span>Modèles IA & Réentraînement</span>
        </button>
        <button 
          class="tab-link" 
          [class.active]="activeTab() === 'regions'" 
          (click)="setTab('regions')"
        >
          <span class="material-symbols-rounded">tune</span>
          <span>Régions & Seuils d'Alerte (24)</span>
        </button>
        <button 
          class="tab-link" 
          [class.active]="activeTab() === 'data'" 
          (click)="setTab('data')"
        >
          <span class="material-symbols-rounded">upload_file</span>
          <span>Données & Imports CSV</span>
        </button>
        <button 
          class="tab-link" 
          [class.active]="activeTab() === 'supervision'" 
          (click)="setTab('supervision')"
        >
          <span class="material-symbols-rounded">dns</span>
          <span>Supervision Services & Audit</span>
        </button>
      </div>

      <!-- ================= ONGLET 1 : UTILISATEURS & RÔLES ================= -->
      @if (activeTab() === 'users') {
        <div class="tab-content glass-card">
          <div class="table-top-bar">
            
            <div class="top-bar-left">
              <div class="search-box">
                <span class="material-symbols-rounded search-icon">search</span>
                <input 
                  type="text" 
                  class="search-input" 
                  placeholder="Rechercher par nom, email ou gouvernorat..." 
                  [(ngModel)]="userSearch"
                />
                @if (userSearch) {
                  <button class="clear-search-btn" (click)="userSearch = ''">
                    <span class="material-symbols-rounded">close</span>
                  </button>
                }
              </div>

              <!-- Filtres rapides par rôle -->
              <div class="role-filter-chips">
                <button 
                  class="filter-chip" 
                  [class.active]="roleFilter() === 'ALL'" 
                  (click)="roleFilter.set('ALL')"
                >
                  Tous ({{ adminService.users().length }})
                </button>
                <button 
                  class="filter-chip chip-citizen" 
                  [class.active]="roleFilter() === 'CITOYEN'" 
                  (click)="roleFilter.set('CITOYEN')"
                >
                  Citoyens
                </button>
                <button 
                  class="filter-chip chip-op" 
                  [class.active]="roleFilter() === 'OPERATEUR'" 
                  (click)="roleFilter.set('OPERATEUR')"
                >
                  Opérateurs
                </button>
                <button 
                  class="filter-chip chip-tech" 
                  [class.active]="roleFilter() === 'TECHNICIEN'" 
                  (click)="roleFilter.set('TECHNICIEN')"
                >
                  Techniciens
                </button>
                <button 
                  class="filter-chip chip-admin" 
                  [class.active]="roleFilter() === 'ADMIN'" 
                  (click)="roleFilter.set('ADMIN')"
                >
                  Admins
                </button>
              </div>
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
                  <th style="min-width: 250px;">Utilisateur</th>
                  <th style="min-width: 190px;">Rôle Actuel</th>
                  <th style="min-width: 150px;">Gouvernorat</th>
                  <th style="min-width: 170px;">Compteur Associé</th>
                  <th style="min-width: 130px;">Statut</th>
                  <th style="min-width: 160px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (u of filteredUsers(); track u.id) {
                  <tr class="user-row">
                    <td>
                      <div class="user-cell">
                        <div class="avatar-ring">
                          <img [src]="u.avatar" [alt]="u.name" class="table-avatar" />
                          <span class="avatar-status-dot" [class.online]="u.status === 'ACTIF'"></span>
                        </div>
                        <div class="user-meta">
                          <div class="user-name">{{ u.name }}</div>
                          <div class="user-email">{{ u.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="role-select-box" [ngClass]="'role-theme-' + u.role.toLowerCase()">
                        <select 
                          class="custom-role-dropdown" 
                          [ngModel]="u.role" 
                          (ngModelChange)="onRoleChange(u, $event)"
                        >
                          <option value="CITOYEN">👤 Citoyen</option>
                          <option value="OPERATEUR">⚡ Opérateur STEG</option>
                          <option value="TECHNICIEN">🛠️ Technicien</option>
                          <option value="ADMIN">🛡️ Administrateur</option>
                        </select>
                        <span class="material-symbols-rounded select-arrow">expand_more</span>
                      </div>
                    </td>
                    <td>
                      <div class="gov-cell">
                        <span class="material-symbols-rounded gov-icon">pin_drop</span>
                        <span class="gov-text">{{ u.governorate }}</span>
                      </div>
                    </td>
                    <td>
                      @if (u.meterNumber) {
                        <div class="meter-chip">
                          <span class="material-symbols-rounded meter-icon">electric_meter</span>
                          <span class="meter-val">{{ u.meterNumber }}</span>
                        </div>
                      } @else {
                        <span class="meter-empty">
                          <span class="material-symbols-rounded">link_off</span>
                          <span>Non associé</span>
                        </span>
                      }
                    </td>
                    <td>
                      <div class="status-badge" [class.badge-active]="u.status === 'ACTIF'" [class.badge-blocked]="u.status !== 'ACTIF'">
                        <span class="status-radar"></span>
                        <span class="status-label">{{ u.status === 'ACTIF' ? 'ACTIF' : 'BLOQUÉ' }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="action-btn-group">
                        <button 
                          class="action-btn-toggle" 
                          [class.btn-block]="u.status === 'ACTIF'"
                          [class.btn-unblock]="u.status !== 'ACTIF'"
                          (click)="adminService.toggleUserStatus(u.id)"
                          [title]="u.status === 'ACTIF' ? 'Bloquer ce compte' : 'Débloquer ce compte'"
                        >
                          <span class="material-symbols-rounded btn-icon">
                            {{ u.status === 'ACTIF' ? 'lock' : 'lock_open' }}
                          </span>
                          <span>{{ u.status === 'ACTIF' ? 'Bloquer' : 'Débloquer' }}</span>
                        </button>
                        <button 
                          class="action-btn-delete" 
                          title="Supprimer définitivement ce compte"
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
                <div class="metric-box">
                  <span class="val highlight">{{ model.mapePercent }}%</span>
                  <span class="lbl">MAPE (Erreur)</span>
                </div>
                <div class="metric-box">
                  <span class="val">{{ model.maeMw }} MW</span>
                  <span class="lbl">MAE</span>
                </div>
                <div class="metric-box">
                  <span class="val">{{ model.rmseMw }} MW</span>
                  <span class="lbl">RMSE</span>
                </div>
                <div class="metric-box">
                  <span class="val">{{ model.featuresCount }}</span>
                  <span class="lbl">Variables IA</span>
                </div>
              </div>

              <div class="model-footer">
                <span class="train-date">Dernier entraînement : {{ model.trainedAt }}</span>
                <div class="model-btn-row">
                  @if (model.status !== 'ACTIF') {
                    <button class="btn-primary" (click)="adminService.activateModel(model.id)">
                      <span class="material-symbols-rounded">check_circle</span>
                      <span>Activer</span>
                    </button>
                  }
                  <button class="btn-sky" (click)="triggerRetraining(model.id)">
                    <span class="material-symbols-rounded">autorenew</span>
                    <span>Réentraîner</span>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- ================= ONGLET 3 : RÉGIONS & SEUILS (24 GOUVERNORATS) ================= -->
      @if (activeTab() === 'regions') {
        <div class="tab-content glass-card">
          <div class="section-title-row">
            <div>
              <h2 class="card-title">Paramétrage des Seuils de Surcharge Réseau</h2>
              <p class="card-subtitle">Ajustez la capacité maximale en MW et le seuil d'alerte pour chaque gouvernorat tunisien.</p>
            </div>
            <span class="glass-badge badge-sun">24 Gouvernorats STEG Actifs</span>
          </div>

          <div class="thresholds-grid">
            @for (gov of eleService.governorates(); track gov.id) {
              <div class="threshold-card glass-panel">
                <div class="th-name-row">
                  <div>
                    <span class="th-name">{{ gov.name }}</span>
                    <span class="th-sub">({{ gov.nameAr }})</span>
                  </div>
                  <strong class="th-val">{{ gov.capacityMw }} MW</strong>
                </div>

                <div class="th-info">
                  <span>Charge actuelle : <strong>{{ gov.currentLoadMw }} MW</strong></span>
                  <span class="glass-badge" [ngClass]="gov.status === 'SURCHARGE' ? 'badge-coral' : (gov.status === 'ELEVEE' ? 'badge-sun' : 'badge-nature')">
                    {{ Math.round((gov.currentLoadMw / gov.capacityMw) * 100) }}%
                  </span>
                </div>

                <div class="slider-row">
                  <input 
                    type="range" 
                    min="100" 
                    max="1200" 
                    step="20"
                    [value]="gov.capacityMw" 
                    (input)="onThresholdChange(gov.id, +$any($event.target).value)" 
                    class="range-slider"
                  />
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ================= ONGLET 4 : DONNÉES & IMPORTS CSV ================= -->
      @if (activeTab() === 'data') {
        <div class="tab-content data-mgmt-layout">
          
          <div class="data-box glass-card">
            <h2 class="card-title">Importation des Données SCADA & Météo</h2>
            <p class="card-subtitle">Téléversez des fichiers CSV ou Excel contenant les séries de télémesures STEG pour le réentraînement des modèles.</p>

            <div class="drop-zone" (click)="simulateFileSelect()">
              <span class="material-symbols-rounded drop-icon">cloud_upload</span>
              <span class="drop-text">Glissez-déposez votre fichier de télémesure (.csv, .xlsx)</span>
              <span class="drop-sub">Format accepté : Horodatage, Code_Poste, Puissance_MW, Tension_kV, Température_C</span>
            </div>

            @if (selectedFileName()) {
              <div class="csv-preview-box glass-panel">
                <div class="preview-header">
                  <span>Fichier sélectionné : <strong>{{ selectedFileName() }}</strong></span>
                  <span class="glass-badge badge-nature">Format Valide</span>
                </div>
                <div class="csv-code">
                  timestamp,post_code,load_mw,temp_c<br>
                  2025-10-18 12:00,RADES_225,482.4,28.4<br>
                  2025-10-18 13:00,GHANNOUCH,340.1,31.2<br>
                  2025-10-18 14:00,MORNAGUIA,295.8,29.8
                </div>
                <button class="btn-primary" (click)="confirmImport()">
                  <span class="material-symbols-rounded">publish</span>
                  <span>Intégrer dans la Base STEG</span>
                </button>
              </div>
            }
          </div>

          <div class="holidays-box glass-card">
            <h2 class="card-title">Calendrier des Jours Fériés Tunisiens</h2>
            <p class="card-subtitle">Facteurs d'ajustement du profil de consommation industrielle pour l'algorithme LightGBM.</p>

            <div class="holidays-list">
              @for (h of tunisianHolidays; track h.name) {
                <div class="holiday-item glass-panel">
                  <div class="h-date-box">
                    <span class="h-day">{{ h.date.split(' ')[0] }}</span>
                    <span class="h-month">{{ h.date.split(' ')[1] }}</span>
                  </div>
                  <div class="h-info">
                    <strong class="h-name">{{ h.name }}</strong>
                    <span class="h-impact">Impact moyen sur la charge : <strong class="text-coral">{{ h.impactMw }} MW</strong></span>
                  </div>
                  <span class="glass-badge badge-sun">Modélisé</span>
                </div>
              }
            </div>
          </div>

          <!-- Centre d'Exportation Multi-Formats (CSV, JSON, PDF, Excel) [NOUVEAU] -->
          <div class="export-box glass-card">
            <div class="section-title-row">
              <div>
                <h2 class="card-title">Centre d'Exportation Multi-Formats des Données STEG</h2>
                <p class="card-subtitle">Exportez l'intégralité des configurations réseau, profils utilisateurs, seuils et modèles ML sous le format de votre choix.</p>
              </div>
              <span class="glass-badge badge-sky">Conforme STEG & ANME</span>
            </div>

            <div class="export-buttons-grid">
              <button class="export-card-btn glass-panel" (click)="exportData('CSV')">
                <div class="exp-icon-box csv">
                  <span class="material-symbols-rounded">csv</span>
                </div>
                <div class="exp-info">
                  <strong>Export CSV (.csv)</strong>
                  <span>Données brutes de télémesure SCADA</span>
                </div>
                <span class="material-symbols-rounded exp-arrow">download</span>
              </button>

              <button class="export-card-btn glass-panel" (click)="exportData('EXCEL')">
                <div class="exp-icon-box excel">
                  <span class="material-symbols-rounded">table_view</span>
                </div>
                <div class="exp-info">
                  <strong>Export Excel (.xlsx)</strong>
                  <span>Tableur consolidé des 24 gouvernorats</span>
                </div>
                <span class="material-symbols-rounded exp-arrow">download</span>
              </button>

              <button class="export-card-btn glass-panel" (click)="exportData('JSON')">
                <div class="exp-icon-box json">
                  <span class="material-symbols-rounded">data_object</span>
                </div>
                <div class="exp-info">
                  <strong>Export JSON (.json)</strong>
                  <span>Snapshot API complet du système</span>
                </div>
                <span class="material-symbols-rounded exp-arrow">download</span>
              </button>

              <button class="export-card-btn glass-panel" (click)="exportData('PDF')">
                <div class="exp-icon-box pdf">
                  <span class="material-symbols-rounded">picture_as_pdf</span>
                </div>
                <div class="exp-info">
                  <strong>Export PDF (.pdf)</strong>
                  <span>Rapport d'audit exécutif mensuel</span>
                </div>
                <span class="material-symbols-rounded exp-arrow">download</span>
              </button>
            </div>
          </div>

        </div>
      }

      <!-- ================= ONGLET 5 : SUPERVISION & AUDIT ================= -->
      @if (activeTab() === 'supervision') {
        <div class="tab-content supervision-layout">
          
          <div class="services-box glass-card">
            <h2 class="card-title">État des Microservices VoltTN</h2>
            <p class="card-subtitle">Surveillance télémétrique et disponibilité des serveurs de prédiction et d'ingestion.</p>

            <div class="services-grid">
              @for (srv of microservices(); track srv.name) {
                <div class="service-item glass-panel">
                  <div class="s-top">
                    <span class="s-dot"></span>
                    <strong>{{ srv.name }}</strong>
                  </div>
                  <span class="s-cat">{{ srv.category }}</span>
                  <div class="s-metrics">
                    <span>Disponibilité : <strong>{{ srv.uptimePct }}%</strong></span>
                    <span>Latence : <strong>{{ srv.latencyMs }} ms</strong></span>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="audit-box glass-card">
            <div class="section-title-row">
              <div>
                <h2 class="card-title">Journal d'Audit & Sécurité</h2>
                <p class="card-subtitle">Traçabilité complète des actions effectuées par les opérateurs et administrateurs.</p>
              </div>
              <button class="btn-secondary" (click)="exportAuditLogs()">
                <span class="material-symbols-rounded">download</span>
                <span>Exporter CSV</span>
              </button>
            </div>

            <div class="audit-timeline">
              @for (log of adminService.auditLogs(); track log.id) {
                <div class="audit-item">
                  <div class="audit-dot"></div>
                  <div class="audit-card glass-panel">
                    <div class="audit-top">
                      <strong class="action-name">{{ log.action }}</strong>
                      <span class="target-name">{{ log.target }}</span>
                      <span class="log-time">{{ log.timestamp }}</span>
                    </div>
                    <div class="audit-meta">
                      <span>Utilisateur : <strong>{{ log.userEmail }}</strong> ({{ log.userRole }})</span>
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
      gap: 24px;
      padding-bottom: 50px;
    }

    .admin-header {
      padding: 26px 30px;
      border-radius: var(--radius-xl);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }

    .badge-row {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
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
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: rgba(255, 255, 255, 0.9);
      padding: 12px 16px;
      border-radius: var(--radius-lg);
      border: 1px solid rgba(251, 133, 0, 0.2);
      box-shadow: var(--shadow-sm);
    }

    .gen-title {
      font-size: 11.5px;
      font-weight: 800;
      color: var(--sun-amber);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .gen-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      button { font-size: 12px; padding: 7px 12px; }
    }

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

    /* Users Table Premium Top Bar */
    .table-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 22px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      flex: 1;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 18px;
      border-radius: var(--radius-full);
      background: #FFFFFF;
      border: 1.5px solid rgba(29, 53, 87, 0.12);
      width: 310px;
      max-width: 100%;
      box-shadow: 0 2px 10px rgba(29, 53, 87, 0.04);
      transition: all var(--transition-fast);

      &:focus-within {
        border-color: var(--sun-amber);
        box-shadow: 0 0 0 3px rgba(251, 133, 0, 0.15);
      }

      .search-icon {
        font-size: 20px;
        color: var(--text-muted);
      }

      .search-input {
        border: none;
        outline: none;
        background: transparent;
        font-size: 13.5px;
        width: 100%;
        color: var(--text-main);
      }

      .clear-search-btn {
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        color: var(--text-light);
        padding: 0;
        &:hover { color: var(--text-main); }
        .material-symbols-rounded { font-size: 16px; }
      }
    }

    /* Role filter chips */
    .role-filter-chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .filter-chip {
      padding: 6px 14px;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.9);
      border: 1.5px solid rgba(29, 53, 87, 0.1);
      color: var(--text-muted);
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--sun-amber);
        color: var(--text-main);
      }

      &.active {
        background: var(--text-main);
        color: #FFFFFF;
        border-color: var(--text-main);
        box-shadow: 0 2px 8px rgba(29, 53, 87, 0.2);
      }

      &.chip-citizen.active { background: #2D6A4F; border-color: #2D6A4F; }
      &.chip-op.active { background: #0E6BA8; border-color: #0E6BA8; }
      &.chip-tech.active { background: #D97706; border-color: #D97706; }
      &.chip-admin.active { background: #5B21B6; border-color: #5B21B6; }
    }

    /* User Row Styling */
    .user-row {
      td {
        padding: 16px 20px;
      }
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .avatar-ring {
      position: relative;
      width: 42px;
      height: 42px;
      flex-shrink: 0;
    }

    .table-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      object-fit: cover;
      box-shadow: 0 2px 8px rgba(29, 53, 87, 0.12);
      border: 2px solid #FFFFFF;
    }

    .avatar-status-dot {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--alert-coral);
      border: 2px solid #FFFFFF;

      &.online {
        background: var(--nature-green);
        box-shadow: 0 0 6px rgba(82, 183, 136, 0.8);
      }
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .user-name {
      font-weight: 800;
      color: var(--text-main);
      font-size: 14px;
      line-height: 1.2;
    }

    .user-email {
      font-size: 12px;
      color: var(--text-muted);
    }

    /* Role Dropdown Select */
    .role-select-box {
      position: relative;
      display: inline-flex;
      align-items: center;
      width: 175px;
    }

    .custom-role-dropdown {
      width: 100%;
      appearance: none;
      -webkit-appearance: none;
      padding: 7px 32px 7px 12px;
      border-radius: var(--radius-full);
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      outline: none;
      transition: all var(--transition-fast);
      background: #FFFFFF;
      border: 1.5px solid rgba(29, 53, 87, 0.15);
      color: var(--text-main);

      &:hover {
        border-color: var(--sun-amber);
      }

      &:focus {
        border-color: var(--sun-amber);
        box-shadow: 0 0 0 3px rgba(251, 133, 0, 0.15);
      }
    }

    .role-select-box.role-theme-citoyen .custom-role-dropdown {
      border-color: rgba(82, 183, 136, 0.4);
      background: rgba(234, 247, 240, 0.7);
    }
    .role-select-box.role-theme-operateur .custom-role-dropdown {
      border-color: rgba(42, 157, 244, 0.4);
      background: rgba(228, 247, 253, 0.7);
    }
    .role-select-box.role-theme-technicien .custom-role-dropdown {
      border-color: rgba(251, 133, 0, 0.4);
      background: rgba(255, 240, 194, 0.7);
    }
    .role-select-box.role-theme-admin .custom-role-dropdown {
      border-color: rgba(147, 51, 234, 0.4);
      background: rgba(243, 232, 255, 0.7);
    }

    .select-arrow {
      position: absolute;
      right: 10px;
      font-size: 18px;
      color: var(--text-muted);
      pointer-events: none;
    }

    /* Governorate Cell */
    .gov-cell {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--text-main);
      font-weight: 700;
      font-size: 13.5px;

      .gov-icon {
        font-size: 18px;
        color: var(--sun-amber);
      }
    }

    /* Meter Chip */
    .meter-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      background: rgba(29, 53, 87, 0.06);
      border: 1px solid rgba(29, 53, 87, 0.1);
      color: var(--text-main);

      .meter-icon {
        font-size: 16px;
        color: var(--sky-ocean);
      }

      .meter-val {
        font-family: monospace;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.5px;
      }
    }

    .meter-empty {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: var(--text-light);
      font-style: italic;

      .material-symbols-rounded { font-size: 15px; }
    }

    /* Modern Status Badge with Radar Pulse */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 5px 12px;
      border-radius: var(--radius-full);
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 0.5px;

      &.badge-active {
        background: rgba(82, 183, 136, 0.12);
        color: #2D6A4F;
        border: 1px solid rgba(82, 183, 136, 0.3);

        .status-radar {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2D6A4F;
          box-shadow: 0 0 6px #2D6A4F;
        }
      }

      &.badge-blocked {
        background: rgba(255, 107, 107, 0.12);
        color: #B91C1C;
        border: 1px solid rgba(255, 107, 107, 0.3);

        .status-radar {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #B91C1C;
        }
      }
    }

    /* Action Buttons Group */
    .action-btn-group {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    .action-btn-toggle {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 14px;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      transition: all var(--transition-fast);

      .btn-icon { font-size: 15px; }

      &.btn-block {
        border: 1.5px solid rgba(255, 107, 107, 0.4);
        background: rgba(255, 107, 107, 0.08);
        color: #D90429;

        &:hover {
          background: #D90429;
          color: #FFFFFF;
          border-color: #D90429;
          transform: translateY(-1px);
        }
      }

      &.btn-unblock {
        border: 1.5px solid rgba(82, 183, 136, 0.4);
        background: rgba(82, 183, 136, 0.1);
        color: #2D6A4F;

        &:hover {
          background: #2D6A4F;
          color: #FFFFFF;
          border-color: #2D6A4F;
          transform: translateY(-1px);
        }
      }
    }

    .action-btn-delete {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 107, 107, 0.08);
      border: 1.5px solid rgba(255, 107, 107, 0.25);
      color: #D90429;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);

      .material-symbols-rounded { font-size: 18px; }

      &:hover {
        background: #D90429;
        color: #FFFFFF;
        border-color: #D90429;
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(217, 4, 41, 0.3);
      }
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
    /* Export Multi-Formats Box */
    .export-box {
      margin-top: 14px;
      padding: 24px;
      border-radius: var(--radius-xl);
    }

    .export-buttons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-top: 18px;
    }

    .export-card-btn {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
      border-radius: var(--radius-lg);
      border: 1px solid rgba(29, 53, 87, 0.1);
      background: rgba(255, 255, 255, 0.9);
      cursor: pointer;
      text-align: left;
      transition: all 0.25s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: var(--sky-blue);
        .exp-arrow { color: var(--sky-blue); transform: translateY(2px); }
      }
    }

    .exp-icon-box {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.csv { background: rgba(14, 107, 168, 0.12); color: var(--sky-blue); }
      &.excel { background: rgba(82, 183, 136, 0.15); color: var(--nature-green); }
      &.json { background: rgba(245, 158, 11, 0.15); color: var(--sun-amber); }
      &.pdf { background: rgba(239, 71, 111, 0.15); color: var(--alert-coral); }
    }

    .exp-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      strong { font-size: 13.5px; color: var(--text-main); }
      span { font-size: 11px; color: var(--text-light); }
    }

    .exp-arrow {
      color: var(--text-light);
      font-size: 20px;
      transition: all 0.2s;
    }

    @media (max-width: 1024px) {
      .data-mgmt-layout, .supervision-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  adminService = inject(AdminService);
  authService = inject(AuthService);
  eleService = inject(ElectricityService);
  notifService = inject(NotificationService);
  schedulerService = inject(SystemSchedulerService);
  router = inject(Router);

  activeTab = signal<'users' | 'ml' | 'regions' | 'data' | 'supervision'>('users');
  roleFilter = signal<string>('ALL');
  userSearch = '';
  Math = Math;
  activeUsersCount = 1428;

  selectedFileName = signal<string | null>(null);
  private navSub?: Subscription;

  ngOnInit(): void {
    this.syncTabFromUrl();
    this.navSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.syncTabFromUrl();
    });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  syncTabFromUrl(): void {
    const url = this.router.url;
    if (url.includes('/admin/thresholds')) {
      this.activeTab.set('regions');
    } else if (url.includes('/admin/ml-models')) {
      this.activeTab.set('ml');
    } else if (url.includes('/admin/data') || url.includes('/admin/demo-generator')) {
      this.activeTab.set('data');
    } else if (url.includes('/admin/audit') || url.includes('/admin/supervision')) {
      this.activeTab.set('supervision');
    } else {
      this.activeTab.set('users');
    }
  }

  setTab(tab: 'users' | 'ml' | 'regions' | 'data' | 'supervision'): void {
    this.activeTab.set(tab);
    const routeMap: Record<string, string> = {
      users: '/admin/users',
      ml: '/admin/ml-models',
      regions: '/admin/thresholds',
      data: '/admin/data',
      supervision: '/admin/audit'
    };
    if (routeMap[tab]) {
      this.router.navigateByUrl(routeMap[tab]);
    }
  }

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
    const role = this.roleFilter();
    let list = this.adminService.users();

    if (role !== 'ALL') {
      list = list.filter(u => u.role === role);
    }

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

  exportData(format: 'CSV' | 'EXCEL' | 'JSON' | 'PDF'): void {
    const dateStr = new Date().toISOString().split('T')[0];
    const govs = this.eleService.governorates();
    const users = this.adminService.users();

    if (format === 'CSV' || format === 'EXCEL') {
      const header = 'Gouvernorat,Nom_Arabe,Capacite_MW,Charge_Actuelle_MW,Temperature_C,Statut\n';
      const rows = govs.map(g => `${g.name},${g.nameAr},${g.capacityMw},${g.currentLoadMw},${g.temperatureC},${g.status}`).join('\n');
      const blob = new Blob([header + rows], { type: format === 'EXCEL' ? 'application/vnd.ms-excel;charset=utf-8' : 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Donnees_Reseau_STEG_${dateStr}.${format === 'EXCEL' ? 'xlsx' : 'csv'}`;
      link.click();
      URL.revokeObjectURL(url);
      this.notifService.showToast(`Export ${format} Réussi`, `Fichier ${format} généré et téléchargé.`, 'SUCCESS');
    } else if (format === 'JSON') {
      const exportPayload = {
        meta: { app: 'VoltTN', version: '2.4.0', exportedAt: new Date().toISOString() },
        governorates: govs,
        usersCount: users.length,
        models: this.adminService.models()
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `VoltTN_Snapshot_${dateStr}.json`;
      link.click();
      URL.revokeObjectURL(url);
      this.notifService.showToast('Export JSON Réussi', 'Snapshot JSON exporté.', 'SUCCESS');
    } else if (format === 'PDF') {
      const reportContent = `
========================================================================
             RAPPORT EXÉCUTIF MENSUEL DU RÉSEAU ÉLECTRIQUE STEG
             Direction Générale de la Distribution et du Transport
========================================================================
Date d'édition    : ${dateStr}
Plateforme        : VoltTN Supervision Intelligente
Utilisateurs      : ${users.length} comptes enregistrés

1. SYNTHÈSE NATIONALE DU RÉSEAU
------------------------------------------------------------------------
Capacité Totale Installée : ${this.eleService.totalCapacityMw().toLocaleString()} MW
Charge Nationale Actuelle : ${this.eleService.totalCurrentLoadMw().toLocaleString()} MW
Marge de Réserve          : ${this.eleService.reserveMarginPct()}%
Injection Solaire & Éolien : ${this.eleService.nationalSolarMw()} MW (${this.eleService.solarSharePct()}% du mix)

2. SITUATION DES 24 GOUVERNORATS
------------------------------------------------------------------------
${govs.map(g => `• ${g.name.padEnd(14)} : ${g.currentLoadMw.toString().padStart(4)} / ${g.capacityMw.toString().padStart(4)} MW (${Math.round((g.currentLoadMw / g.capacityMw) * 100)}%) [${g.status}]`).join('\n')}

3. MODÈLES D'INTELLIGENCE ARTIFICIELLE
------------------------------------------------------------------------
• LightGBM v2.4 (Prévision de charge) : MAE 18.4 MW • MAPE 2.10% (EN PRODUCTION)
• XGBoost SHAP (Détection de fraude) : Précision 94.2% • ROC-AUC 0.96
• Tesseract OCR (Reconnaissance index) : Précision 98.7%
• DistilBERT NLP (Avis de coupures)   : F1-Score 93.4%

Signé : Direction de la Planification Énergétique STEG
`;
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rapport_Executif_STEG_${dateStr}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      this.notifService.showToast('Rapport PDF/Texte Téléchargé', 'Rapport exécutif STEG généré.', 'SUCCESS');
    }
  }
}
