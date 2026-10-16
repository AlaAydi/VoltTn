import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ElectricityService } from '../../../core/services/electricity.service';
import { OutageService } from '../../../core/services/outage.service';
import { FraudService } from '../../../core/services/fraud.service';
import { TunisiaMap3dComponent } from '../../../shared/components/tunisia-map-3d/tunisia-map-3d.component';
import { Tilt3dDirective } from '../../../shared/directives/tilt-3d.directive';
import { Governorate } from '../../../models/governorate.model';

@Component({
  selector: 'app-operateur-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TunisiaMap3dComponent, Tilt3dDirective],
  template: `
    <div class="operator-dashboard">
      
      <!-- En-tête Salle de Contrôle Nationale -->
      <div class="control-header glass-card">
        <div class="header-left">
          <div class="badge-row">
            <span class="glass-badge badge-sky">
              <span class="material-symbols-rounded">dns</span>
              Dispatching National STEG
            </span>
            <span class="glass-badge badge-nature">Fréquence Réseau : 50.02 Hz</span>
          </div>
          <h1 class="header-title">Supervision Intelligente du Réseau Tunisien</h1>
          <p class="header-desc">
            Surveillance en temps réel des 24 gouvernorats, modèle prédictif LightGBM v2.4 et dispatching automatisé.
          </p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="refreshMetrics()">
            <span class="material-symbols-rounded">refresh</span>
            <span>Actualiser SCADA</span>
          </button>
          <a routerLink="/operateur/stats" class="btn-secondary">
            <span class="material-symbols-rounded">file_download</span>
            <span>Export Rapport</span>
          </a>
        </div>
      </div>

      <!-- 4 Cartes Clés Réseau avec 3D Tilt -->
      <div class="metrics-grid">
        
        <div class="metric-card glass-card" appTilt3d [maxTilt]="8">
          <div class="card-icon sun">
            <span class="material-symbols-rounded">bolt</span>
          </div>
          <div class="metric-info">
            <span class="m-label">Charge Nationale Totale</span>
            <div class="m-val-row">
              <span class="m-val">{{ eleService.totalCurrentLoadMw() | number }}</span>
              <span class="m-unit">MW</span>
            </div>
            <div class="progress-bar-bg">
              <div 
                class="progress-bar-fill sun" 
                [style.width.%]="(eleService.totalCurrentLoadMw() / eleService.totalCapacityMw()) * 100"
              ></div>
            </div>
            <span class="m-sub">Capacité : {{ eleService.totalCapacityMw() | number }} MW (Marge {{ eleService.reserveMarginPct() }}%)</span>
          </div>
        </div>

        <div class="metric-card glass-card" appTilt3d [maxTilt]="8">
          <div class="card-icon nature">
            <span class="material-symbols-rounded">solar_power</span>
          </div>
          <div class="metric-info">
            <span class="m-label">Injection Solaire & Éolienne</span>
            <div class="m-val-row">
              <span class="m-val">{{ eleService.nationalSolarMw() | number }}</span>
              <span class="m-unit">MW</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill nature" [style.width.%]="eleService.solarSharePct()"></div>
            </div>
            <span class="m-sub text-nature font-bold">
              Part du mix : {{ eleService.solarSharePct() }}% (+2.4% vs 2024)
            </span>
          </div>
        </div>

        <div class="metric-card glass-card" appTilt3d [maxTilt]="8">
          <div class="card-icon coral">
            <span class="material-symbols-rounded">power_off</span>
          </div>
          <div class="metric-info">
            <span class="m-label">Incidents & Coupures Actives</span>
            <div class="m-val-row">
              <span class="m-val text-coral">{{ outageService.stats().active }}</span>
              <span class="m-unit">en cours</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill coral" [style.width.%]="(outageService.stats().active / 30) * 100"></div>
            </div>
            <span class="m-sub">
              {{ outageService.stats().inProgress }} équipes sur site • {{ outageService.stats().totalAffected | number }} abonnés
            </span>
          </div>
        </div>

        <div class="metric-card glass-card" appTilt3d [maxTilt]="8">
          <div class="card-icon sky">
            <span class="material-symbols-rounded">crisis_alert</span>
          </div>
          <div class="metric-info">
            <span class="m-label">Suspicion de Fraude SHAP</span>
            <div class="m-val-row">
              <span class="m-val">{{ fraudService.stats().newAlerts }}</span>
              <span class="m-unit">urgentes</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill sky" [style.width.%]="(fraudService.stats().critical / fraudService.stats().total) * 100"></div>
            </div>
            <span class="m-sub">
              {{ fraudService.stats().critical }} cas critiques (Score SHAP &gt; 85%)
            </span>
          </div>
        </div>

      </div>

      <!-- Scène 3D Centrale : Carte de la Tunisie en 3D Extrudée -->
      <div class="map-section glass-card">
        <div class="section-title-row">
          <div>
            <h2 class="card-title">Carte Interactive 3D de la Tunisie</h2>
            <p class="card-sub">
              Extrusion 3D par gouvernorat selon la charge électrique. Cliquez sur une région pour inspecter ses postes.
            </p>
          </div>
          <div class="selected-gov-banner" *ngIf="selectedGovernorate()">
            <span class="pin-icon material-symbols-rounded">location_on</span>
            <span class="gov-selected-name">{{ selectedGovernorate()?.name }} ({{ selectedGovernorate()?.nameAr }})</span>
            <span class="gov-selected-load">{{ selectedGovernorate()?.currentLoadMw }} MW / {{ selectedGovernorate()?.capacityMw }} MW</span>
            <button class="btn-clear" (click)="selectedGovernorate.set(null)">✕</button>
          </div>
        </div>

        <!-- Composant Three.js Carte 3D -->
        <app-tunisia-map-3d 
          [governorates]="eleService.governorates()"
          (governorateSelected)="onGovernorateSelected($event)"
        ></app-tunisia-map-3d>
      </div>

      <!-- Bloc IA : Prévision de charge & Simulation de Scénarios en direct -->
      <div class="ai-forecast-grid">
        
        <!-- Courbe de charge J+1 / J+7 -->
        <div class="glass-card forecast-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Prévision de Charge par IA (Modèle LightGBM)</h2>
              <span class="card-sub">Courbe réel vs prédit avec intervalle de confiance 95%</span>
            </div>
            <div class="metrics-pills">
              <span class="metric-pill">MAE : <strong>{{ forecastData().metrics.mae }} MW</strong></span>
              <span class="metric-pill">RMSE : <strong>{{ forecastData().metrics.rmse }} MW</strong></span>
              <span class="metric-pill">MAPE : <strong>{{ forecastData().metrics.mape }}%</strong></span>
            </div>
          </div>

          <!-- Rendu visuel de la courbe de charge -->
          <div class="forecast-chart-container">
            <div class="chart-bars">
              @for (hour of forecastData().labels; track hour; let idx = $index) {
                <div class="f-col">
                  <div class="f-track">
                    <!-- Intervalle de confiance (bande translucide) -->
                    <div 
                      class="confidence-band" 
                      [style.bottom.%]="(forecastData().lowerConfidence[idx] / 5200) * 100"
                      [style.height.%]="((forecastData().upperConfidence[idx] - forecastData().lowerConfidence[idx]) / 5200) * 100"
                    ></div>
                    <!-- Charge réelle -->
                    <div 
                      class="actual-bar" 
                      [style.height.%]="(forecastData().actual[idx] / 5200) * 100"
                    ></div>
                    <!-- Prédiction IA (ligne repère dorée) -->
                    <div 
                      class="prediction-marker" 
                      [style.bottom.%]="(forecastData().predicted[idx] / 5200) * 100"
                    ></div>
                  </div>
                  <span class="f-label">{{ hour }}</span>
                </div>
              }
            </div>
          </div>

          <div class="chart-legend-row">
            <div class="legend-item"><span class="bullet sky"></span> Charge Réelle (SCADA)</div>
            <div class="legend-item"><span class="bullet sun"></span> Prédiction IA (LightGBM)</div>
            <div class="legend-item"><span class="bullet band"></span> Intervalle de Confiance 95%</div>
          </div>
        </div>

        <!-- Simulateur de Scénarios Interactif (Effet canicule, jour férié) -->
        <div class="glass-card scenario-card" appTilt3d [maxTilt]="6">
          <div class="scenario-header">
            <div class="scenario-icon-box">
              <span class="material-symbols-rounded">psychology</span>
            </div>
            <div>
              <h3 class="scenario-title">Simulation de Scénarios en Direct</h3>
              <p class="scenario-sub">Modifiez les facteurs pour tester la résilience du réseau</p>
            </div>
          </div>

          <div class="sliders-list">
            
            <div class="slider-group">
              <div class="slider-label-row">
                <span>Vague de Chaleur / Canicule :</span>
                <span class="slider-val" [class.danger]="tempDelta() > 3">+{{ tempDelta() }} °C</span>
              </div>
              <input 
                type="range" 
                class="range-slider" 
                min="0" 
                max="8" 
                step="1" 
                [ngModel]="tempDelta()" 
                (ngModelChange)="onTempDeltaChange($event)"
              />
              <span class="slider-hint">Impact climatisation estimé : +{{ tempDelta() * 85 }} MW</span>
            </div>

            <div class="slider-group">
              <div class="slider-label-row">
                <span>Activité Industrielle :</span>
                <span class="slider-val">{{ industrialActivity() }}%</span>
              </div>
              <input 
                type="range" 
                class="range-slider" 
                min="60" 
                max="120" 
                step="5" 
                [ngModel]="industrialActivity()" 
                (ngModelChange)="onIndustrialChange($event)"
              />
            </div>

            <div class="slider-group checkbox-group">
              <label class="custom-checkbox">
                <input 
                  type="checkbox" 
                  [checked]="isHoliday()" 
                  (change)="onHolidayToggle($event)"
                />
                <span class="checkmark"></span>
                <span class="checkbox-text">Scénario Jour Férié / Week-end (-350 MW)</span>
              </label>
            </div>

          </div>

          <div class="scenario-result-box">
            <div class="res-title">Impact Global Calculé :</div>
            <div class="res-diff">
              Nouvelle charge estimée : <strong>{{ eleService.totalCurrentLoadMw() | number }} MW</strong>
            </div>
            <button class="btn-secondary btn-full" (click)="resetScenario()">
              <span class="material-symbols-rounded">restart_alt</span>
              <span>Réinitialiser Scénario</span>
            </button>
          </div>

        </div>

      </div>

      <!-- Tableau des 24 Gouvernorats avec Tri et Statut -->
      <div class="glass-card table-card">
        <div class="table-header-row">
          <div>
            <h2 class="card-title">État Détaillé des 24 Gouvernorats</h2>
            <p class="card-sub">Capacités maximales, charges en temps réel et températures mesurées</p>
          </div>
          <div class="filter-pills">
            <button 
              class="filter-pill" 
              [class.active]="statusFilter() === 'ALL'" 
              (click)="statusFilter.set('ALL')"
            >
              Tous (24)
            </button>
            <button 
              class="filter-pill coral" 
              [class.active]="statusFilter() === 'SURCHARGE'" 
              (click)="statusFilter.set('SURCHARGE')"
            >
              Surcharge
            </button>
            <button 
              class="filter-pill sun" 
              [class.active]="statusFilter() === 'ELEVEE'" 
              (click)="statusFilter.set('ELEVEE')"
            >
              Élevée
            </button>
            <button 
              class="filter-pill nature" 
              [class.active]="statusFilter() === 'NORMAL'" 
              (click)="statusFilter.set('NORMAL')"
            >
              Nominal
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="volttn-table">
            <thead>
              <tr>
                <th>Gouvernorat</th>
                <th>Nom Arabe</th>
                <th>Capacité Max</th>
                <th>Charge Actuelle</th>
                <th>Taux d'Usage</th>
                <th>Température</th>
                <th>Statut Réseau</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              @for (gov of filteredGovernorates(); track gov.id) {
                <tr [class.highlighted]="selectedGovernorate()?.id === gov.id">
                  <td>
                    <div class="gov-name-cell">
                      <span class="material-symbols-rounded gov-icon">pin_drop</span>
                      <strong>{{ gov.name }}</strong>
                    </div>
                  </td>
                  <td class="text-ar">{{ gov.nameAr }}</td>
                  <td>{{ gov.capacityMw }} MW</td>
                  <td><strong>{{ gov.currentLoadMw }} MW</strong></td>
                  <td>
                    <div class="usage-bar-wrapper">
                      <div class="progress-bar-bg mini">
                        <div 
                          class="progress-bar-fill" 
                          [ngClass]="getUsageClass(gov)"
                          [style.width.%]="(gov.currentLoadMw / gov.capacityMw) * 100"
                        ></div>
                      </div>
                      <span class="usage-text">{{ Math.round((gov.currentLoadMw / gov.capacityMw) * 100) }}%</span>
                    </div>
                  </td>
                  <td>{{ gov.temperatureC }} °C</td>
                  <td>
                    <span class="glass-badge" [ngClass]="'badge-' + getBadgeColor(gov.status)">
                      {{ gov.status }}
                    </span>
                  </td>
                  <td>
                    <button class="btn-inspect" (click)="selectedGovernorate.set(gov)">
                      Inspecter 3D
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .operator-dashboard {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 40px;
    }

    .control-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 30px;
      border-radius: var(--radius-xl);
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
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 18px;
    }

    .metric-card {
      padding: 20px;
      display: flex;
      gap: 16px;
      align-items: center;
      border-radius: var(--radius-lg);
    }

    .card-icon {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      flex-shrink: 0;

      &.sun { background: var(--sun-gradient); box-shadow: 0 4px 14px rgba(251, 133, 0, 0.35); }
      &.nature { background: var(--nature-gradient); box-shadow: 0 4px 14px rgba(82, 183, 136, 0.35); }
      &.coral { background: linear-gradient(135deg, #FF6B6B 0%, #D90429 100%); box-shadow: 0 4px 14px rgba(255, 107, 107, 0.35); }
      &.sky { background: var(--sky-gradient); box-shadow: 0 4px 14px rgba(76, 201, 240, 0.35); }
    }

    .metric-info {
      flex: 1;
    }

    .m-label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 700;
    }

    .m-val-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin: 2px 0 6px 0;
    }

    .m-val {
      font-family: var(--font-title);
      font-size: 26px;
      font-weight: 900;
      color: var(--text-main);
      &.text-coral { color: var(--alert-coral); }
    }

    .m-unit {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-light);
    }

    .progress-bar-bg {
      width: 100%;
      height: 6px;
      background: rgba(29, 53, 87, 0.08);
      border-radius: var(--radius-full);
      overflow: hidden;
      margin-bottom: 6px;

      &.mini { height: 8px; width: 80px; }
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: var(--radius-full);
      &.sun { background: var(--sun-gradient); }
      &.nature { background: var(--nature-gradient); }
      &.coral { background: var(--alert-coral); }
      &.sky { background: var(--sky-gradient); }
    }

    .m-sub {
      font-size: 11px;
      color: var(--text-light);
      display: block;
    }

    /* Map Section */
    .map-section {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .selected-gov-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: var(--sun-light);
      border: 1px solid rgba(251, 133, 0, 0.4);
      border-radius: var(--radius-full);
      color: #A35C00;
      font-weight: 700;
      font-size: 13px;
    }

    .btn-clear {
      background: none;
      border: none;
      cursor: pointer;
      font-weight: 800;
      color: #A35C00;
    }

    /* AI Forecast Grid */
    .ai-forecast-grid {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 24px;
    }

    .forecast-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }

    .card-title {
      font-size: 19px;
      font-weight: 800;
      color: var(--text-main);
    }

    .card-sub {
      font-size: 13px;
      color: var(--text-light);
    }

    .metrics-pills {
      display: flex;
      gap: 8px;
    }

    .metric-pill {
      font-size: 11.5px;
      padding: 4px 10px;
      background: rgba(255, 255, 255, 0.85);
      border: 1px solid rgba(29, 53, 87, 0.1);
      border-radius: var(--radius-full);
      color: var(--text-muted);
      strong { color: var(--sun-amber); }
    }

    .forecast-chart-container {
      height: 220px;
      margin: 12px 0;
    }

    .chart-bars {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 10px;
    }

    .f-col {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    .f-track {
      position: relative;
      width: 100%;
      max-width: 44px;
      height: 170px;
      background: rgba(29, 53, 87, 0.04);
      border-radius: var(--radius-xs);
      overflow: hidden;
    }

    .confidence-band {
      position: absolute;
      left: 0;
      right: 0;
      background: rgba(76, 201, 240, 0.22);
      border-top: 1px dashed var(--sky-blue);
      border-bottom: 1px dashed var(--sky-blue);
    }

    .actual-bar {
      position: absolute;
      bottom: 0;
      left: 20%;
      right: 20%;
      background: var(--sky-gradient);
      border-radius: var(--radius-xs) var(--radius-xs) 0 0;
    }

    .prediction-marker {
      position: absolute;
      left: 5%;
      right: 5%;
      height: 3px;
      background: var(--sun-amber);
      border-radius: 2px;
      box-shadow: 0 0 6px var(--sun-amber);
    }

    .f-label {
      font-size: 11px;
      color: var(--text-light);
      font-weight: 700;
    }

    .chart-legend-row {
      display: flex;
      gap: 20px;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      padding-top: 10px;
      border-top: 1px solid rgba(29, 53, 87, 0.08);
    }

    .bullet {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 4px;
      &.sky { background: var(--sky-ocean); }
      &.sun { background: var(--sun-amber); }
      &.band { background: rgba(76, 201, 240, 0.4); }
    }

    /* Scenario Card */
    .scenario-card {
      padding: 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 16px;
    }

    .scenario-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .scenario-icon-box {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-sm);
      background: var(--sun-light);
      color: #A35C00;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .scenario-title {
      font-size: 16px;
      font-weight: 800;
      color: var(--text-main);
    }

    .scenario-sub {
      font-size: 12px;
      color: var(--text-light);
    }

    .sliders-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .slider-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .slider-label-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 700;
      color: var(--text-main);
    }

    .slider-val {
      color: var(--sun-amber);
      font-weight: 800;
      &.danger { color: var(--alert-coral); }
    }

    .slider-hint {
      font-size: 11px;
      color: var(--text-light);
    }

    .checkbox-group {
      margin-top: 4px;
    }

    .custom-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-main);

      input {
        width: 16px;
        height: 16px;
        accent-color: var(--sun-amber);
      }
    }

    .scenario-result-box {
      padding: 14px;
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.7);
      border: 1px dashed rgba(251, 133, 0, 0.4);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .res-title {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 700;
    }

    .res-diff {
      font-size: 14px;
      color: var(--text-main);
      strong { color: var(--sun-amber); }
    }

    .btn-full {
      width: 100%;
    }

    /* Table Card */
    .table-card {
      padding: 24px;
    }

    .table-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .filter-pills {
      display: flex;
      gap: 6px;
    }

    .filter-pill {
      padding: 6px 14px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(29, 53, 87, 0.1);
      background: rgba(255, 255, 255, 0.85);
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover { color: var(--text-main); }
      &.active {
        background: var(--sun-gradient);
        color: #FFFFFF;
        border-color: transparent;
      }
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

      tr:hover td {
        background: rgba(255, 255, 255, 0.6);
      }

      tr.highlighted td {
        background: rgba(255, 183, 3, 0.12);
      }
    }

    .gov-name-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      .gov-icon { font-size: 18px; color: var(--sun-amber); }
    }

    .text-ar {
      font-family: var(--font-arabic);
      direction: rtl;
    }

    .usage-bar-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .usage-text {
      font-size: 12px;
      font-weight: 700;
    }

    .btn-inspect {
      padding: 6px 12px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid var(--sky-blue);
      color: var(--sky-deep);
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        background: var(--sky-blue);
        color: #FFFFFF;
      }
    }

    @media (max-width: 1024px) {
      .ai-forecast-grid { grid-template-columns: 1fr; }
      .control-header { flex-direction: column; align-items: flex-start; gap: 16px; }
    }
  `]
})
export class OperateurDashboardComponent {
  eleService = inject(ElectricityService);
  outageService = inject(OutageService);
  fraudService = inject(FraudService);

  selectedGovernorate = signal<Governorate | null>(null);
  statusFilter = signal<string>('ALL');

  tempDelta = signal<number>(0);
  industrialActivity = signal<number>(100);
  isHoliday = signal<boolean>(false);

  Math = Math;

  forecastData = signal(this.eleService.getForecast());

  refreshMetrics(): void {
    this.forecastData.set(this.eleService.getForecast(this.selectedGovernorate()?.id));
  }

  onGovernorateSelected(gov: Governorate): void {
    this.selectedGovernorate.set(gov);
    this.forecastData.set(this.eleService.getForecast(gov.id));
  }

  onTempDeltaChange(val: number): void {
    this.tempDelta.set(val);
    this.eleService.updateScenario({ tempDeltaC: val });
    this.forecastData.set(this.eleService.getForecast(this.selectedGovernorate()?.id));
  }

  onIndustrialChange(val: number): void {
    this.industrialActivity.set(val);
    this.eleService.updateScenario({ industrialActivityPct: val });
  }

  onHolidayToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.isHoliday.set(checked);
    this.eleService.updateScenario({ isHoliday: checked });
  }

  resetScenario(): void {
    this.tempDelta.set(0);
    this.industrialActivity.set(100);
    this.isHoliday.set(false);
    this.eleService.resetScenario();
    this.forecastData.set(this.eleService.getForecast(this.selectedGovernorate()?.id));
  }

  filteredGovernorates(): Governorate[] {
    const filter = this.statusFilter();
    const list = this.eleService.governorates();
    if (filter === 'ALL') return list;
    return list.filter(g => g.status === filter);
  }

  getUsageClass(gov: Governorate): string {
    const ratio = gov.currentLoadMw / gov.capacityMw;
    if (ratio > 0.90) return 'coral';
    if (ratio > 0.75) return 'sun';
    return 'nature';
  }

  getBadgeColor(status: string): string {
    switch (status) {
      case 'SURCHARGE': return 'coral';
      case 'ELEVEE': return 'sun';
      default: return 'nature';
    }
  }
}
