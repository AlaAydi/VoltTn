import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CitizenService } from '../../../core/services/citizen.service';
import { Tilt3dDirective } from '../../../shared/directives/tilt-3d.directive';

@Component({
  selector: 'app-consumption',
  standalone: true,
  imports: [CommonModule, Tilt3dDirective],
  template: `
    <div class="consumption-page">
      
      <!-- En-tête Suivi Détaillé & Télérelevé STEG -->
      <div class="cons-header glass-card animate-float">
        <div class="badge-row">
          <span class="glass-badge badge-sky">
            <span class="material-symbols-rounded">monitoring</span>
            Compteur Télérelevé STEG N° {{ citizenService.consumption().meterId }}
          </span>
          <span class="glass-badge badge-sun">Données Quart-Horaires</span>
          <span class="glass-badge badge-nature">Tarif Basse Tension Bleu</span>
        </div>
        <h1 class="header-title">Analyse Détaillée de ma Consommation Électrique</h1>
        <p class="header-desc">
          Suivez votre consommation par heure, par jour et sur 12 mois. Comparez votre profil avec la moyenne des foyers similaires de votre gouvernorat et visualisez l'estimation détaillée de votre facture en Dinars Tunisiens (DT).
        </p>
      </div>

      <!-- Métriques de comparaison et KPIs -->
      <div class="comparisons-grid">
        <div class="comp-card glass-card" appTilt3d [maxTilt]="8">
          <span class="comp-label">Ma Consommation ce Mois (Projetée)</span>
          <div class="comp-val-row">
            <span class="comp-val">{{ citizenService.consumption().monthForecastKwh }}</span>
            <span class="comp-unit">kWh</span>
          </div>
          <span class="comp-sub">Facture prévisionnelle : <strong>~{{ citizenService.consumption().estimatedBillTnd }} DT</strong></span>
        </div>

        <div class="comp-card glass-card" appTilt3d [maxTilt]="8">
          <span class="comp-label">Moyenne Régionale (Foyers Similaires)</span>
          <div class="comp-val-row">
            <span class="comp-val text-sky">{{ citizenService.consumption().regionalAverageKwh }}</span>
            <span class="comp-unit">kWh</span>
          </div>
          <span class="comp-sub text-nature font-bold">Écart : +11% (climatisations estivales)</span>
        </div>

        <div class="comp-card glass-card" appTilt3d [maxTilt]="8">
          <span class="comp-label">Émissions CO₂ Évitées</span>
          <div class="comp-val-row">
            <span class="comp-val text-nature">{{ citizenService.consumption().co2SavedKg }}</span>
            <span class="comp-unit">kg CO₂</span>
          </div>
          <span class="comp-sub">Grâce à l'autoproduction solaire (24%)</span>
        </div>

        <div class="comp-card glass-card" appTilt3d [maxTilt]="8">
          <span class="comp-label">Coût Journalier Moyen</span>
          <div class="comp-val-row">
            <span class="comp-val text-sun">{{ (citizenService.consumption().todayKwh * 0.338) | number:'1.2-2' }}</span>
            <span class="comp-unit">DT / jour</span>
          </div>
          <span class="comp-sub">Soit ~{{ (citizenService.consumption().todayKwh) }} kWh consommés</span>
        </div>
      </div>

      <!-- Graphique Interactif avec Onglets Heure, Jour, Mois -->
      <div class="glass-card chart-section">
        <div class="chart-header">
          <div>
            <h2 class="card-title">Courbes de Charge & Comparaison Temporelle</h2>
            <p class="card-sub">Visualisez les pics de demande et comparez avec la période précédente</p>
          </div>

          <div class="chart-tabs">
            <button 
              class="tab-btn" 
              [class.active]="viewMode() === 'hourly'"
              (click)="viewMode.set('hourly')"
            >
              Par Heure (Aujourd'hui)
            </button>
            <button 
              class="tab-btn" 
              [class.active]="viewMode() === 'daily'"
              (click)="viewMode.set('daily')"
            >
              7 Derniers Jours (vs Semaine Préc.)
            </button>
            <button 
              class="tab-btn" 
              [class.active]="viewMode() === 'monthly'"
              (click)="viewMode.set('monthly')"
            >
              12 Mois (Factures STEG & Canicule)
            </button>
          </div>
        </div>

        <div class="chart-container">
          @if (viewMode() === 'hourly') {
            <div class="months-grid-chart">
              @for (h of citizenService.consumption().hourlyHistory; track h.hour) {
                <div class="month-col">
                  <span class="m-val">{{ h.kwh }} <small>kWh</small></span>
                  <div class="m-track">
                    <div 
                      class="my-bar" 
                      [class.summer-peak]="h.isPeak"
                      [style.height.%]="(h.kwh / 3.5) * 100"
                      [title]="h.hour + ' : ' + h.kwh + ' kWh (~' + h.costTnd + ' DT)'"
                    ></div>
                  </div>
                  <span class="m-name">{{ h.hour }}</span>
                  <span class="m-cost">{{ h.costTnd | number:'1.2-2' }} DT</span>
                </div>
              }
            </div>
          } @else if (viewMode() === 'daily') {
            <div class="months-grid-chart">
              @for (d of citizenService.consumption().dailyHistory; track d.date) {
                <div class="month-col">
                  <span class="m-val">{{ d.kwh }} <small>kWh</small></span>
                  <div class="m-track">
                    <!-- Barre semaine précédente -->
                    <div 
                      class="regional-bar" 
                      [style.height.%]="(d.previousWeekKwh / 22) * 100"
                      [title]="'Semaine précédente : ' + d.previousWeekKwh + ' kWh'"
                    ></div>
                    <!-- Barre actuelle -->
                    <div 
                      class="my-bar" 
                      [style.height.%]="(d.kwh / 22) * 100"
                      [title]="d.dayName + ' ' + d.date + ' : ' + d.kwh + ' kWh'"
                    ></div>
                  </div>
                  <span class="m-name">{{ d.dayName }}</span>
                  <span class="m-cost">{{ d.costTnd | number:'1.1-1' }} DT</span>
                </div>
              }
            </div>
          } @else {
            <div class="months-grid-chart">
              @for (m of citizenService.consumption().monthlyHistory; track m.month) {
                <div class="month-col">
                  <span class="m-val">{{ m.kwh }} <small>kWh</small></span>
                  <div class="m-track">
                    <!-- Barre Moyenne Régionale -->
                    <div 
                      class="regional-bar" 
                      [style.height.%]="(m.regionalAverageKwh / 700) * 100"
                      [title]="'Moyenne Régionale : ' + m.regionalAverageKwh + ' kWh'"
                    ></div>
                    <!-- Barre Mon Foyer -->
                    <div 
                      class="my-bar" 
                      [class.summer-peak]="m.month === 'Juil' || m.month === 'Août'"
                      [style.height.%]="(m.kwh / 700) * 100"
                      [title]="m.month + ' : ' + m.kwh + ' kWh'"
                    ></div>
                  </div>
                  <span class="m-name">{{ m.month }}</span>
                  <span class="m-cost">{{ m.costTnd | number:'1.0-0' }} DT</span>
                </div>
              }
            </div>
          }
        </div>

        <div class="chart-legend">
          <div class="l-item"><span class="bullet sun"></span> Ma Consommation Réelle</div>
          @if (viewMode() === 'monthly') {
            <div class="l-item"><span class="bullet coral"></span> Pic Canicule Estivale (Juillet/Août en Tunisie)</div>
            <div class="l-item"><span class="bullet gray"></span> Moyenne Régionale des Foyers Similaires</div>
          } @else if (viewMode() === 'daily') {
            <div class="l-item"><span class="bullet gray"></span> Même Jour de la Semaine Précédente</div>
          } @else {
            <div class="l-item"><span class="bullet coral"></span> Heure Pleine (19h - 22h)</div>
          }
        </div>
      </div>

      <!-- Décomposition & Estimation de la Facture STEG -->
      <div class="bill-breakdown-card glass-card">
        <div class="bill-header">
          <div>
            <h2 class="card-title">Décomposition de la Facture Estimée (Tranches STEG)</h2>
            <p class="card-sub">Application des tarifs réglementaires de la STEG pour l'électricité basse tension</p>
          </div>
          <div class="bill-total-badge">
            <span class="b-lbl">Total Estimé :</span>
            <span class="b-val">{{ citizenService.consumption().estimatedBillTnd | number:'1.2-2' }} DT</span>
          </div>
        </div>

        <div class="bill-tiers-grid">
          <div class="tier-box glass-panel">
            <div class="t-top">
              <span class="t-title">Tranche 1 (0 - 50 kWh)</span>
              <span class="t-rate">0.181 DT / kWh</span>
            </div>
            <span class="t-conso">50 kWh consommés</span>
            <strong class="t-cost">9.05 DT</strong>
          </div>

          <div class="tier-box glass-panel">
            <div class="t-top">
              <span class="t-title">Tranche 2 (51 - 100 kWh)</span>
              <span class="t-rate">0.223 DT / kWh</span>
            </div>
            <span class="t-conso">50 kWh consommés</span>
            <strong class="t-cost">11.15 DT</strong>
          </div>

          <div class="tier-box glass-panel">
            <div class="t-top">
              <span class="t-title">Tranche 3 (101 - 200 kWh)</span>
              <span class="t-rate">0.338 DT / kWh</span>
            </div>
            <span class="t-conso">100 kWh consommés</span>
            <strong class="t-cost">33.80 DT</strong>
          </div>

          <div class="tier-box glass-panel">
            <div class="t-top">
              <span class="t-title">Tranche 4 (&gt; 200 kWh)</span>
              <span class="t-rate">0.410 DT / kWh</span>
            </div>
            <span class="t-conso">230 kWh (climatisation)</span>
            <strong class="t-cost text-coral">94.30 DT</strong>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .consumption-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 50px;
    }

    .cons-header {
      padding: 26px 30px;
      border-radius: var(--radius-xl);
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
      font-size: 14.5px;
      color: var(--text-muted);
      max-width: 720px;
    }

    .comparisons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 18px;
    }

    .comp-card {
      padding: 22px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .comp-label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 700;
    }

    .comp-val-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .comp-val {
      font-family: var(--font-title);
      font-size: 28px;
      font-weight: 900;
      color: var(--text-main);
    }

    .comp-unit {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-light);
    }

    .comp-sub {
      font-size: 12px;
      color: var(--text-light);
    }

    /* Chart */
    .chart-section {
      padding: 26px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .chart-tabs {
      display: flex;
      background: rgba(29, 53, 87, 0.06);
      padding: 4px;
      border-radius: var(--radius-full);
      gap: 4px;
    }

    .tab-btn {
      padding: 6px 14px;
      border-radius: var(--radius-full);
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all var(--transition-fast);

      &.active {
        background: #FFFFFF;
        color: var(--text-main);
        box-shadow: var(--shadow-sm);
      }
    }

    .chart-container {
      height: 280px;
      margin: 16px 0;
    }

    .months-grid-chart {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: flex-end;
      gap: 12px;
    }

    .month-col {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }

    .m-val {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-main);
      small { font-size: 9px; color: var(--text-light); }
    }

    .m-track {
      position: relative;
      width: 100%;
      max-width: 44px;
      height: 200px;
      background: rgba(29, 53, 87, 0.04);
      border-radius: var(--radius-xs);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      overflow: hidden;
    }

    .regional-bar {
      position: absolute;
      left: 10%;
      right: 10%;
      bottom: 0;
      background: rgba(29, 53, 87, 0.12);
      border-radius: var(--radius-xs) var(--radius-xs) 0 0;
    }

    .my-bar {
      position: absolute;
      left: 25%;
      right: 25%;
      bottom: 0;
      background: var(--sun-gradient);
      border-radius: var(--radius-xs) var(--radius-xs) 0 0;
      transition: height 0.4s ease-out;

      &.summer-peak {
        background: linear-gradient(to top, #FB8500, #FF6B6B);
        box-shadow: 0 0 12px rgba(255, 107, 107, 0.45);
      }
    }

    .m-name {
      font-size: 12px;
      font-weight: 800;
      color: var(--text-main);
    }

    .m-cost {
      font-size: 10.5px;
      color: var(--sun-amber);
      font-weight: 700;
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 20px;
      padding-top: 14px;
      border-top: 1px solid rgba(29, 53, 87, 0.08);
      font-size: 12px;
      font-weight: 600;
      flex-wrap: wrap;
    }

    .l-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .bullet {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      &.sun { background: var(--sun-gold); }
      &.coral { background: var(--alert-coral); }
      &.gray { background: rgba(29, 53, 87, 0.2); }
    }

    /* Bill Breakdown */
    .bill-breakdown-card {
      padding: 26px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .bill-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .bill-total-badge {
      display: flex;
      align-items: baseline;
      gap: 8px;
      padding: 8px 18px;
      border-radius: var(--radius-full);
      background: var(--sun-light);
      border: 1px solid var(--sun-gold);
      .b-lbl { font-size: 12px; color: var(--text-muted); font-weight: 700; }
      .b-val { font-size: 20px; font-weight: 900; color: #A35C00; }
    }

    .bill-tiers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
    }

    .tier-box {
      padding: 16px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .t-top {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      .t-title { font-weight: 800; color: var(--text-main); }
      .t-rate { color: var(--text-light); }
    }

    .t-conso { font-size: 12px; color: var(--text-muted); }
    .t-cost { font-size: 16px; font-weight: 900; color: var(--sun-amber); margin-top: 4px; }
  `]
})
export class ConsumptionComponent {
  citizenService = inject(CitizenService);
  viewMode = signal<'hourly' | 'daily' | 'monthly'>('monthly');
}
