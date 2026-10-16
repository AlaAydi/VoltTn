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
      
      <!-- En-tête Suivi Détaillé -->
      <div class="cons-header glass-card">
        <div class="badge-row">
          <span class="glass-badge badge-sky">
            <span class="material-symbols-rounded">monitoring</span>
            Compteur Télérelevé STEG
          </span>
          <span class="glass-badge badge-sun">Données au 1/4 d'heure</span>
        </div>
        <h1 class="header-title">Analyse Détaillée de ma Consommation</h1>
        <p class="header-desc">
          Comparez votre courbe de charge journalière et observez l'impact des pics de chaleur estivaux par rapport aux foyers similaires de votre région.
        </p>
      </div>

      <!-- Métriques de comparaison -->
      <div class="comparisons-grid">
        <div class="comp-card glass-card" appTilt3d [maxTilt]="8">
          <span class="comp-label">Ma Consommation ce Mois</span>
          <div class="comp-val-row">
            <span class="comp-val">{{ citizenService.consumption().monthForecastKwh }}</span>
            <span class="comp-unit">kWh</span>
          </div>
          <span class="comp-sub">Facture prévisionnelle : ~{{ citizenService.consumption().estimatedBillTnd }} DT</span>
        </div>

        <div class="comp-card glass-card" appTilt3d [maxTilt]="8">
          <span class="comp-label">Moyenne Régionale (Tunis)</span>
          <div class="comp-val-row">
            <span class="comp-val text-sky">{{ citizenService.consumption().regionalAverageKwh }}</span>
            <span class="comp-unit">kWh</span>
          </div>
          <span class="comp-sub text-nature font-bold">Vous consommez +11% (climatisations)</span>
        </div>

        <div class="comp-card glass-card" appTilt3d [maxTilt]="8">
          <span class="comp-label">Émissions CO₂ Évitées</span>
          <div class="comp-val-row">
            <span class="comp-val text-nature">{{ citizenService.consumption().co2SavedKg }}</span>
            <span class="comp-unit">kg</span>
          </div>
          <span class="comp-sub">Grâce à l'autoproduction solaire</span>
        </div>
      </div>

      <!-- Graphique 12 Mois avec Pic Estival (Juillet / Août en Tunisie) -->
      <div class="glass-card chart-section">
        <div class="chart-header">
          <div>
            <h2 class="card-title">Saisonnalité sur 12 Mois (Factures STEG)</h2>
            <p class="card-sub">Notez le pic important en juillet-août causé par les canicules tunisiennes</p>
          </div>
        </div>

        <div class="chart-container">
          <div class="months-grid-chart">
            @for (m of citizenService.consumption().monthlyHistory; track m.month) {
              <div class="month-col">
                <span class="m-val">{{ m.kwh }} <small>kWh</small></span>
                <div class="m-track">
                  <!-- Barre Moyenne Régionale (gris discret) -->
                  <div 
                    class="regional-bar" 
                    [style.height.%]="(m.regionalAverageKwh / 700) * 100"
                    title="Moyenne Régionale"
                  ></div>
                  <!-- Barre Mon Foyer -->
                  <div 
                    class="my-bar" 
                    [class.summer-peak]="m.month === 'Juil' || m.month === 'Août'"
                    [style.height.%]="(m.kwh / 700) * 100"
                    title="Ma Consommation"
                  ></div>
                </div>
                <span class="m-name">{{ m.month }}</span>
                <span class="m-cost">{{ m.costTnd | number:'1.0-0' }} DT</span>
              </div>
            }
          </div>
        </div>

        <div class="chart-legend">
          <div class="l-item"><span class="bullet sun"></span> Ma Consommation (DT calculés)</div>
          <div class="l-item"><span class="bullet coral"></span> Pic Canicule (Juillet & Août)</div>
          <div class="l-item"><span class="bullet gray"></span> Moyenne Régionale Tunis</div>
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
      font-size: 14.5px;
      color: var(--text-muted);
      max-width: 680px;
    }

    .comparisons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
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
    }

    .chart-container {
      height: 280px;
      margin: 24px 0 16px 0;
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
  `]
})
export class ConsumptionComponent {
  citizenService = inject(CitizenService);
}
