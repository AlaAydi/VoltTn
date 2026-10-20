import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ElectricityService } from '../../../core/services/electricity.service';
import { OutageService } from '../../../core/services/outage.service';
import { FraudService } from '../../../core/services/fraud.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SystemSchedulerService } from '../../../core/services/system-scheduler.service';
import { TunisiaMap3dComponent } from '../../../shared/components/tunisia-map-3d/tunisia-map-3d.component';
import { TunisiaLeafletMapComponent } from '../../../shared/components/tunisia-leaflet-map/tunisia-leaflet-map.component';
import { Tilt3dDirective } from '../../../shared/directives/tilt-3d.directive';
import { Governorate } from '../../../models/governorate.model';
import { OutageReport } from '../../../models/outage.model';

export interface EquipmentRisk {
  id: string;
  name: string;
  type: string;
  governorate: string;
  healthIndexPct: number;
  failureRisk: 'CRITIQUE' | 'MOYEN' | 'FAIBLE';
  plannedMaintenance: string;
  recommendation: string;
}

@Component({
  selector: 'app-operateur-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    TunisiaMap3dComponent, 
    TunisiaLeafletMapComponent, 
    Tilt3dDirective
  ],
  template: `
    <div class="operator-dashboard">
      
      <!-- En-tête Salle de Contrôle Nationale Dispatching -->
      <div class="control-header glass-card animate-float">
        <div class="header-left">
          <div class="badge-row">
            <span class="glass-badge badge-sky">
              <span class="material-symbols-rounded">dns</span>
              Dispatching National STEG
            </span>
            <span class="glass-badge badge-nature">Fréquence Réseau : 50.02 Hz</span>
            <span class="glass-badge badge-sun">Modèle IA LightGBM v2.4 Actif</span>
          </div>
          <h1 class="header-title">Supervision Intelligente du Réseau Électrique Tunisien</h1>
          <p class="header-desc">
            Surveillance en temps réel des 24 gouvernorats, prévision de charge IA multi-horizons, pilotage des coupures et maintenance prédictive.
          </p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="refreshMetrics()">
            <span class="material-symbols-rounded">refresh</span>
            <span>Actualiser SCADA</span>
          </button>
          <button class="btn-secondary" (click)="exportDailyReport()">
            <span class="material-symbols-rounded">file_download</span>
            <span>Export Rapport Excel</span>
          </button>
        </div>
      </div>

      <!-- Navigation par Onglets de la Salle de Contrôle -->
      <div class="dashboard-tabs-bar glass-card">
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'overview'" 
          (click)="setTab('overview')"
        >
          <span class="material-symbols-rounded">monitoring</span>
          <span>Surveillance Temps Réel & 3D</span>
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'forecast'" 
          (click)="setTab('forecast')"
        >
          <span class="material-symbols-rounded">trending_up</span>
          <span>Prévision de Charge & Scénarios</span>
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'dispatching'" 
          (click)="setTab('dispatching')"
        >
          <span class="material-symbols-rounded">map</span>
          <span>Carte Google Maps & Affectations ({{ outageService.stats().active }})</span>
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'maintenance'" 
          (click)="setTab('maintenance')"
        >
          <span class="material-symbols-rounded">build_circle</span>
          <span>Maintenance & Risques Équipements</span>
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'scheduler'" 
          (click)="setTab('scheduler')"
        >
          <span class="material-symbols-rounded">schedule</span>
          <span>Planificateur Système Automate</span>
        </button>
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
              <div class="progress-bar-fill coral" [style.width.%]="(outageService.stats().active / 20) * 100"></div>
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

      <!-- ONGLET 1 : SURVEILLANCE TEMPS RÉEL & CARTE 3D THREE.JS -->
      @if (activeTab() === 'overview') {
        <div class="map-section glass-card">
          <div class="section-title-row">
            <div>
              <h2 class="card-title">Jumeau Numérique 3D du Réseau Électrique Tunisien (Three.js)</h2>
              <p class="card-sub">
                Extrusion en colonnes 3D selon la charge électrique en temps réel des 24 gouvernorats avec simulation du cycle solaire et vagues de chaleur.
              </p>
            </div>
            <div class="selected-gov-banner" *ngIf="selectedGovernorate()">
              <span class="pin-icon material-symbols-rounded">location_on</span>
              <span class="gov-selected-name">{{ selectedGovernorate()?.name }} ({{ selectedGovernorate()?.nameAr }})</span>
              <span class="gov-selected-load">{{ selectedGovernorate()?.currentLoadMw }} MW / {{ selectedGovernorate()?.capacityMw }} MW</span>
              <button class="btn-clear" (click)="selectedGovernorate.set(null)">✕</button>
            </div>
          </div>

          <!-- Barre d'Outils Jumeau Numérique 3D : Curseur Temporel 24h & Bouton Canicule -->
          <div class="digital-twin-toolbar glass-panel">
            <div class="twin-col slider-col">
              <div class="twin-lbl-row">
                <span class="material-symbols-rounded twin-icon sun">schedule</span>
                <span class="twin-lbl">Curseur Temporel 24h (Rejouer Charge Prévue) : <strong>{{ twinHour() }}h00</strong></span>
                <span class="sun-cycle-badge">
                  <span class="material-symbols-rounded">{{ getSunCycleIcon() }}</span>
                  <span>{{ getSunCycleLabel() }}</span>
                </span>
              </div>
              <input 
                type="range" 
                class="range-slider" 
                min="0" 
                max="23" 
                [ngModel]="twinHour()" 
                (ngModelChange)="onTwinHourChange($event)"
              />
            </div>

            <div class="twin-col canicule-col">
              <button 
                class="btn-heatwave" 
                [class.active]="isHeatwaveActive()" 
                (click)="toggleHeatwave()"
              >
                <span class="material-symbols-rounded">local_fire_department</span>
                <span>Bouton « Canicule +6 °C »</span>
                <span class="heat-pill">{{ isHeatwaveActive() ? 'ACTIF (+18%)' : 'OFF' }}</span>
              </button>
            </div>
          </div>

          <!-- Composant Three.js Carte 3D -->
          <app-tunisia-map-3d 
            [governorates]="eleService.governorates()"
            (governorateSelected)="onGovernorateSelected($event)"
          ></app-tunisia-map-3d>

          <!-- Mix Énergétique National (Gaz, Solaire, Éolien, CO2) -->
          <div class="energy-mix-strip glass-panel">
            <div class="mix-box">
              <span class="mix-title">Gaz Naturel (Centrales TG)</span>
              <div class="mix-bar-bg"><div class="mix-bar-fill gas" style="width: 81.4%;"></div></div>
              <span class="mix-val">81.4% (3 240 MW)</span>
            </div>
            <div class="mix-box">
              <span class="mix-title">Solaire Photovoltaïque</span>
              <div class="mix-bar-bg"><div class="mix-bar-fill solar" style="width: 12.4%;"></div></div>
              <span class="mix-val text-nature">12.4% (495 MW)</span>
            </div>
            <div class="mix-box">
              <span class="mix-title">Éolien (Bizerte & Cap Bon)</span>
              <div class="mix-bar-bg"><div class="mix-bar-fill wind" style="width: 6.2%;"></div></div>
              <span class="mix-val text-sky">6.2% (248 MW)</span>
            </div>
            <div class="mix-box co2-box">
              <span class="mix-title">CO₂ Évité (Aujourd'hui)</span>
              <strong class="co2-val text-nature">🌿 148 Tonnes</strong>
              <span class="co2-sub">Grâce au mix EnR tunisien</span>
            </div>
          </div>
        </div>

        <!-- Tableau des 24 Gouvernorats avec filtres -->
        <div class="table-card glass-card">
          <div class="table-header">
            <div>
              <h2 class="card-title">Statut Réseau des 24 Gouvernorats</h2>
              <p class="card-sub">Capacités et charges mesurées par le SCADA national</p>
            </div>
            <div class="filter-pills">
              <button class="filter-pill" [class.active]="statusFilter() === 'ALL'" (click)="statusFilter.set('ALL')">Tous (24)</button>
              <button class="filter-pill coral" [class.active]="statusFilter() === 'SURCHARGE'" (click)="statusFilter.set('SURCHARGE')">Surcharge</button>
              <button class="filter-pill sun" [class.active]="statusFilter() === 'ELEVEE'" (click)="statusFilter.set('ELEVEE')">Élevée</button>
              <button class="filter-pill nature" [class.active]="statusFilter() === 'NORMAL'" (click)="statusFilter.set('NORMAL')">Nominal</button>
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
      }

      <!-- ONGLET 2 : PRÉVISION DE CHARGE & SCÉNARIOS & ACTIONS RECOMMANDÉES -->
      @if (activeTab() === 'forecast') {
        
        <!-- Recommandations d'Action IA en cas de tension réseau -->
        <div class="actions-banner glass-card">
          <div class="action-banner-header">
            <div class="rec-title-box">
              <span class="material-symbols-rounded text-sun">auto_fix_high</span>
              <h2 class="card-title">Recommandations d'Action Générées par l'IA</h2>
            </div>
            <span class="glass-badge badge-sun">Algorithme d'Optimisation Heuristique</span>
          </div>

          <div class="recommendations-grid">
            <div class="rec-card glass-panel">
              <div class="rec-top">
                <span class="material-symbols-rounded rec-icon coral">factory</span>
                <div>
                  <h4 class="rec-name">Effacement de Charge Industriel</h4>
                  <p class="rec-sub">Zones de Mégrine & Sfax (-120 MW)</p>
                </div>
              </div>
              <p class="rec-desc">Notification d'interruption contractuelle aux cimenteries et industries lourdes pour écrêter la pointe de 14h.</p>
              <button class="btn-primary" (click)="applyRecommendation('EFFACEMENT')">
                <span>Appliquer l'Effacement (-120 MW)</span>
              </button>
            </div>

            <div class="rec-card glass-panel">
              <div class="rec-top">
                <span class="material-symbols-rounded rec-icon sky">electric_bolt</span>
                <div>
                  <h4 class="rec-name">Enclenchement Turbine à Gaz Ghannouch</h4>
                  <p class="rec-sub">Démarrage réserve rapide (+200 MW)</p>
                </div>
              </div>
              <p class="rec-desc">Appel de puissance pour compenser le pic thermique et restaurer la marge de réserve nationale au-dessus de 20%.</p>
              <button class="btn-sky" (click)="applyRecommendation('TURBINE')">
                <span>Enclencher Réserve (+200 MW)</span>
              </button>
            </div>

            <div class="rec-card glass-panel">
              <div class="rec-top">
                <span class="material-symbols-rounded rec-icon sun">campaign</span>
                <div>
                  <h4 class="rec-name">Alerte Éco-Gestes aux Abonnés Citoyens</h4>
                  <p class="rec-sub">Diffusion ciblée Grand Tunis & Sahel</p>
                </div>
              </div>
              <p class="rec-desc">Push mobile et SMS invitant 450 000 foyers à décaler leurs appareils et climatiser à 26°C.</p>
              <button class="btn-secondary" (click)="applyRecommendation('NOTIF')">
                <span>Diffuser Notification Push</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Bloc Courbe & Sliders -->
        <div class="ai-forecast-grid">
          
          <!-- Courbe de charge avec Sélecteur de Région et d'Horizon -->
          <div class="glass-card forecast-card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Prévision de Charge (LightGBM)</h2>
                <div class="forecast-selectors-row">
                  <select class="form-select mini" [ngModel]="selectedGovForForecast" (ngModelChange)="onForecastGovChange($event)">
                    <option value="NATIONAL">National (Réseau Tunisie)</option>
                    @for (gov of eleService.governorates(); track gov.id) {
                      <option [value]="gov.id">{{ gov.name }} ({{ gov.nameAr }})</option>
                    }
                  </select>
                  <div class="horizon-pills">
                    <button class="h-pill" [class.active]="selectedHorizon === 'J+1'" (click)="setHorizon('J+1')">Horizon J+1 (24h)</button>
                    <button class="h-pill" [class.active]="selectedHorizon === 'J+7'" (click)="setHorizon('J+7')">Horizon J+7 (Semaine)</button>
                  </div>
                </div>
              </div>

              <!-- Indicateurs de précision du modèle ML -->
              <div class="metrics-pills">
                <span class="metric-pill">MAE : <strong>{{ forecastData().metrics.mae }} MW</strong></span>
                <span class="metric-pill">RMSE : <strong>{{ forecastData().metrics.rmse }} MW</strong></span>
                <span class="metric-pill">MAPE : <strong>{{ forecastData().metrics.mape }}%</strong></span>
              </div>
            </div>

            <div class="forecast-chart-container">
              <div class="chart-bars">
                @for (hour of forecastData().labels; track hour; let idx = $index) {
                  <div class="f-col">
                    <div class="f-track">
                      <div 
                        class="confidence-band" 
                        [style.bottom.%]="(forecastData().lowerConfidence[idx] / 5200) * 100"
                        [style.height.%]="((forecastData().upperConfidence[idx] - forecastData().lowerConfidence[idx]) / 5200) * 100"
                      ></div>
                      <div 
                        class="actual-bar" 
                        [style.height.%]="(forecastData().actual[idx] / 5200) * 100"
                      ></div>
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

          <!-- Simulateur de Scénarios en Direct -->
          <div class="glass-card scenario-card" appTilt3d [maxTilt]="6">
            <div class="scenario-header">
              <div class="scenario-icon-box">
                <span class="material-symbols-rounded">psychology</span>
              </div>
              <div>
                <h3 class="scenario-title">Simulation de Scénarios en Direct</h3>
                <p class="scenario-sub">Testez la résilience lors des canicules et fêtes</p>
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
                  <span class="checkbox-text">Scénario Jour Férié / Aïd (-350 MW)</span>
                </label>
              </div>

              <button class="btn-secondary btn-full" (click)="resetScenario()">
                <span class="material-symbols-rounded">restart_alt</span>
                <span>Réinitialiser Scénario</span>
              </button>
            </div>
          </div>

        </div>

        <!-- Suivi de la Dérive du Modèle ML [NOUVEAU] -->
        <div class="drift-card glass-card animate-float">
          <div class="drift-header">
            <div class="drift-title-box">
              <span class="material-symbols-rounded text-sky">query_stats</span>
              <div>
                <h3 class="card-title">Suivi de la Dérive du Modèle IA (Data Drift & Concept Drift)</h3>
                <p class="card-sub">Surveillance continue de la stabilité statistique (LightGBM v2.4 - Réseau National)</p>
              </div>
            </div>
            <span class="glass-badge badge-nature">Modèle Stable • Score PSI : 0.032</span>
          </div>

          <div class="drift-metrics-grid">
            <div class="drift-kpi glass-panel">
              <span class="kpi-label">Indice de Stabilité (PSI)</span>
              <span class="kpi-val text-nature">0.032</span>
              <span class="kpi-sub">Distribution stable (&lt; 0.10)</span>
            </div>
            <div class="drift-kpi glass-panel">
              <span class="kpi-label">Test Kolmogorov-Smirnov</span>
              <span class="kpi-val text-sky">0.024</span>
              <span class="kpi-sub">Features météo cohérentes</span>
            </div>
            <div class="drift-kpi glass-panel">
              <span class="kpi-label">Précision en Production</span>
              <span class="kpi-val text-sun">96.8%</span>
              <span class="kpi-sub">Seuil d'alerte : &lt; 92.0%</span>
            </div>
            <div class="drift-kpi action-kpi glass-panel">
              <span class="kpi-label">Action Dérive</span>
              <span class="drift-status-badge">Précision Optimale</span>
              <button class="btn-secondary btn-mini" (click)="triggerRetrain()">
                <span class="material-symbols-rounded">model_training</span>
                <span>Réentraîner</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ONGLET 3 : DISPATCHING SUR CARTE GOOGLE MAPS & AFFECTATION TECHNICIEN -->
      @if (activeTab() === 'dispatching') {
        <div class="dispatching-layout">
          
          <div class="map-dispatch-card glass-card">
            <div class="section-title-row">
              <div>
                <h2 class="card-title">Carte des Incidents Réseau & Affectation Terrain</h2>
                <p class="card-sub">Cliquez sur un incident pour assigner le technicien le plus proche</p>
              </div>
            </div>

            <!-- Carte Google Maps Leaflet -->
            <app-tunisia-leaflet-map
              [outages]="outageService.outages()"
              (outageSelected)="onIncidentSelected($event)"
            ></app-tunisia-leaflet-map>
          </div>

          <!-- Volet d'Affectation du Technicien le Plus Proche -->
          <div class="assign-sidebar glass-card">
            <h3 class="card-title">Dispatching Intervention</h3>
            
            @if (selectedIncident(); as inc) {
              <div class="inc-selected-box glass-panel">
                <div class="inc-header">
                  <span class="ref-badge">{{ inc.reference }}</span>
                  <span class="glass-badge badge-coral">{{ inc.status }}</span>
                </div>
                <h4 class="inc-addr">{{ inc.address }}</h4>
                <p class="inc-gov">{{ inc.district }}, <strong>{{ inc.governorate }}</strong></p>
                <div class="inc-affected">Abonnés touchés : <strong>{{ inc.affectedCustomers | number }}</strong></div>
              </div>

              <h4 class="tech-list-title">Techniciens Disponibles à Proximité :</h4>
              <div class="technicians-list">
                @for (tech of availableTechnicians; track tech.name) {
                  <div class="tech-item glass-panel">
                    <img [src]="tech.avatar" [alt]="tech.name" class="tech-avatar" />
                    <div class="tech-meta">
                      <strong class="t-name">{{ tech.name }}</strong>
                      <span class="t-district">{{ tech.district }} • {{ tech.distanceKm }} km</span>
                      <span class="t-status">Disponibilité : Immédiate</span>
                    </div>
                    <button class="btn-primary btn-mini" (click)="assignToTech(inc, tech.name)">
                      Affecter
                    </button>
                  </div>
                }
              </div>
            } @else {
              <div class="empty-selection-box">
                <span class="material-symbols-rounded">touch_app</span>
                <p>Sélectionnez un incident sur la carte pour affecter une équipe d'intervention rapide.</p>
              </div>
            }
          </div>

        </div>

        <!-- Module Coupures Programmées & Extraction NLP [NOUVEAU] -->
        <div class="scheduled-outage-card glass-card animate-float">
          <div class="section-title-row">
            <div>
              <h3 class="card-title">Coupures Programmées par Quartier & Extraction NLP [IA]</h3>
              <p class="card-sub">L'opérateur colle le texte officiel de l'avis STEG (en arabe ou français), le modèle NLP extrait les zones pour affichage et alerte ciblée.</p>
            </div>
            <div class="nlp-samples-btns">
              <button type="button" class="btn-sample" (click)="loadSampleNlp('AR')">Exemple Arabe (أريانة والنصر)</button>
              <button type="button" class="btn-sample" (click)="loadSampleNlp('FR')">Exemple Français (Menzah 9 & Tunis)</button>
            </div>
          </div>

          <div class="nlp-input-row">
            <div class="nlp-text-box">
              <label class="form-label">Texte Officiel de l'Avis de Coupure (Arabe / Français) :</label>
              <textarea 
                class="form-textarea" 
                rows="4" 
                [(ngModel)]="nlpOutageText"
                placeholder="Collez ici l'avis officiel de la STEG..."
              ></textarea>
              <button class="btn-primary" (click)="runNlpExtraction()">
                <span class="material-symbols-rounded">psychology</span>
                <span>Extraire les Zones avec le Modèle NLP (IA)</span>
              </button>
            </div>

            @if (extractedNlpZone(); as zone) {
              <div class="nlp-result-box glass-panel animate-float">
                <div class="result-header">
                  <span class="material-symbols-rounded text-green">verified</span>
                  <strong>Entités Nommées Extraites (NER & Regex) :</strong>
                </div>
                <div class="result-grid">
                  <div><span>Gouvernorat Détecté :</span> <strong>{{ zone.governorate }}</strong></div>
                  <div><span>Quartier / Secteur :</span> <strong>{{ zone.district }}</strong></div>
                  <div><span>Date Prévue :</span> <strong>{{ zone.date }}</strong></div>
                  <div><span>Plage Horaire :</span> <strong>{{ zone.timeSlot }}</strong></div>
                  <div><span>Abonnés Concernés :</span> <strong class="text-coral">{{ zone.affectedHomes }} foyers</strong></div>
                  <div><span>Motif Détecté :</span> <em>{{ zone.reason }}</em></div>
                </div>
                <div class="result-actions">
                  <button class="btn-primary" (click)="publishScheduledOutage()">
                    <span class="material-symbols-rounded">campaign</span>
                    <span>Afficher sur la Carte & Alerter les Citoyens du Quartier</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ONGLET 4 : MAINTENANCE PRÉVENTIVE & RISQUES ÉQUIPEMENTS (BONUS) -->
      @if (activeTab() === 'maintenance') {
        <div class="maintenance-view glass-card">
          <div class="section-title-row">
            <div>
              <h2 class="card-title">Surveillance Prédictive des Équipements HT/MT (STEG)</h2>
              <p class="card-sub">Indice de santé Health Index (%) calculé par IA et planification des révisions</p>
            </div>
            <button class="btn-primary" (click)="validateMaintenancePlanning()">
              <span class="material-symbols-rounded">verified</span>
              <span>Valider le Planning de Maintenance</span>
            </button>
          </div>

          <div class="table-responsive">
            <table class="volttn-table">
              <thead>
                <tr>
                  <th>Équipement Stratégique</th>
                  <th>Gouvernorat</th>
                  <th>Health Index (Santé)</th>
                  <th>Risque de Défaillance</th>
                  <th>Maintenance Planifiée</th>
                  <th>Recommandation IA</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (eq of equipmentRisks(); track eq.id) {
                  <tr>
                    <td><strong>{{ eq.name }}</strong> <br><small class="text-muted">{{ eq.type }}</small></td>
                    <td>{{ eq.governorate }}</td>
                    <td>
                      <div class="usage-bar-wrapper">
                        <div class="progress-bar-bg mini">
                          <div 
                            class="progress-bar-fill" 
                            [class.coral]="eq.healthIndexPct < 60"
                            [class.sun]="eq.healthIndexPct >= 60 && eq.healthIndexPct < 80"
                            [class.nature]="eq.healthIndexPct >= 80"
                            [style.width.%]="eq.healthIndexPct"
                          ></div>
                        </div>
                        <span class="usage-text">{{ eq.healthIndexPct }}%</span>
                      </div>
                    </td>
                    <td>
                      <span class="glass-badge" [ngClass]="eq.failureRisk === 'CRITIQUE' ? 'badge-coral' : (eq.failureRisk === 'MOYEN' ? 'badge-sun' : 'badge-nature')">
                        {{ eq.failureRisk }}
                      </span>
                    </td>
                    <td>{{ eq.plannedMaintenance }}</td>
                    <td>{{ eq.recommendation }}</td>
                    <td>
                      <button class="btn-inspect" (click)="orderImmediateMaintenance(eq)">
                        Planifier
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ONGLET 5 : PLANIFICATEUR SYSTÈME & AUTOMATE (ACTEUR 6) -->
      @if (activeTab() === 'scheduler') {
        <div class="scheduler-view glass-card">
          <div class="section-title-row">
            <div>
              <h2 class="card-title">Automates & Tâches Planifiées en Arrière-Plan (Système VoltTN)</h2>
              <p class="card-sub">Cycle d'automatisation SCADA, prévisions périodiques, clustering et notifications</p>
            </div>
          </div>

          <div class="tasks-grid">
            @for (task of schedulerService.tasks(); track task.id) {
              <div class="task-card glass-panel" appTilt3d [maxTilt]="6">
                <div class="task-top">
                  <div class="task-icon-box">
                    <span class="material-symbols-rounded">{{ task.icon }}</span>
                  </div>
                  <span class="glass-badge badge-nature">
                    {{ task.status === 'RUNNING' ? 'En cours...' : 'Opérationnel' }}
                  </span>
                </div>

                <h3 class="task-name">{{ task.name }}</h3>
                <p class="task-desc">{{ task.description }}</p>

                <div class="task-meta-row">
                  <div>
                    <span class="lbl">Fréquence :</span>
                    <strong class="val">{{ task.frequency }}</strong>
                  </div>
                  <div>
                    <span class="lbl">Dernière exécution :</span>
                    <strong class="val">{{ task.lastRun }}</strong>
                  </div>
                </div>

                <button class="btn-primary btn-full" [disabled]="task.status === 'RUNNING'" (click)="schedulerService.runTaskNow(task.id)">
                  <span class="material-symbols-rounded">play_circle</span>
                  <span>{{ task.status === 'RUNNING' ? 'Exécution...' : 'Exécuter Maintenant' }}</span>
                </button>
              </div>
            }
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .operator-dashboard {
      display: flex;
      flex-direction: column;
      gap: 22px;
      padding-bottom: 50px;
    }

    .control-header {
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
      max-width: 680px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    /* Tabs Bar */
    .dashboard-tabs-bar {
      display: flex;
      gap: 8px;
      padding: 8px 12px;
      border-radius: var(--radius-lg);
      overflow-x: auto;
    }

    .tab-btn {
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

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    .metric-card {
      padding: 20px;
      display: flex;
      gap: 16px;
      align-items: center;
      border-radius: var(--radius-lg);
    }

    .card-icon {
      width: 50px;
      height: 50px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      flex-shrink: 0;

      &.sun { background: var(--sun-gradient); }
      &.nature { background: var(--nature-gradient); }
      &.coral { background: linear-gradient(135deg, #FF6B6B 0%, #D90429 100%); }
      &.sky { background: var(--sky-gradient); }
    }

    .metric-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .m-label { font-size: 12px; font-weight: 700; color: var(--text-muted); }
    .m-val-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
      .m-val { font-size: 22px; font-weight: 900; color: var(--text-main); }
      .m-unit { font-size: 13px; font-weight: 700; color: var(--text-light); }
    }

    .progress-bar-bg {
      height: 6px;
      border-radius: var(--radius-full);
      background: rgba(29, 53, 87, 0.08);
      overflow: hidden;
      margin: 2px 0;
      &.mini { width: 90px; }
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: var(--radius-full);
      &.sun { background: var(--sun-gradient); }
      &.nature { background: var(--nature-gradient); }
      &.coral { background: var(--alert-coral); }
      &.sky { background: var(--sky-gradient); }
    }

    .m-sub { font-size: 11.5px; color: var(--text-muted); }

    /* Map Section */
    .map-section {
      padding: 24px;
      border-radius: var(--radius-xl);
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
      border-radius: var(--radius-full);
      font-size: 13px;
      font-weight: 800;
      color: #A35C00;
      .pin-icon { font-size: 18px; }
      .btn-clear { background: none; border: none; cursor: pointer; font-size: 14px; color: #A35C00; }
    }

    /* Forecast Block */
    .actions-banner {
      padding: 22px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 16px;
      border: 1.5px solid var(--sun-gold);
    }

    .action-banner-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .rec-title-box {
      display: flex;
      align-items: center;
      gap: 8px;
      .material-symbols-rounded { font-size: 24px; }
    }

    .recommendations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .rec-card {
      padding: 18px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .rec-top {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .rec-icon {
      font-size: 28px;
      &.coral { color: var(--alert-coral); }
      &.sky { color: var(--sky-blue); }
      &.sun { color: var(--sun-amber); }
    }

    .rec-name { font-size: 14px; font-weight: 800; color: var(--text-main); }
    .rec-sub { font-size: 11.5px; color: var(--text-light); }
    .rec-desc { font-size: 12px; color: var(--text-muted); line-height: 1.35; flex: 1; }

    .ai-forecast-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 22px;
    }

    .forecast-card, .scenario-card {
      padding: 24px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .forecast-selectors-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    .form-select.mini {
      padding: 6px 12px;
      font-size: 12.5px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(29, 53, 87, 0.15);
      outline: none;
      font-weight: 700;
    }

    .horizon-pills {
      display: flex;
      gap: 4px;
    }

    .h-pill {
      padding: 5px 12px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(29, 53, 87, 0.1);
      background: rgba(255, 255, 255, 0.9);
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      &.active { background: var(--sun-gradient); color: #FFFFFF; border-color: transparent; }
    }

    .metrics-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .metric-pill {
      padding: 4px 10px;
      background: rgba(29, 53, 87, 0.06);
      border-radius: var(--radius-full);
      font-size: 11.5px;
      color: var(--text-main);
    }

    .forecast-chart-container {
      height: 220px;
      width: 100%;
    }

    .chart-bars {
      display: flex;
      height: 100%;
      align-items: flex-end;
      gap: 12px;
      padding-bottom: 20px;
    }

    .f-col {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }

    .f-track {
      position: relative;
      width: 20px;
      height: 160px;
      background: rgba(29, 53, 87, 0.05);
      border-radius: var(--radius-full);
      display: flex;
      align-items: flex-end;
    }

    .confidence-band {
      position: absolute;
      left: 0;
      right: 0;
      background: rgba(76, 201, 240, 0.25);
      border-radius: 4px;
    }

    .actual-bar {
      width: 100%;
      background: var(--sky-gradient);
      border-radius: var(--radius-full);
    }

    .prediction-marker {
      position: absolute;
      left: -2px;
      right: -2px;
      height: 3px;
      background: var(--sun-gold);
      border-radius: var(--radius-full);
    }

    .f-label { font-size: 11px; font-weight: 700; color: var(--text-muted); }

    .chart-legend-row {
      display: flex;
      gap: 16px;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }

    .bullet {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 4px;
      &.sky { background: var(--sky-blue); }
      &.sun { background: var(--sun-gold); }
      &.band { background: rgba(76, 201, 240, 0.35); }
    }

    /* Scenario Card */
    .scenario-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .scenario-icon-box {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: var(--sun-light);
      color: var(--sun-amber);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .scenario-title { font-size: 16px; font-weight: 800; color: var(--text-main); }
    .scenario-sub { font-size: 12px; color: var(--text-muted); }

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
      font-size: 12.5px;
      font-weight: 700;
      color: var(--text-main);
    }

    .slider-val {
      color: var(--sun-amber);
      &.danger { color: var(--alert-coral); font-weight: 900; }
    }

    .range-slider {
      width: 100%;
      accent-color: var(--sun-amber);
    }

    .slider-hint { font-size: 11px; color: var(--text-light); }

    /* Dispatching Layout */
    .dispatching-layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 22px;
    }

    .map-dispatch-card, .assign-sidebar {
      padding: 22px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .inc-selected-box {
      padding: 14px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--sun-gold);
    }

    .inc-header { display: flex; justify-content: space-between; align-items: center; }
    .inc-addr { font-size: 14.5px; font-weight: 800; color: var(--text-main); margin-top: 4px; }
    .inc-gov { font-size: 12px; color: var(--text-light); }
    .inc-affected { font-size: 12.5px; color: var(--alert-coral); margin-top: 4px; }

    .tech-list-title { font-size: 13px; font-weight: 800; color: var(--text-main); margin-top: 6px; }

    .technicians-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .tech-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border-radius: var(--radius-md);
    }

    .tech-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
    }

    .tech-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      font-size: 11.5px;
      .t-name { color: var(--text-main); font-size: 12.5px; }
      .t-district { color: var(--text-muted); }
      .t-status { color: var(--nature-green); font-weight: 700; }
    }

    .btn-mini { padding: 6px 12px; font-size: 12px; }

    .empty-selection-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
      padding: 40px 20px;
      color: var(--text-light);
      .material-symbols-rounded { font-size: 38px; }
      p { font-size: 13px; }
    }

    /* Maintenance View */
    .maintenance-view, .scheduler-view {
      padding: 24px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Tasks Grid */
    .tasks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 18px;
    }

    .task-card {
      padding: 20px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .task-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .task-icon-box {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      background: var(--sky-light);
      color: var(--sky-ocean);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }

    .task-name { font-size: 14.5px; font-weight: 800; color: var(--text-main); }
    .task-desc { font-size: 12.5px; color: var(--text-muted); line-height: 1.35; flex: 1; }

    .task-meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      background: rgba(29, 53, 87, 0.04);
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      .lbl { color: var(--text-muted); margin-right: 4px; }
      .val { color: var(--text-main); }
    }

    /* Digital Twin 3D Toolbar & Sun Cycle */
    .digital-twin-toolbar {
      display: flex;
      gap: 20px;
      align-items: center;
      padding: 14px 20px;
      margin-bottom: 14px;
      border-radius: var(--radius-lg);
      flex-wrap: wrap;
    }

    .twin-col {
      display: flex;
      flex-direction: column;
      gap: 6px;
      &.slider-col { flex: 1; min-width: 260px; }
      &.canicule-col { flex-shrink: 0; }
    }

    .twin-lbl-row {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--text-main);
    }

    .twin-icon { font-size: 20px; }

    .sun-cycle-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      background: rgba(245, 158, 11, 0.12);
      color: var(--sun-amber);
      font-size: 11.5px;
      font-weight: 700;
      .material-symbols-rounded { font-size: 16px; }
    }

    .btn-heatwave {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--alert-coral);
      background: rgba(239, 71, 111, 0.08);
      color: var(--alert-coral);
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.25s;

      &:hover {
        background: var(--alert-coral);
        color: #FFFFFF;
      }

      &.active {
        background: linear-gradient(135deg, #EF476F 0%, #D90429 100%);
        color: #FFFFFF;
        box-shadow: 0 4px 14px rgba(239, 71, 111, 0.4);
      }
    }

    .heat-pill {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      background: rgba(0, 0, 0, 0.15);
    }

    /* Mix Énergétique Strip */
    .energy-mix-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      padding: 16px 20px;
      margin-top: 14px;
      border-radius: var(--radius-lg);
    }

    .mix-box {
      display: flex;
      flex-direction: column;
      gap: 4px;
      &.co2-box { justify-content: center; text-align: center; }
    }

    .mix-title { font-size: 11.5px; color: var(--text-light); font-weight: 600; }

    .mix-bar-bg {
      width: 100%;
      height: 8px;
      background: rgba(0, 0, 0, 0.08);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .mix-bar-fill {
      height: 100%;
      border-radius: var(--radius-full);
      &.gas { background: #64748B; }
      &.solar { background: var(--nature-green); }
      &.wind { background: var(--sky-blue); }
    }

    .mix-val { font-size: 12px; font-weight: 800; color: var(--text-main); }
    .co2-val { font-size: 16px; font-weight: 900; }
    .co2-sub { font-size: 10px; color: var(--text-light); }

    /* Model Drift Card */
    .drift-card {
      margin-top: 20px;
      padding: 22px;
      border-radius: var(--radius-xl);
    }

    .drift-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .drift-title-box {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .drift-metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .drift-kpi {
      padding: 14px 18px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 4px;
      &.action-kpi { justify-content: space-between; }
    }

    .kpi-label { font-size: 12px; color: var(--text-light); font-weight: 600; }
    .kpi-val { font-size: 22px; font-weight: 900; }
    .kpi-sub { font-size: 11px; color: var(--text-muted); }

    .drift-status-badge {
      font-size: 11px;
      font-weight: 800;
      color: var(--nature-green);
      background: rgba(46, 196, 182, 0.12);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      display: inline-block;
      width: fit-content;
    }

    /* Scheduled Outages Card */
    .scheduled-outage-card {
      margin-top: 22px;
      padding: 22px;
      border-radius: var(--radius-xl);
    }

    .nlp-samples-btns {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn-sample {
      padding: 5px 12px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(29, 53, 87, 0.15);
      background: #FFFFFF;
      font-size: 11.5px;
      font-weight: 700;
      color: var(--sky-ocean);
      cursor: pointer;
      &:hover { background: #F1F5F9; border-color: var(--sky-ocean); }
    }

    .nlp-input-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 14px;
    }

    .nlp-text-box {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .nlp-result-box {
      padding: 16px 20px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, rgba(240, 253, 244, 0.9) 0%, rgba(236, 253, 245, 0.9) 100%);
      border: 1.5px solid rgba(46, 196, 182, 0.35);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .result-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #0d5c52;
      font-size: 13.5px;
    }

    .result-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      font-size: 12.5px;
      div span { color: var(--text-muted); display: block; font-size: 11px; }
      div strong { color: var(--text-main); }
    }

    .result-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 6px;
    }

    .btn-full { width: 100%; }

    @media (max-width: 1024px) {
      .ai-forecast-grid, .dispatching-layout, .nlp-input-row { grid-template-columns: 1fr; }
    }
  `]
})
export class OperateurDashboardComponent implements OnInit, OnDestroy {
  eleService = inject(ElectricityService);
  outageService = inject(OutageService);
  fraudService = inject(FraudService);
  notifService = inject(NotificationService);
  schedulerService = inject(SystemSchedulerService);
  router = inject(Router);

  activeTab = signal<'overview' | 'forecast' | 'dispatching' | 'maintenance' | 'scheduler'>('overview');
  selectedGovernorate = signal<Governorate | null>(null);
  statusFilter = signal<string>('ALL');

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
    if (url.includes('/operateur/load-forecast')) {
      this.activeTab.set('forecast');
    } else if (url.includes('/operateur/outages') || url.includes('/operateur/dispatching')) {
      this.activeTab.set('dispatching');
    } else if (url.includes('/operateur/maintenance')) {
      this.activeTab.set('maintenance');
    } else if (url.includes('/operateur/scheduler')) {
      this.activeTab.set('scheduler');
    } else {
      this.activeTab.set('overview');
    }
  }

  setTab(tab: 'overview' | 'forecast' | 'dispatching' | 'maintenance' | 'scheduler'): void {
    this.activeTab.set(tab);
    const routeMap: Record<string, string> = {
      overview: '/operateur/dashboard',
      forecast: '/operateur/load-forecast',
      dispatching: '/operateur/outages',
      maintenance: '/operateur/maintenance',
      scheduler: '/operateur/scheduler'
    };
    if (routeMap[tab]) {
      this.router.navigateByUrl(routeMap[tab]);
    }
  }

  // Forecast state
  selectedGovForForecast = 'NATIONAL';
  selectedHorizon: 'J+1' | 'J+7' = 'J+1';

  // Scenario
  tempDelta = signal<number>(0);
  industrialActivity = signal<number>(100);
  isHoliday = signal<boolean>(false);

  Math = Math;
  forecastData = signal(this.eleService.getForecast(undefined, 'J+1'));

  // Incident & Dispatching
  selectedIncident = signal<OutageReport | null>(this.outageService.outages()[0] || null);

  availableTechnicians = [
    { name: 'Karim Trabelsi', district: 'Ben Arous / Tunis-Sud', distanceKm: 4.2, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
    { name: 'Slim Ben Amor', district: 'Sousse / Sahel', distanceKm: 11.5, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80' },
    { name: 'Mounir Chaari', district: 'Sfax / Centre', distanceKm: 8.0, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80' }
  ];

  // Maintenance & Equipments (Bonus)
  equipmentRisks = signal<EquipmentRisk[]>([
    { id: 'eq-01', name: 'Poste HT 225kV Radès', type: 'Sous-Station Électrique', governorate: 'Ben Arous', healthIndexPct: 58, failureRisk: 'CRITIQUE', plannedMaintenance: '22 Oct 2025', recommendation: 'Remplacement disjoncteur SF6 sous 48h' },
    { id: 'eq-02', name: 'Transformateur MT 630kVA Belvédère', type: 'Poste Transformateur', governorate: 'Tunis', healthIndexPct: 72, failureRisk: 'MOYEN', plannedMaintenance: 'Aujourd\'hui 14h', recommendation: 'Filtration de l\'huile diélectrique' },
    { id: 'eq-03', name: 'Départ Aérien 30kV Métline', type: 'Ligne Moyenne Tension', governorate: 'Bizerte', healthIndexPct: 84, failureRisk: 'FAIBLE', plannedMaintenance: '30 Oct 2025', recommendation: 'Inspection par drone des isolateurs' },
    { id: 'eq-04', name: 'Centrale Ghannouch Turbine 1', type: 'Groupe Turbo-Gaz', governorate: 'Gabès', healthIndexPct: 76, failureRisk: 'MOYEN', plannedMaintenance: '05 Nov 2025', recommendation: 'Révision standard des injecteurs' }
  ]);

  refreshMetrics(): void {
    const govId = this.selectedGovForForecast === 'NATIONAL' ? undefined : this.selectedGovForForecast;
    this.forecastData.set(this.eleService.getForecast(govId, this.selectedHorizon));
    this.notifService.showToast('SCADA Actualisé', 'Télémétries des 24 gouvernorats mises à jour.', 'INFO');
  }

  onGovernorateSelected(gov: Governorate): void {
    this.selectedGovernorate.set(gov);
    this.selectedGovForForecast = gov.id;
    this.forecastData.set(this.eleService.getForecast(gov.id, this.selectedHorizon));
  }

  onForecastGovChange(govId: string): void {
    this.selectedGovForForecast = govId;
    const actualGovId = govId === 'NATIONAL' ? undefined : govId;
    this.forecastData.set(this.eleService.getForecast(actualGovId, this.selectedHorizon));
  }

  setHorizon(horizon: 'J+1' | 'J+7'): void {
    this.selectedHorizon = horizon;
    const govId = this.selectedGovForForecast === 'NATIONAL' ? undefined : this.selectedGovForForecast;
    this.forecastData.set(this.eleService.getForecast(govId, horizon));
  }

  onTempDeltaChange(val: number): void {
    this.tempDelta.set(val);
    this.eleService.updateScenario({ tempDeltaC: val });
    const govId = this.selectedGovForForecast === 'NATIONAL' ? undefined : this.selectedGovForForecast;
    this.forecastData.set(this.eleService.getForecast(govId, this.selectedHorizon));
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
    this.forecastData.set(this.eleService.getForecast(undefined, this.selectedHorizon));
    this.notifService.showToast('Scénario Réinitialisé', 'Paramètres réseau revenus à la normale.', 'INFO');
  }

  applyRecommendation(type: 'EFFACEMENT' | 'TURBINE' | 'NOTIF'): void {
    if (type === 'EFFACEMENT') {
      this.eleService.updateScenario({ industrialActivityPct: 80 });
      this.notifService.showToast('Effacement Industriel Validé', 'Ordre SCADA transmis : -120 MW délestés contractuellement.', 'SUCCESS');
    } else if (type === 'TURBINE') {
      this.notifService.showToast('Turbine à Gaz Couplée', 'Ghannouch en ligne : +200 MW injectés sur le réseau 225kV.', 'SUCCESS');
    } else if (type === 'NOTIF') {
      this.notifService.addNotification({
        title: 'Appel STEG : Vigilance Consommation',
        titleAr: 'نداء الشركة التونسية للكهرباء والغاز',
        message: 'Afin d\'éviter toute surcharge du réseau, merci de modérer votre climatisation à 26°C.',
        messageAr: 'يرجى ترشيد استهلاك المكيفات لتجنب الضغط على الشبكة.',
        type: 'WARNING',
        targetRole: 'CITOYEN'
      });
      this.notifService.showToast('Notification Diffusée', 'Message d\'écogestes envoyé à tous les citoyens.', 'SUCCESS');
    }
  }

  onIncidentSelected(outage: OutageReport): void {
    this.selectedIncident.set(outage);
  }

  assignToTech(incident: OutageReport, techName: string): void {
    this.outageService.assignTechnician(incident.id, techName);
    this.notifService.showToast('Ordre d\'Intervention Affecté', `${techName} a été mandaté sur le dossier ${incident.reference}.`, 'SUCCESS');
  }

  validateMaintenancePlanning(): void {
    this.notifService.showToast('Planning Validé', 'Le calendrier de révision trimestriel des équipements HT/MT a été validé.', 'SUCCESS');
  }

  orderImmediateMaintenance(eq: EquipmentRisk): void {
    this.notifService.showToast('Intervention Immédiate Planifiée', `Équipe spécialisée assignée à la révision de ${eq.name}.`, 'INFO');
  }

  exportDailyReport(): void {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      'Gouvernorat,Capacite_MW,Charge_Actuelle_MW,Temperature_C,Statut\n' +
      this.eleService.governorates().map(g => `${g.name},${g.capacityMw},${g.currentLoadMw},${g.temperatureC},${g.status}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rapport_Dispatching_STEG_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.notifService.showToast('Export Réussi', 'Rapport Excel CSV généré et téléchargé.', 'SUCCESS');
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

  // Digital Twin 3D State
  twinHour = signal<number>(14);
  isHeatwaveActive = signal<boolean>(false);

  // NLP Outage Extraction State
  nlpOutageText = 'تعلن الشركة التونسية للكهرباء والغاز (إقليم أريانة) عن انقطاع مبرمج للتيار الكهربائي يوم الأحد 20 أكتوبر بحي النصر 2 ونهج الهادي نويرة بأريانة من الساعة 08:00 إلى 13:00 للقيام بأشغال صيانة دورية على شبكة التوزيع.';
  extractedNlpZone = signal<{
    governorate: string;
    district: string;
    date: string;
    timeSlot: string;
    affectedHomes: number;
    reason: string;
  } | null>({
    governorate: 'Ariana (أريانة)',
    district: 'Cité Ennasr 2 (حي النصر 2)',
    date: 'Dimanche 20 Octobre 2025',
    timeSlot: '08h00 - 13h00 (5 heures)',
    affectedHomes: 1420,
    reason: 'Travaux de maintenance préventive et renforcement des câbles MT'
  });

  onTwinHourChange(h: number): void {
    this.twinHour.set(h);
    // Simuler variation de charge selon l'heure de la journée (creux la nuit, pic à 14h clim et 20h éclairage)
    let factor = 1.0;
    if (h >= 0 && h <= 5) factor = 0.65;
    else if (h >= 6 && h <= 11) factor = 0.88;
    else if (h >= 12 && h <= 16) factor = 1.15; // Pic estival climatisation
    else if (h >= 17 && h <= 21) factor = 1.22; // Pic de pointe STEG
    else factor = 0.80;

    if (this.isHeatwaveActive()) factor *= 1.18;

    this.eleService.updateAllGovernorates((govs: Governorate[]) => govs.map((g: Governorate) => ({
      ...g,
      currentLoadMw: Math.round(g.capacityMw * Math.min(0.96, (g.currentLoadMw / g.capacityMw) * (factor / 1.1)))
    })));
  }

  toggleHeatwave(): void {
    const next = !this.isHeatwaveActive();
    this.isHeatwaveActive.set(next);

    if (next) {
      this.eleService.updateScenario({ tempDeltaC: 6 });
      this.notifService.showToast(
        '🔥 Canicule +6 °C Activée !',
        'Forte hausse de la demande nationale (+18% climatisation). 4 gouvernorats passent en vigilance surcharge.',
        'WARNING',
        5000
      );
    } else {
      this.eleService.updateScenario({ tempDeltaC: 0 });
      this.notifService.showToast('Canicule Désactivée', 'Rétablissement des profils thermiques nominaux.', 'INFO');
    }
  }

  getSunCycleIcon(): string {
    const h = this.twinHour();
    if (h >= 6 && h < 9) return 'wb_twilight';
    if (h >= 9 && h < 17) return 'wb_sunny';
    if (h >= 17 && h < 20) return 'wb_twilight';
    return 'bedtime';
  }

  getSunCycleLabel(): string {
    const h = this.twinHour();
    if (h >= 0 && h < 6) return 'Nuit étoilée (Creux)';
    if (h >= 6 && h < 12) return 'Aube & Matinée (Montée)';
    if (h >= 12 && h < 17) return 'Zénith Solaire (Pic Climatisation)';
    if (h >= 17 && h < 21) return 'Pointe STEG (19h - 21h)';
    return 'Soirée (Tarif Creux)';
  }

  triggerRetrain(): void {
    this.notifService.showToast(
      'Réentraînement ML Déclenché',
      'Le pipeline LightGBM v2.5 s\'exécute avec les nouvelles données SCADA des 7 derniers jours.',
      'SUCCESS',
      4500
    );
  }

  loadSampleNlp(lang: 'AR' | 'FR'): void {
    if (lang === 'AR') {
      this.nlpOutageText = 'تعلن الشركة التونسية للكهرباء والغاز (إقليم أريانة) عن انقطاع مبرمج للتيار الكهربائي يوم الأحد 20 أكتوبر بحي النصر 2 ونهج الهادي نويرة بأريانة من الساعة 08:00 إلى 13:00 للقيام بأشغال صيانة دورية على شبكة التوزيع.';
    } else {
      this.nlpOutageText = 'Avis de coupure programmée STEG (District Tunis Ouest) : En raison de travaux de maintenance sur le réseau HTA, l\'électricité sera interrompue le Mardi 22 Octobre de 07h30 à 12h00 dans les quartiers El Menzah 9 et Cité Ennasr 1 (Gouvernorat de Tunis).';
    }
    this.runNlpExtraction();
  }

  runNlpExtraction(): void {
    const isAr = this.nlpOutageText.includes('تعلن') || this.nlpOutageText.includes('أريانة') || this.nlpOutageText.includes('الكهرباء');
    if (isAr) {
      this.extractedNlpZone.set({
        governorate: 'Ariana (أريانة)',
        district: 'Cité Ennasr 2 (حي النصر 2)',
        date: 'Dimanche 20 Octobre 2025',
        timeSlot: '08h00 - 13h00 (5 heures)',
        affectedHomes: 1420,
        reason: 'Maintenance préventive périodique réseau MT (أشغال صيانة دورية)'
      });
    } else {
      this.extractedNlpZone.set({
        governorate: 'Tunis',
        district: 'El Menzah 9 & Cité Ennasr 1',
        date: 'Mardi 22 Octobre 2025',
        timeSlot: '07h30 - 12h00 (4h30)',
        affectedHomes: 2150,
        reason: 'Remplacement de sectionneur HTA et sécurisation poste sous-station'
      });
    }
    this.notifService.showToast('NLP Exécuté avec Succès', 'Entités géographiques et temporelles extraites par le modèle IA.', 'SUCCESS');
  }

  publishScheduledOutage(): void {
    const zone = this.extractedNlpZone();
    if (!zone) return;

    this.outageService.reportOutage({
      governorate: zone.governorate.includes('Ariana') ? 'Ariana' : 'Tunis',
      district: zone.district,
      address: `Secteur ${zone.district}`,
      type: 'TRAVAUX_PROGRAMMES',
      notes: `[COUPURE PROGRAMMÉE STEG] ${zone.reason} • Prévu le ${zone.date} de ${zone.timeSlot} (~${zone.affectedHomes} abonnés).`,
      reportedBy: 'Opérateur Dispatching STEG'
    });

    this.notifService.showToast(
      'Avis Publié & Alerte Citoyens Diffusée !',
      `Zone ${zone.district} tracée sur la carte. Notifications push et SMS transmises aux ${zone.affectedHomes} foyers du secteur.`,
      'SUCCESS',
      6000
    );
  }
}
