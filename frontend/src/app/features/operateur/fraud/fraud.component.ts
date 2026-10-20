import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FraudService } from '../../../core/services/fraud.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FraudAlert, FraudSeverity, FraudStatus } from '../../../models/fraud.model';

@Component({
  selector: 'app-fraud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fraud-page">
      
      <!-- En-tête Détection d'Anomalies & IA SHAP -->
      <div class="fraud-header glass-card">
        <div class="header-content">
          <div class="badge-row">
            <span class="glass-badge badge-coral">
              <span class="material-symbols-rounded">policy</span>
              Module Anti-Fraude & Pertes Non Techniques
            </span>
            <span class="glass-badge badge-sky">Explicabilité SHAP (XAI)</span>
          </div>
          <h1 class="header-title">Détection Intelligente des Fraudes & Dérivations</h1>
          <p class="header-desc">
            Algorithme d'arbres de décision couplé aux valeurs de Shapley pour expliquer mathématiquement chaque suspicion de sous-comptage sur le réseau STEG.
          </p>
        </div>
        <div class="stats-pills-row">
          <div class="pill-stat">
            <span class="lbl">Alertes Critiques :</span>
            <strong class="val text-coral">{{ fraudService.stats().critical }}</strong>
          </div>
          <div class="pill-stat">
            <span class="lbl">Pertes Estimées :</span>
            <strong class="val text-sun">{{ fraudService.stats().totalLossTnd | number }} DT</strong>
          </div>
        </div>
      </div>

      <!-- Filtres de recherche -->
      <div class="filters-card glass-card">
        <div class="filter-controls">
          
          <div class="search-box">
            <span class="material-symbols-rounded">search</span>
            <input 
              type="text" 
              placeholder="Rechercher par compteur (MTR-...), abonné ou gouvernorat..." 
              [(ngModel)]="searchQuery" 
            />
          </div>

          <div class="dropdowns-group">
            <select class="form-select" [(ngModel)]="severityFilter">
              <option value="ALL">Toutes les Gravités</option>
              <option value="CRITIQUE">Critique (&gt; 80%)</option>
              <option value="MOYENNE">Moyenne (65-80%)</option>
              <option value="FAIBLE">Faible (&lt; 65%)</option>
            </select>

            <select class="form-select" [(ngModel)]="statusFilter">
              <option value="ALL">Tous les Statuts</option>
              <option value="NOUVEAU">Nouveau</option>
              <option value="EN_INSPECTION">En Inspection</option>
              <option value="VALIDE">Fraude Validée</option>
              <option value="REJETE">Rejeté (Fausse Alerte)</option>
            </select>
          </div>

        </div>
      </div>

      <!-- Disposition : Tableau des 50 Fraudes + Volet d'Explicabilité SHAP -->
      <div class="fraud-layout">
        
        <!-- Tableau des alertes -->
        <div class="table-column glass-card">
          <div class="table-responsive">
            <table class="volttn-table">
              <thead>
                <tr>
                  <th>Score SHAP</th>
                  <th>Compteur</th>
                  <th>Gouvernorat</th>
                  <th>Chute kWh</th>
                  <th>Perte Estimée</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (alert of filteredAlerts(); track alert.id) {
                  <tr 
                    [class.selected]="selectedAlert()?.id === alert.id"
                    (click)="selectAlert(alert)"
                  >
                    <td>
                      <div class="score-badge" [ngClass]="getScoreClass(alert.suspicionScore)">
                        {{ alert.suspicionScore }}%
                      </div>
                    </td>
                    <td>
                      <strong>{{ alert.meterId }}</strong>
                      <div class="sub-cell">{{ alert.customerName }}</div>
                    </td>
                    <td>{{ alert.governorate }}</td>
                    <td>
                      <span class="drop-text text-coral">-{{ alert.kwhDropPercentage }}%</span>
                    </td>
                    <td><strong>{{ alert.estimatedLossTnd }} DT</strong></td>
                    <td>
                      <span class="glass-badge" [ngClass]="getStatusBadge(alert.status)">
                        {{ alert.status }}
                      </span>
                    </td>
                    <td>
                      <button class="btn-inspect" (click)="selectAlert(alert); $event.stopPropagation()">
                        Analyser SHAP
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Volet d'Explication SHAP (Facteurs contributifs) -->
        <div class="shap-drawer glass-card">
          @if (selectedAlert(); as item) {
            <div class="shap-content animate-float">
              
              <div class="shap-header">
                <div class="badge-row">
                  <span class="glass-badge badge-coral">Score {{ item.suspicionScore }}%</span>
                  <span class="glass-badge badge-sun">{{ item.severity }}</span>
                </div>
                <h2 class="shap-title">{{ item.meterId }}</h2>
                <span class="shap-sub">{{ item.address }}, <strong>{{ item.governorate }}</strong></span>
              </div>

              <div class="anomaly-summary glass-panel">
                <span class="a-lbl">Type d'Anomalie Modélisée :</span>
                <strong class="a-val">{{ item.anomalyType }}</strong>
                <div class="a-loss">Perte financière prévisionnelle : <strong>{{ item.estimatedLossTnd }} DT</strong></div>
              </div>

              <!-- Barres horizontales d'explication SHAP -->
              <div class="shap-bars-section">
                <h3 class="bars-title">Décomposition des Facteurs SHAP</h3>
                <p class="bars-sub">Contribution de chaque variable à la décision de l'algorithme :</p>

                <div class="factors-list">
                  @for (factor of item.shapFactors; track factor.name) {
                    <div class="factor-row">
                      <div class="factor-header">
                        <span class="f-name">{{ factor.nameFr }}</span>
                        <span class="f-score">+{{ (factor.impactScore * 100) | number:'1.0-0' }} pts</span>
                      </div>
                      <div class="shap-bar-track">
                        <div 
                          class="shap-bar-fill" 
                          [style.width.%]="factor.impactScore * 130"
                        ></div>
                      </div>
                      <div class="f-desc">
                        <span>Observé : <strong>{{ factor.observedValue }}</strong> (Réf: {{ factor.referenceValue }})</span>
                      </div>
                    </div>
                  }
                </div>
              </div>

              @if (item.inspectorNotes) {
                <div class="inspector-notes-box">
                  <span class="n-caption">Note de mission :</span>
                  <p class="n-text">{{ item.inspectorNotes }}</p>
                </div>
              }

              <!-- Boutons d'Action Opérateur -->
              <div class="shap-actions">
                <button class="btn-primary" (click)="validateFraud(item.id)">
                  <span class="material-symbols-rounded">gavel</span>
                  <span>Confirmer la Fraude</span>
                </button>
                <button class="btn-sky" (click)="requestInspection(item.id)">
                  <span class="material-symbols-rounded">build</span>
                  <span>Dépêcher Contrôleur</span>
                </button>
                <button class="btn-secondary" (click)="rejectFraud(item.id)">
                  <span class="material-symbols-rounded">close</span>
                  <span>Fausse Alerte</span>
                </button>
              </div>

            </div>
          } @else {
            <div class="empty-selection">
              <span class="material-symbols-rounded empty-icon">pie_chart</span>
              <h3>Sélectionnez une Alerte</h3>
              <p>Cliquez sur un compteur dans le tableau pour visualiser l'explication factorielle SHAP.</p>
            </div>
          }
        </div>

      </div>

    </div>
  `,
  styles: [`
    .fraud-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 50px;
    }

    .fraud-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 26px 30px;
      border-radius: var(--radius-xl);
      gap: 20px;
      flex-wrap: wrap;
    }

    .badge-row {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
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

    .stats-pills-row {
      display: flex;
      gap: 12px;
    }

    .pill-stat {
      padding: 10px 16px;
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.9);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;

      .lbl { font-size: 11px; color: var(--text-muted); font-weight: 700; }
      .val { font-size: 18px; font-weight: 900; }
    }

    .filters-card {
      padding: 16px 20px;
      border-radius: var(--radius-lg);
    }

    .filter-controls {
      display: flex;
      justify-content: space-between;
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
      input {
        border: none;
        outline: none;
        background: transparent;
        font-size: 13.5px;
        width: 100%;
      }
    }

    .dropdowns-group {
      display: flex;
      gap: 10px;
      .form-select { width: 180px; }
    }

    /* Layout */
    .fraud-layout {
      display: grid;
      grid-template-columns: 1fr 420px;
      gap: 24px;
    }

    .table-column {
      padding: 20px;
      border-radius: var(--radius-xl);
      max-height: 720px;
      overflow-y: auto;
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

      tr {
        cursor: pointer;
        transition: background var(--transition-fast);
        &:hover td { background: rgba(255, 255, 255, 0.6); }
        &.selected td { background: rgba(255, 183, 3, 0.12); }
      }
    }

    .score-badge {
      display: inline-flex;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-weight: 900;
      font-size: 12px;

      &.score-critical { background: var(--alert-coral-light); color: var(--alert-coral); }
      &.score-medium { background: var(--sun-light); color: #B36800; }
      &.score-low { background: var(--nature-light); color: var(--nature-green); }
    }

    .sub-cell {
      font-size: 11px;
      color: var(--text-light);
    }

    .drop-text { font-weight: 800; }

    .btn-inspect {
      padding: 5px 12px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid var(--sky-blue);
      color: var(--sky-deep);
      font-weight: 700;
      font-size: 11.5px;
      cursor: pointer;
      &:hover { background: var(--sky-blue); color: #FFFFFF; }
    }

    /* SHAP Drawer */
    .shap-drawer {
      padding: 24px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
    }

    .shap-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .shap-title {
      font-size: 20px;
      font-weight: 900;
      color: var(--text-main);
    }

    .shap-sub {
      font-size: 12.5px;
      color: var(--text-light);
    }

    .anomaly-summary {
      padding: 14px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .a-lbl { font-size: 11px; color: var(--text-muted); font-weight: 700; }
    .a-val { font-size: 13.5px; color: var(--text-main); }
    .a-loss { font-size: 12.5px; color: var(--sun-amber); margin-top: 4px; }

    .shap-bars-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .bars-title {
      font-size: 15px;
      font-weight: 800;
      color: var(--text-main);
    }

    .bars-sub {
      font-size: 12px;
      color: var(--text-light);
    }

    .factors-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .factor-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .factor-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-main);
      .f-score { color: var(--alert-coral); font-weight: 800; }
    }

    .shap-bar-track {
      width: 100%;
      height: 8px;
      background: rgba(29, 53, 87, 0.08);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .shap-bar-fill {
      height: 100%;
      background: linear-gradient(to right, var(--sun-gold), var(--alert-coral));
      border-radius: var(--radius-full);
    }

    .f-desc {
      font-size: 11px;
      color: var(--text-muted);
    }

    .inspector-notes-box {
      font-size: 12px;
      background: rgba(255, 251, 242, 0.85);
      border-left: 3px solid var(--sun-amber);
      padding: 8px 12px;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      .n-caption { font-weight: 800; color: #A35C00; }
      .n-text { color: var(--text-muted); }
    }

    .shap-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
      button { width: 100%; font-size: 13px; padding: 10px; }
    }

    .empty-selection {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      height: 360px;
      color: var(--text-muted);

      .empty-icon { font-size: 56px; color: var(--sun-gold); margin-bottom: 12px; }
      h3 { font-size: 18px; color: var(--text-main); margin-bottom: 4px; }
      p { font-size: 13px; max-width: 280px; }
    }

    @media (max-width: 992px) {
      .fraud-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class FraudComponent {
  fraudService = inject(FraudService);
  notifService = inject(NotificationService);

  searchQuery = '';
  severityFilter = 'ALL';
  statusFilter = 'ALL';

  selectedAlert = signal<FraudAlert | null>(this.fraudService.alerts()[0]);

  selectAlert(alert: FraudAlert): void {
    this.selectedAlert.set(alert);
  }

  filteredAlerts(): FraudAlert[] {
    const q = this.searchQuery.trim().toLowerCase();
    const sev = this.severityFilter;
    const st = this.statusFilter;

    return this.fraudService.alerts().filter(a => {
      const matchQ = !q || a.meterId.toLowerCase().includes(q) || a.governorate.toLowerCase().includes(q) || a.customerName.toLowerCase().includes(q);
      const matchSev = sev === 'ALL' || a.severity === sev;
      const matchSt = st === 'ALL' || a.status === st;
      return matchQ && matchSev && matchSt;
    });
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-critical';
    if (score >= 65) return 'score-medium';
    return 'score-low';
  }

  getStatusBadge(status: FraudStatus): string {
    switch (status) {
      case 'VALIDE': return 'badge-coral';
      case 'EN_INSPECTION': return 'badge-sun';
      case 'REJETE': return 'badge-nature';
      default: return 'badge-sky';
    }
  }

  validateFraud(id: string): void {
    this.fraudService.validateFraud(id);
    this.notifService.showToast('Fraude Validée', 'Dossier transmis au contentieux régional.', 'ALERT');
  }

  rejectFraud(id: string): void {
    this.fraudService.rejectFraud(id);
    this.notifService.showToast('Fausse Alerte Classée', 'Le compteur a été rétabli au statut nominal.', 'SUCCESS');
  }

  requestInspection(id: string): void {
    this.fraudService.requestInspection(id);
    this.notifService.showToast('Inspection Demandée', 'Ordre de mission envoyé à l\'équipe régionale.', 'INFO');
  }
}
