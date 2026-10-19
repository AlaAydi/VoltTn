import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OutageService } from '../../../core/services/outage.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FraudService } from '../../../core/services/fraud.service';
import { OutageReport, OutageStatus } from '../../../models/outage.model';
import { FraudAlert } from '../../../models/fraud.model';
import { Tilt3dDirective } from '../../../shared/directives/tilt-3d.directive';

export interface MaintenanceTask {
  id: string;
  equipment: string;
  equipmentType: string;
  governorate: string;
  district: string;
  plannedDate: string;
  priority: 'HAUTE' | 'MOYENNE' | 'FAIBLE';
  status: 'PLANIFIE' | 'EN_COURS' | 'VALIDE';
  description: string;
}

@Component({
  selector: 'app-technicien-interventions',
  standalone: true,
  imports: [CommonModule, FormsModule, Tilt3dDirective],
  template: `
    <div class="tech-page">
      
      <!-- En-tête Espace Technicien Mobile & Réactif -->
      <div class="tech-header glass-card animate-float">
        <div class="header-content">
          <div class="badge-row">
            <span class="glass-badge badge-sun">
              <span class="material-symbols-rounded">engineering</span>
              Équipe d'Intervention Rapide STEG
            </span>
            <span class="glass-badge badge-sky">District Nord-Est & Grand Tunis</span>
            <span class="glass-badge badge-nature">Agent Actif : {{ authService.currentUser()?.name }}</span>
          </div>
          <h1 class="header-title">Console Terrain & Ordres de Mission</h1>
          <p class="header-desc">
            Interventions sur pannes moyenne/basse tension, audits anti-fraude sur compteurs suspects et maintenance préventive.
          </p>
        </div>
        <div class="status-counters">
          <div class="count-box coral">
            <span class="c-val">{{ countPending() }}</span>
            <span class="c-label">À Prendre en Charge</span>
          </div>
          <div class="count-box sun">
            <span class="c-val">{{ countInProgress() }}</span>
            <span class="c-label">En Cours de Réparation</span>
          </div>
          <div class="count-box sky">
            <span class="c-val">{{ pendingInspections().length }}</span>
            <span class="c-label">Inspections Compteurs</span>
          </div>
          <div class="count-box nature">
            <span class="c-val">{{ countResolved() }}</span>
            <span class="c-label">Résolus Aujourd'hui</span>
          </div>
        </div>
      </div>

      <!-- Navigation par Onglets Technicien -->
      <div class="filter-bar glass-card">
        <div class="tab-filters">
          <button 
            class="tab-btn" 
            [class.active]="currentTechTab() === 'interventions'" 
            (click)="currentTechTab.set('interventions')"
          >
            <span class="material-symbols-rounded">power_off</span>
            <span>Missions Dépannage Réseau ({{ myInterventions().length }})</span>
          </button>
          <button 
            class="tab-btn" 
            [class.active]="currentTechTab() === 'inspections'" 
            (click)="currentTechTab.set('inspections')"
          >
            <span class="material-symbols-rounded">policy</span>
            <span>Inspections Compteurs Suspects ({{ pendingInspections().length }})</span>
          </button>
          <button 
            class="tab-btn" 
            [class.active]="currentTechTab() === 'maintenance'" 
            (click)="currentTechTab.set('maintenance')"
          >
            <span class="material-symbols-rounded">build_circle</span>
            <span>Planning Maintenance Préventive ({{ maintenanceTasks().length }})</span>
          </button>
        </div>
      </div>

      <!-- ONGLET 1 : MISSIONS DÉPANNAGE RÉSEAU -->
      @if (currentTechTab() === 'interventions') {
        <div class="sub-filter-row">
          <div class="pill-group">
            <button class="pill" [class.active]="activeSubTab() === 'ALL'" (click)="activeSubTab.set('ALL')">Tous ({{ myInterventions().length }})</button>
            <button class="pill coral" [class.active]="activeSubTab() === 'SIGNALE'" (click)="activeSubTab.set('SIGNALE')">Non Démarrées ({{ countPending() }})</button>
            <button class="pill sun" [class.active]="activeSubTab() === 'EN_COURS'" (click)="activeSubTab.set('EN_COURS')">En Cours ({{ countInProgress() }})</button>
            <button class="pill nature" [class.active]="activeSubTab() === 'RESOLU'" (click)="activeSubTab.set('RESOLU')">Résolues ({{ countResolved() }})</button>
          </div>
        </div>

        <div class="interventions-grid">
          @for (item of filteredInterventions(); track item.id) {
            <div class="intervention-card glass-card" appTilt3d [maxTilt]="6">
              
              <div class="card-top">
                <div class="ref-group">
                  <span class="ref-badge">{{ item.reference }}</span>
                  <span class="type-tag">{{ formatType(item.type) }}</span>
                </div>
                <span class="glass-badge" [ngClass]="'badge-' + getSeverityColor(item.severity)">
                  {{ item.severity }}
                </span>
              </div>

              <div class="location-group">
                <span class="material-symbols-rounded loc-icon">location_on</span>
                <div>
                  <h3 class="loc-address">{{ item.address }}</h3>
                  <span class="loc-gov">{{ item.district }}, <strong>{{ item.governorate }}</strong></span>
                </div>
              </div>

              <div class="details-list">
                <div class="detail-row">
                  <span class="d-label">Abonnés impactés :</span>
                  <span class="d-val text-coral font-bold">{{ item.affectedCustomers | number }}</span>
                </div>
                <div class="detail-row">
                  <span class="d-label">Signalé le :</span>
                  <span class="d-val">{{ item.reportedAt }}</span>
                </div>
                <div class="detail-row">
                  <span class="d-label">Rétablissement estimé :</span>
                  <span class="d-val highlight">{{ item.estimatedResolution }}</span>
                </div>
              </div>

              <!-- Notes techniques actuelles -->
              <div class="notes-box">
                <span class="notes-caption">Diagnostic / Notes :</span>
                <p class="notes-text">{{ item.notes }}</p>
              </div>

              <!-- Actions du Technicien -->
              <div class="action-footer">
                @if (item.status === 'SIGNALE') {
                  <div class="status-action-row">
                    <button class="btn-primary btn-full" (click)="updateStatus(item, 'EN_COURS')">
                      <span class="material-symbols-rounded">play_arrow</span>
                      <span>Prendre en Charge & Aller sur Site</span>
                    </button>
                    <button class="btn-secondary btn-icon-only" (click)="showItinerary(item)" title="Voir itinéraire">
                      <span class="material-symbols-rounded">near_me</span>
                    </button>
                  </div>
                } @else if (item.status === 'EN_COURS') {
                  <div class="status-action-row">
                    <button class="btn-nature btn-half" (click)="openResolveDialog(item)">
                      <span class="material-symbols-rounded">check_circle</span>
                      <span>Clôturer (Résolu)</span>
                    </button>
                    <button class="btn-secondary btn-half" (click)="showItinerary(item)">
                      <span class="material-symbols-rounded">navigation</span>
                      <span>Itinéraire GPS</span>
                    </button>
                  </div>
                } @else {
                  <div class="resolved-banner">
                    <span class="material-symbols-rounded check-icon">verified</span>
                    <span>Intervention finalisée • Courant rétabli</span>
                  </div>
                }
              </div>

            </div>
          }
        </div>
      }

      <!-- ONGLET 2 : INSPECTIONS DE COMPTEURS SUSPECTS (ANTI-FRAUDE) -->
      @if (currentTechTab() === 'inspections') {
        <div class="inspections-list-container">
          <div class="section-notice glass-card">
            <span class="material-symbols-rounded text-coral">policy</span>
            <p>
              Ces ordres d'inspection ont été déclenchés par les analystes STEG suite à un score d'explicabilité SHAP élevé (chute brutale ou dérivation). Réalisez le contrôle physique du scellé et saisissez le constat.
            </p>
          </div>

          <div class="inspections-grid">
            @for (alert of pendingInspections(); track alert.id) {
              <div class="inspection-card glass-card" appTilt3d [maxTilt]="6">
                <div class="card-top">
                  <div>
                    <span class="ref-badge">{{ alert.meterId }}</span>
                    <h3 class="client-name">{{ alert.customerName }}</h3>
                    <span class="client-addr">{{ alert.address }}, <strong>{{ alert.governorate }}</strong></span>
                  </div>
                  <span class="score-pill coral">Score SHAP {{ alert.suspicionScore }}%</span>
                </div>

                <div class="anomaly-box">
                  <span class="lbl">Suspicion IA :</span>
                  <strong class="val text-coral">{{ alert.anomalyType }}</strong>
                </div>

                <div class="shap-mini-tags">
                  @for (factor of alert.shapFactors; track factor.name) {
                    <span class="mini-factor-tag">{{ factor.nameFr }} : {{ factor.observedValue }}</span>
                  }
                </div>

                <button class="btn-primary btn-full" (click)="openInspectionForm(alert)">
                  <span class="material-symbols-rounded">fact_check</span>
                  <span>Saisir le Résultat d'Inspection sur Site</span>
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- ONGLET 3 : PLANNING MAINTENANCE PRÉVENTIVE (BONUS) -->
      @if (currentTechTab() === 'maintenance') {
        <div class="maintenance-container glass-card">
          <div class="table-title-row">
            <div>
              <h2 class="card-title">Planning des Interventions de Maintenance</h2>
              <p class="card-sub">Postes de transformation MT, isolateurs et élagage de protection réseau</p>
            </div>
            <button class="btn-primary" (click)="notifService.showToast('Planning Validé', 'Le calendrier de maintenance a été synchronisé.', 'SUCCESS')">
              <span class="material-symbols-rounded">check</span>
              <span>Valider le Planning</span>
            </button>
          </div>

          <div class="table-responsive">
            <table class="volttn-table">
              <thead>
                <tr>
                  <th>Équipement</th>
                  <th>Gouvernorat / District</th>
                  <th>Date Prévue</th>
                  <th>Description</th>
                  <th>Priorité</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (m of maintenanceTasks(); track m.id) {
                  <tr>
                    <td><strong>{{ m.equipment }}</strong> <br><small class="text-muted">{{ m.equipmentType }}</small></td>
                    <td>{{ m.governorate }} ({{ m.district }})</td>
                    <td>{{ m.plannedDate }}</td>
                    <td>{{ m.description }}</td>
                    <td>
                      <span class="glass-badge" [ngClass]="m.priority === 'HAUTE' ? 'badge-coral' : (m.priority === 'MOYENNE' ? 'badge-sun' : 'badge-nature')">
                        {{ m.priority }}
                      </span>
                    </td>
                    <td>
                      <span class="glass-badge" [ngClass]="m.status === 'VALIDE' ? 'badge-nature' : (m.status === 'EN_COURS' ? 'badge-sun' : 'badge-sky')">
                        {{ m.status }}
                      </span>
                    </td>
                    <td>
                      @if (m.status !== 'VALIDE') {
                        <button class="btn-mini-action" (click)="markMaintenanceDone(m)">Terminer</button>
                      } @else {
                        <span class="text-nature font-bold">✓ Conforme</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- DIALOGUE MODAL : CLÔTURE D'INTERVENTION PANNE -->
      @if (selectedForResolve()) {
        <div class="modal-backdrop">
          <div class="resolve-modal glass-card animate-float">
            <div class="modal-header">
              <h2 class="modal-title">Rapport de Clôture d'Intervention</h2>
              <button class="btn-close" (click)="selectedForResolve.set(null)">✕</button>
            </div>
            <div class="modal-body">
              <p class="modal-sub">
                Incident : <strong>{{ selectedForResolve()?.reference }}</strong> — {{ selectedForResolve()?.address }}
              </p>
              <div class="form-group">
                <label class="form-label">Cause constatée sur site :</label>
                <select class="form-select" [(ngModel)]="resolveRootCause">
                  <option value="FUSIBLE_MT_GRILLE">Fusible Moyenne Tension 30kV grillé</option>
                  <option value="CABLE_ARRACHE">Câble aérien arraché par vent ou engin</option>
                  <option value="SURCHAUFFE_TRANSFO">Surchauffe d'enroulement transformateur</option>
                  <option value="ISOLATEUR_DEGRADE">Isolateur céramique fendu / court-circuit</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Rapport technique de réparation :</label>
                <textarea 
                  class="form-textarea" 
                  rows="3" 
                  [(ngModel)]="resolutionNotes"
                  placeholder="Ex : Remplacement fusible MT 100A, nettoyage des bornes du transformateur et remise sous tension sans anomalie."
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="selectedForResolve.set(null)">Annuler</button>
              <button class="btn-nature" (click)="confirmResolution()">
                <span class="material-symbols-rounded">check</span>
                <span>Valider et Rétablir le Courant</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- DIALOGUE MODAL : FORMULAIRE D'INSPECTION COMPTEUR -->
      @if (selectedForInspection()) {
        <div class="modal-backdrop">
          <div class="resolve-modal glass-card animate-float">
            <div class="modal-header">
              <h2 class="modal-title">Constat d'Inspection Compteur STEG</h2>
              <button class="btn-close" (click)="selectedForInspection.set(null)">✕</button>
            </div>
            <div class="modal-body">
              <p class="modal-sub">
                Compteur : <strong>{{ selectedForInspection()?.meterId }}</strong> — {{ selectedForInspection()?.customerName }}
              </p>

              <div class="form-group">
                <label class="form-label">Index Réel Relevé au Compteur (kWh) :</label>
                <input type="number" class="form-input" [(ngModel)]="inspectionIndex" placeholder="Ex: 48920" />
              </div>

              <div class="form-group">
                <label class="form-label">Résultat de l'Inspection Physique :</label>
                <select class="form-select" [(ngModel)]="inspectionResult">
                  <option value="FRAUDE_DERIVATION">Fraude Avérée : Shunt / Dérivation clandestine</option>
                  <option value="FRAUDE_AIMANT">Fraude Avérée : Perturbation par aimant puissant</option>
                  <option value="COMPTEUR_DEFECTUEUX">Non-fraude : Bloc de mesure défectueux (à remplacer)</option>
                  <option value="CONFORME">Conforme : Aucune anomalie constatée (bâtiment inoccupé)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Observations de l'Agent Terrain :</label>
                <textarea class="form-textarea" rows="2" [(ngModel)]="inspectionNotes" placeholder="Détails du scellé et de l'installation..."></textarea>
              </div>

              <div class="photo-mock-row">
                <span class="material-symbols-rounded text-sky">photo_camera</span>
                <span>Photo du scellé et du disjoncteur attachée (Capture mobile)</span>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="selectedForInspection.set(null)">Annuler</button>
              <button class="btn-primary" (click)="confirmInspection()">
                <span class="material-symbols-rounded">verified</span>
                <span>Transmettre le Rapport à la STEG</span>
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .tech-page {
      display: flex;
      flex-direction: column;
      gap: 22px;
      padding-bottom: 50px;
    }

    .tech-header {
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
      max-width: 600px;
    }

    .status-counters {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .count-box {
      padding: 12px 16px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(255, 255, 255, 0.95);
      box-shadow: var(--shadow-sm);
      min-width: 110px;

      .c-val {
        font-family: var(--font-title);
        font-size: 24px;
        font-weight: 900;
      }
      .c-label {
        font-size: 11px;
        color: var(--text-muted);
        text-align: center;
        font-weight: 600;
      }

      &.coral .c-val { color: var(--alert-coral); }
      &.sun .c-val { color: var(--sun-amber); }
      &.sky .c-val { color: var(--sky-ocean); }
      &.nature .c-val { color: var(--nature-green); }
    }

    /* Tabs */
    .filter-bar {
      padding: 10px 16px;
      border-radius: var(--radius-lg);
    }

    .tab-filters {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(29, 53, 87, 0.1);
      background: rgba(255, 255, 255, 0.85);
      color: var(--text-muted);
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      transition: all var(--transition-fast);

      .material-symbols-rounded { font-size: 18px; }

      &:hover { color: var(--text-main); }
      &.active {
        background: var(--text-main);
        color: #FFFFFF;
        border-color: transparent;
        box-shadow: var(--shadow-sm);
      }
    }

    .sub-filter-row {
      display: flex;
      justify-content: flex-start;
    }

    .pill-group {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .pill {
      padding: 6px 14px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(29, 53, 87, 0.1);
      background: rgba(255, 255, 255, 0.9);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      color: var(--text-muted);

      &.active {
        background: var(--sun-gradient);
        color: #FFFFFF;
        border-color: transparent;
      }
      &.coral.active { background: linear-gradient(135deg, #FF6B6B 0%, #D90429 100%); }
      &.sun.active { background: var(--sun-gradient); }
      &.nature.active { background: var(--nature-gradient); }
    }

    /* Interventions Grid */
    .interventions-grid, .inspections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }

    .intervention-card, .inspection-card {
      padding: 22px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .ref-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ref-badge {
      font-size: 12px;
      font-weight: 900;
      color: var(--sun-amber);
    }

    .type-tag {
      font-size: 11px;
      font-weight: 700;
      background: rgba(29, 53, 87, 0.08);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      color: var(--text-main);
    }

    .location-group {
      display: flex;
      gap: 10px;
      align-items: flex-start;

      .loc-icon {
        color: var(--alert-coral);
        font-size: 22px;
        margin-top: 2px;
      }
    }

    .loc-address {
      font-size: 15px;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.3;
    }

    .loc-gov {
      font-size: 12px;
      color: var(--text-light);
    }

    .details-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: rgba(255, 251, 242, 0.7);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
      .d-label { color: var(--text-muted); }
      .d-val {
        color: var(--text-main);
        &.highlight { color: var(--sun-amber); font-weight: 700; }
      }
    }

    .notes-box {
      font-size: 12px;
      color: var(--text-muted);
      border-left: 3px solid var(--sun-gold);
      padding-left: 10px;
      line-height: 1.4;
      .notes-caption { font-weight: 700; color: var(--text-main); display: block; margin-bottom: 2px; }
    }

    .action-footer {
      margin-top: auto;
      padding-top: 8px;
    }

    .status-action-row {
      display: flex;
      gap: 8px;
    }

    .btn-full { width: 100%; }
    .btn-half { flex: 1; }
    .btn-icon-only { width: 44px; padding: 0; display: flex; align-items: center; justify-content: center; }

    .resolved-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      background: var(--nature-light);
      color: var(--nature-green);
      font-weight: 800;
      font-size: 13px;
      .check-icon { font-size: 20px; }
    }

    /* Inspections */
    .section-notice {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 20px;
      border-radius: var(--radius-lg);
      margin-bottom: 20px;
      background: rgba(255, 255, 255, 0.95);
      border: 1.5px solid var(--alert-coral);
      p { font-size: 13.5px; color: var(--text-main); line-height: 1.4; }
      .material-symbols-rounded { font-size: 32px; flex-shrink: 0; }
    }

    .client-name { font-size: 15px; font-weight: 800; color: var(--text-main); margin-top: 2px; }
    .client-addr { font-size: 12px; color: var(--text-muted); }

    .score-pill {
      font-size: 11.5px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      &.coral { background: var(--alert-coral-light); color: var(--alert-coral); }
    }

    .anomaly-box {
      font-size: 12.5px;
      background: rgba(255, 240, 240, 0.6);
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      .lbl { color: var(--text-muted); margin-right: 6px; }
    }

    .shap-mini-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .mini-factor-tag {
      font-size: 10.5px;
      font-weight: 700;
      background: rgba(29, 53, 87, 0.06);
      color: var(--text-muted);
      padding: 3px 8px;
      border-radius: var(--radius-full);
    }

    /* Maintenance Table */
    .maintenance-container {
      padding: 24px;
      border-radius: var(--radius-xl);
    }

    .table-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .btn-mini-action {
      padding: 4px 12px;
      border-radius: var(--radius-full);
      border: 1px solid var(--sun-gold);
      background: rgba(255, 183, 3, 0.1);
      color: #A35C00;
      font-size: 11.5px;
      font-weight: 800;
      cursor: pointer;
      &:hover { background: var(--sun-gold); color: #FFFFFF; }
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(29, 53, 87, 0.45);
      backdrop-filter: blur(6px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .resolve-modal {
      width: 100%;
      max-width: 520px;
      background: rgba(255, 255, 255, 0.98);
      border-radius: var(--radius-xl);
      padding: 26px;
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title { font-size: 18px; font-weight: 900; color: var(--text-main); }
    .modal-sub { font-size: 13px; color: var(--text-muted); }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label { font-size: 12.5px; font-weight: 700; color: var(--text-main); }

    .form-input, .form-select, .form-textarea {
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1.5px solid rgba(29, 53, 87, 0.12);
      font-size: 13px;
      color: var(--text-main);
      outline: none;
      font-family: inherit;
      &:focus { border-color: var(--sun-gold); }
    }

    .photo-mock-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      background: rgba(76, 201, 240, 0.1);
      padding: 8px 12px;
      border-radius: var(--radius-sm);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 14px;
      border-top: 1px solid rgba(29, 53, 87, 0.08);
    }

    @media (max-width: 768px) {
      .tech-header { flex-direction: column; align-items: flex-start; }
      .status-counters { width: 100%; }
      .count-box { flex: 1; min-width: 70px; }
    }
  `]
})
export class TechnicienInterventionsComponent {
  outageService = inject(OutageService);
  authService = inject(AuthService);
  notifService = inject(NotificationService);
  fraudService = inject(FraudService);

  currentTechTab = signal<'interventions' | 'inspections' | 'maintenance'>('interventions');
  activeSubTab = signal<string>('ALL');

  // Modal Panne
  selectedForResolve = signal<OutageReport | null>(null);
  resolveRootCause = 'FUSIBLE_MT_GRILLE';
  resolutionNotes = 'Remplacement du fusible MT 30kV et vérification des isolements. Rétablissement complet du courant.';

  // Modal Inspection
  selectedForInspection = signal<FraudAlert | null>(null);
  inspectionIndex = 48920;
  inspectionResult = 'FRAUDE_DERIVATION';
  inspectionNotes = 'Constatation sur place : câble de shuntage relié en amont du disjoncteur différentiel.';

  // Maintenance préventive (bonus)
  maintenanceTasks = signal<MaintenanceTask[]>([
    { id: 'mnt-01', equipment: 'Poste MT/BT Belvédère', equipmentType: 'Transformateur 630 kVA', governorate: 'Tunis', district: 'Belvédère', plannedDate: 'Aujourd\'hui 14:00', priority: 'HAUTE', status: 'EN_COURS', description: 'Contrôle niveau d\'huile diélectrique et resserrage des bornes MT.' },
    { id: 'mnt-02', equipment: 'Départ Aérien 30kV Ennasr', equipmentType: 'Ligne Moyenne Tension', governorate: 'Ariana', district: 'Ennasr 2', plannedDate: 'Demain 09:00', priority: 'MOYENNE', status: 'PLANIFIE', description: 'Élagage préventif des eucalyptus à proximité de la portée 12-14.' },
    { id: 'mnt-03', equipment: 'Sous-Station Mégrine Riadh', equipmentType: 'Disjoncteur SF6', governorate: 'Ben Arous', district: 'Mégrine', plannedDate: '24 Oct 2025', priority: 'MOYENNE', status: 'PLANIFIE', description: 'Vérification de la pression de gaz SF6 et contacts auxiliaires.' }
  ]);

  myInterventions(): OutageReport[] {
    return this.outageService.outages();
  }

  filteredInterventions(): OutageReport[] {
    const tab = this.activeSubTab();
    const list = this.myInterventions();
    if (tab === 'ALL') return list;
    return list.filter(item => item.status === tab);
  }

  pendingInspections(): FraudAlert[] {
    return this.fraudService.alerts().filter(a => a.status === 'EN_INSPECTION' || a.severity === 'CRITIQUE').slice(0, 8);
  }

  countPending(): number {
    return this.myInterventions().filter(i => i.status === 'SIGNALE').length;
  }

  countInProgress(): number {
    return this.myInterventions().filter(i => i.status === 'EN_COURS').length;
  }

  countResolved(): number {
    return this.myInterventions().filter(i => i.status === 'RESOLU').length;
  }

  updateStatus(item: OutageReport, newStatus: OutageStatus): void {
    this.outageService.updateOutageStatus(item.id, newStatus, 'Technicien sur site avec véhicule d\'intervention rapide STEG.');
    this.notifService.showToast('Ordre de mission démarré', `Prise en charge de ${item.reference} confirmée. En route.`, 'INFO');
  }

  showItinerary(item: OutageReport): void {
    this.notifService.showToast(
      'Itinéraire Calculé',
      `Distance: 4.2 km (~8 min) vers ${item.address}. Coordonnées GPS synchronisées.`,
      'INFO'
    );
  }

  openResolveDialog(item: OutageReport): void {
    this.selectedForResolve.set(item);
  }

  confirmResolution(): void {
    const item = this.selectedForResolve();
    if (!item) return;

    this.outageService.updateOutageStatus(item.id, 'RESOLU', `${this.resolutionNotes} [Cause: ${this.resolveRootCause}]`);
    this.notifService.showToast(
      'Panne Résolue avec Succès !',
      `Le courant a été rétabli pour ${item.affectedCustomers} abonnés à ${item.address}. Notifications diffusées.`,
      'SUCCESS'
    );
    this.selectedForResolve.set(null);
  }

  openInspectionForm(alert: FraudAlert): void {
    this.selectedForInspection.set(alert);
  }

  confirmInspection(): void {
    const alert = this.selectedForInspection();
    if (!alert) return;

    if (this.inspectionResult.startsWith('FRAUDE')) {
      this.fraudService.validateFraud(alert.id);
      this.notifService.showToast('Fraude Confirmée', `Rapport transmis avec constatation physique pour le compteur ${alert.meterId}.`, 'WARNING');
    } else {
      this.fraudService.rejectFraud(alert.id);
      this.notifService.showToast('Compteur Validé', `Inspection terminée sans anomalie pour le compteur ${alert.meterId}.`, 'SUCCESS');
    }

    this.selectedForInspection.set(null);
  }

  markMaintenanceDone(task: MaintenanceTask): void {
    task.status = 'VALIDE';
    this.notifService.showToast('Maintenance Terminée', `${task.equipment} vérifié et conforme aux normes STEG.`, 'SUCCESS');
  }

  formatType(type: string): string {
    switch (type) {
      case 'PANNE_TRANSFORMATEUR': return 'Transformateur';
      case 'LIGNE_COUPEE': return 'Câble / Ligne';
      case 'SURCHARGE_RESEAU': return 'Surcharge Réseau';
      case 'MAINTENANCE_PREVENTIVE': return 'Maintenance';
      case 'INTEMPERIES': return 'Intempéries / Sirocco';
      default: return 'Incident Technique';
    }
  }

  getSeverityColor(sev: string): string {
    switch (sev) {
      case 'MAJEURE': return 'coral';
      case 'MOYENNE': return 'sun';
      default: return 'nature';
    }
  }
}
