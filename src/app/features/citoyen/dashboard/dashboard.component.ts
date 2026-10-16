import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CitizenService } from '../../../core/services/citizen.service';
import { AuthService } from '../../../core/services/auth.service';
import { Meter3dComponent } from '../../../shared/components/meter-3d/meter-3d.component';
import { Tilt3dDirective } from '../../../shared/directives/tilt-3d.directive';

@Component({
  selector: 'app-citoyen-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, Meter3dComponent, Tilt3dDirective],
  template: `
    <div class="dashboard-page">
      
      <!-- Bannière d'accueil chaleureuse et lumineuse -->
      <div class="welcome-banner glass-card animate-float">
        <div class="banner-content">
          <div class="badge-row">
            <span class="glass-badge badge-sun">
              <span class="material-symbols-rounded">wb_sunny</span>
              Compteur Connecté STEG
            </span>
            <span class="glass-badge badge-nature">Tarif Creux Actif</span>
          </div>
          <h1 class="welcome-title">
            Bonjour, {{ authService.currentUser()?.name }} !
          </h1>
          <p class="welcome-desc">
            Votre foyer consomme en direct <strong class="highlight-val">{{ citizenService.currentPowerKw() }} kW</strong>. 
            Votre production solaire a couvert <strong class="highlight-nature">24%</strong> de vos besoins ce mois-ci.
          </p>
        </div>
        <div class="banner-actions">
          <a routerLink="/solar" class="btn-primary">
            <span class="material-symbols-rounded">solar_power</span>
            <span>Optimiser mon Solaire</span>
          </a>
          <a routerLink="/citoyen/report-outage" class="btn-secondary">
            <span class="material-symbols-rounded">report_problem</span>
            <span>Signaler Panne</span>
          </a>
        </div>
      </div>

      <!-- Alerte bienveillante de pic de consommation -->
      <div class="alert-banner glass-card">
        <div class="alert-icon-box">
          <span class="material-symbols-rounded">energy_savings_leaf</span>
        </div>
        <div class="alert-text">
          <div class="alert-heading">Recommandation Aube & Canicule</div>
          <div class="alert-body">
            Forte chaleur prévue cet après-midi sur le Grand Tunis (34°C). 
            Réglez vos climatiseurs sur 26°C pour économiser jusqu'à <strong>45 DT</strong> sur votre prochaine facture.
          </div>
        </div>
        <a routerLink="/citoyen/tips" class="btn-sky">
          <span class="material-symbols-rounded">arrow_forward</span>
          <span>Voir les astuces</span>
        </a>
      </div>

      <!-- Grille Principale : Compteur 3D + Chiffres Clés -->
      <div class="main-grid">
        
        <!-- Carte Compteur 3D Interactif (Three.js) -->
        <div class="glass-card meter-card" appTilt3d [maxTilt]="6">
          <div class="card-header">
            <div>
              <h2 class="card-title">Compteur Intelligent 3D</h2>
              <span class="card-sub">N° {{ citizenService.consumption().meterId }}</span>
            </div>
            <span class="live-pulse-badge">
              <span class="dot"></span>
              Flux temps réel
            </span>
          </div>

          <!-- Composant Three.js -->
          <app-meter-3d 
            [powerKw]="citizenService.currentPowerKw()"
            [todayKwh]="citizenService.consumption().todayKwh"
          ></app-meter-3d>

          <div class="meter-footer-metrics">
            <div class="f-metric">
              <span class="label">Aujourd'hui</span>
              <span class="value">{{ citizenService.consumption().todayKwh }} kWh</span>
            </div>
            <div class="f-metric">
              <span class="label">Coût du jour</span>
              <span class="value">{{ (citizenService.consumption().todayKwh * 0.338) | number:'1.2-2' }} DT</span>
            </div>
            <div class="f-metric">
              <span class="label">CO₂ Évité</span>
              <span class="value text-nature">{{ citizenService.consumption().co2SavedKg }} kg</span>
            </div>
          </div>
        </div>

        <!-- 3 Cartes Métriques Clés avec perspective 3D -->
        <div class="stats-column">
          
          <div class="stat-card glass-card" appTilt3d [maxTilt]="8">
            <div class="stat-icon-wrapper sun">
              <span class="material-symbols-rounded">receipt_long</span>
            </div>
            <div class="stat-info">
              <span class="stat-label">Facture Estimée (Mois en cours)</span>
              <div class="stat-value-row">
                <span class="stat-value">{{ citizenService.consumption().estimatedBillTnd | number:'1.1-1' }}</span>
                <span class="stat-unit">DT</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill sun" style="width: 58%;"></div>
              </div>
              <span class="stat-trend trend-good">
                <span class="material-symbols-rounded">trending_down</span>
                -8% par rapport au mois dernier
              </span>
            </div>
          </div>

          <div class="stat-card glass-card" appTilt3d [maxTilt]="8">
            <div class="stat-icon-wrapper sky">
              <span class="material-symbols-rounded">query_stats</span>
            </div>
            <div class="stat-info">
              <span class="stat-label">Prévision de Fin de Mois</span>
              <div class="stat-value-row">
                <span class="stat-value">{{ citizenService.consumption().monthForecastKwh }}</span>
                <span class="stat-unit">kWh</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill sky" style="width: 72%;"></div>
              </div>
              <span class="stat-trend">
                Moyenne régionale : {{ citizenService.consumption().regionalAverageKwh }} kWh
              </span>
            </div>
          </div>

          <div class="stat-card glass-card" appTilt3d [maxTilt]="8">
            <div class="stat-icon-wrapper nature">
              <span class="material-symbols-rounded">eco</span>
            </div>
            <div class="stat-info">
              <span class="stat-label">Autoconsommation Solaire</span>
              <div class="stat-value-row">
                <span class="stat-value">{{ citizenService.consumption().solarPercentage }}</span>
                <span class="stat-unit">%</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill nature" style="width: 24%;"></div>
              </div>
              <span class="stat-trend trend-good">
                <span class="material-symbols-rounded">trending_up</span>
                Objectif 40% réalisable avec kit toiture
              </span>
            </div>
          </div>

        </div>

      </div>

      <!-- Graphique de suivi (Onglets Heure, Jour, Mois avec pic estival tunisien) -->
      <div class="glass-card chart-card">
        <div class="chart-header">
          <div>
            <h2 class="card-title">Historique & Tendance de Consommation</h2>
            <p class="card-sub">Visualisez vos pics journaliers et la saisonnalité estivale (juillet-août)</p>
          </div>
          <div class="chart-tabs">
            <button 
              class="tab-btn" 
              [class.active]="selectedTab() === 'hourly'"
              (click)="selectedTab.set('hourly')"
            >
              Aujourd'hui (Heures)
            </button>
            <button 
              class="tab-btn" 
              [class.active]="selectedTab() === 'daily'"
              (click)="selectedTab.set('daily')"
            >
              7 Derniers Jours
            </button>
            <button 
              class="tab-btn" 
              [class.active]="selectedTab() === 'monthly'"
              (click)="selectedTab.set('monthly')"
            >
              12 Mois (Pic Événementiel)
            </button>
          </div>
        </div>

        <!-- Rendu dynamique du graphique selon l'onglet -->
        <div class="chart-visual">
          @if (selectedTab() === 'hourly') {
            <div class="bars-container">
              @for (h of citizenService.consumption().hourlyHistory; track h.hour) {
                <div class="bar-col">
                  <div class="bar-val">{{ h.kwh }}</div>
                  <div class="bar-track">
                    <div 
                      class="bar-fill" 
                      [class.peak]="h.isPeak"
                      [style.height.%]="(h.kwh / 3.5) * 100"
                    ></div>
                  </div>
                  <span class="bar-label">{{ h.hour }}</span>
                </div>
              }
            </div>
          } @else if (selectedTab() === 'daily') {
            <div class="bars-container">
              @for (d of citizenService.consumption().dailyHistory; track d.date) {
                <div class="bar-col">
                  <div class="bar-val">{{ d.kwh }} kWh</div>
                  <div class="bar-track">
                    <div 
                      class="bar-fill sky" 
                      [style.height.%]="(d.kwh / 22) * 100"
                    ></div>
                  </div>
                  <span class="bar-label">{{ d.dayName }}</span>
                </div>
              }
            </div>
          } @else {
            <div class="bars-container">
              @for (m of citizenService.consumption().monthlyHistory; track m.month) {
                <div class="bar-col">
                  <div class="bar-val">{{ m.kwh }}</div>
                  <div class="bar-track">
                    <div 
                      class="bar-fill" 
                      [class.peak-summer]="m.month === 'Juil' || m.month === 'Août'"
                      [style.height.%]="(m.kwh / 700) * 100"
                    ></div>
                  </div>
                  <span class="bar-label">{{ m.month }}</span>
                </div>
              }
            </div>
          }
        </div>

        <div class="chart-legend-row">
          <div class="legend-item">
            <span class="bullet sun"></span>
            <span>Tarif Standard</span>
          </div>
          <div class="legend-item">
            <span class="bullet coral"></span>
            <span>Heures Pleines / Pic Estival Canicule</span>
          </div>
          <div class="legend-item">
            <span class="bullet sky"></span>
            <span>Consommation de Référence</span>
          </div>
        </div>
      </div>

      <!-- Conseils personnalisés d'économie d'énergie -->
      <div class="tips-section">
        <div class="section-header">
          <div>
            <h2 class="card-title">Conseils Économies d'Énergie Spécial Tunisie</h2>
            <p class="card-sub">Des gestes simples adaptés à nos habitudes pour réduire la facture STEG</p>
          </div>
          <a routerLink="/citoyen/tips" class="btn-secondary">
            <span>Tous les conseils</span>
            <span class="material-symbols-rounded">arrow_forward</span>
          </a>
        </div>

        <div class="tips-grid">
          @for (tip of citizenService.tips(); track tip.id) {
            <div class="tip-card glass-card" appTilt3d [maxTilt]="8">
              <div class="tip-header">
                <div class="tip-icon-box">
                  <span class="material-symbols-rounded">{{ tip.icon }}</span>
                </div>
                <div class="savings-badge">
                  Jusqu'à -{{ tip.savingsTndPerMonth }} DT / mois
                </div>
              </div>
              <h3 class="tip-title">{{ tip.title }}</h3>
              <p class="tip-desc">{{ tip.description }}</p>
              <div class="tip-footer">
                <span class="glass-badge badge-nature">{{ tip.difficulty }}</span>
                <button class="btn-link">Appliquer</button>
              </div>
            </div>
          }
        </div>
      </div>

    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 40px;
    }

    /* Welcome Banner */
    .welcome-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 28px 32px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 246, 233, 0.88) 100%);
      border: 1px solid rgba(255, 183, 3, 0.35);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
    }

    .badge-row {
      display: flex;
      gap: 10px;
      margin-bottom: 12px;
    }

    .welcome-title {
      font-size: 28px;
      font-weight: 900;
      color: var(--text-main);
      margin-bottom: 8px;
    }

    .welcome-desc {
      font-size: 15px;
      color: var(--text-muted);
      max-width: 650px;
      line-height: 1.5;
    }

    .highlight-val {
      color: var(--sun-amber);
      font-weight: 800;
    }

    .highlight-nature {
      color: var(--nature-green);
      font-weight: 800;
    }

    .banner-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex-shrink: 0;
    }

    /* Alert Banner */
    .alert-banner {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 16px 24px;
      background: linear-gradient(135deg, #FFF9E6 0%, #FFF3D6 100%);
      border: 1px solid rgba(251, 133, 0, 0.3);
      border-radius: var(--radius-lg);
    }

    .alert-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--sun-gradient);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(251, 133, 0, 0.3);
      flex-shrink: 0;
    }

    .alert-text {
      flex: 1;
    }

    .alert-heading {
      font-weight: 800;
      font-size: 15px;
      color: var(--text-main);
      margin-bottom: 2px;
    }

    .alert-body {
      font-size: 13.5px;
      color: var(--text-muted);
    }

    /* Main Grid */
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 24px;
    }

    .meter-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .card-title {
      font-size: 20px;
      font-weight: 800;
      color: var(--text-main);
    }

    .card-sub {
      font-size: 13px;
      color: var(--text-light);
    }

    .live-pulse-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: var(--radius-full);
      background: rgba(255, 183, 3, 0.15);
      color: #A35C00;
      font-size: 12px;
      font-weight: 800;

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--sun-amber);
        animation: pulseGlow 1.8s infinite;
      }
    }

    .meter-footer-metrics {
      display: flex;
      justify-content: space-around;
      padding-top: 18px;
      border-top: 1px solid rgba(29, 53, 87, 0.08);
      margin-top: 14px;
    }

    .f-metric {
      display: flex;
      flex-direction: column;
      align-items: center;
      .label {
        font-size: 12px;
        color: var(--text-light);
      }
      .value {
        font-size: 18px;
        font-weight: 800;
        color: var(--text-main);
      }
      .text-nature { color: var(--nature-green); }
    }

    /* Stats Column */
    .stats-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      border-radius: var(--radius-lg);
    }

    .stat-icon-wrapper {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      flex-shrink: 0;

      &.sun { background: var(--sun-gradient); box-shadow: 0 6px 16px rgba(251, 133, 0, 0.35); }
      &.sky { background: var(--sky-gradient); box-shadow: 0 6px 16px rgba(76, 201, 240, 0.35); }
      &.nature { background: var(--nature-gradient); box-shadow: 0 6px 16px rgba(82, 183, 136, 0.35); }
    }

    .stat-info {
      flex: 1;
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 700;
    }

    .stat-value-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin: 2px 0 6px 0;
    }

    .stat-value {
      font-family: var(--font-title);
      font-size: 24px;
      font-weight: 900;
      color: var(--text-main);
    }

    .stat-unit {
      font-size: 14px;
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
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: var(--radius-full);
      &.sun { background: var(--sun-gradient); }
      &.sky { background: var(--sky-gradient); }
      &.nature { background: var(--nature-gradient); }
    }

    .stat-trend {
      font-size: 11px;
      color: var(--text-light);
      display: flex;
      align-items: center;
      gap: 4px;

      &.trend-good {
        color: var(--nature-green);
        font-weight: 700;
      }
      .material-symbols-rounded { font-size: 15px; }
    }

    /* Chart Card */
    .chart-card {
      padding: 24px;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .chart-tabs {
      display: flex;
      gap: 6px;
      background: rgba(255, 255, 255, 0.7);
      padding: 4px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(29, 53, 87, 0.08);
    }

    .tab-btn {
      padding: 8px 16px;
      border-radius: var(--radius-full);
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover { color: var(--text-main); }
      &.active {
        background: var(--sun-gradient);
        color: #FFFFFF;
        box-shadow: 0 2px 8px rgba(251, 133, 0, 0.3);
      }
    }

    .chart-visual {
      height: 220px;
      margin-bottom: 16px;
      display: flex;
      align-items: flex-end;
    }

    .bars-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 8px;
    }

    .bar-col {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }

    .bar-val {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
    }

    .bar-track {
      width: 100%;
      max-width: 42px;
      height: 160px;
      background: rgba(29, 53, 87, 0.05);
      border-radius: var(--radius-xs);
      display: flex;
      align-items: flex-end;
      overflow: hidden;
    }

    .bar-fill {
      width: 100%;
      background: var(--sun-gradient);
      border-radius: var(--radius-xs) var(--radius-xs) 0 0;
      transition: height 0.4s ease-out;

      &.peak { background: var(--alert-coral); }
      &.sky { background: var(--sky-gradient); }
      &.peak-summer {
        background: linear-gradient(to top, #FB8500, #FF6B6B);
        box-shadow: 0 0 10px rgba(255, 107, 107, 0.4);
      }
    }

    .bar-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-light);
    }

    .chart-legend-row {
      display: flex;
      gap: 18px;
      justify-content: center;
      padding-top: 12px;
      border-top: 1px solid rgba(29, 53, 87, 0.08);
      font-size: 12px;
      font-weight: 600;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      .bullet {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        &.sun { background: var(--sun-gold); }
        &.coral { background: var(--alert-coral); }
        &.sky { background: var(--sky-blue); }
      }
    }

    /* Tips Section */
    .tips-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .tips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 18px;
    }

    .tip-card {
      padding: 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 12px;
      border-radius: var(--radius-lg);
    }

    .tip-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .tip-icon-box {
      width: 42px;
      height: 42px;
      border-radius: var(--radius-sm);
      background: var(--sun-light);
      color: #A35C00;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .savings-badge {
      font-size: 12px;
      font-weight: 800;
      color: var(--nature-green);
      background: var(--nature-light);
      padding: 4px 10px;
      border-radius: var(--radius-full);
    }

    .tip-title {
      font-size: 16px;
      font-weight: 800;
      color: var(--text-main);
    }

    .tip-desc {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.4;
      flex: 1;
    }

    .tip-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
      border-top: 1px solid rgba(29, 53, 87, 0.08);
    }

    .btn-link {
      background: none;
      border: none;
      color: var(--sky-ocean);
      font-weight: 700;
      cursor: pointer;
      font-size: 13px;
      &:hover { text-decoration: underline; }
    }

    @media (max-width: 1024px) {
      .main-grid { grid-template-columns: 1fr; }
      .welcome-banner { flex-direction: column; align-items: flex-start; gap: 16px; }
      .banner-actions { flex-direction: row; }
    }
  `]
})
export class CitoyenDashboardComponent {
  citizenService = inject(CitizenService);
  authService = inject(AuthService);

  selectedTab = signal<'hourly' | 'daily' | 'monthly'>('monthly');
}
