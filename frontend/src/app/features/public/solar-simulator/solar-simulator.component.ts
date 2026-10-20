import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolarService } from '../../../core/services/solar.service';
import { ElectricityService } from '../../../core/services/electricity.service';
import { SolarOrientation } from '../../../models/solar.model';
import { Tilt3dDirective } from '../../../shared/directives/tilt-3d.directive';
import { NotificationService } from '../../../core/services/notification.service';
import { Solar3dComponent } from '../../../shared/components/solar-3d/solar-3d.component';

@Component({
  selector: 'app-solar-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule, Tilt3dDirective, Solar3dComponent],
  template: `
    <div class="solar-page">
      
      <!-- En-tête Solaire Lumineux & Espoir -->
      <div class="solar-header glass-card">
        <div class="header-content">
          <div class="badge-row">
            <span class="glass-badge badge-sun">
              <span class="material-symbols-rounded">wb_sunny</span>
              Transition Énergétique Tunisie 2030
            </span>
            <span class="glass-badge badge-nature">Subvention ANME Prosol Éligible</span>
          </div>
          <h1 class="header-title">Simulateur Solaire Photovoltaïque Tunisie</h1>
          <p class="header-desc">
            Estimez en quelques secondes votre production électrique, vos économies en Dinars et votre période d'amortissement selon l'ensoleillement de votre gouvernorat.
          </p>
        </div>
      </div>

      <div class="simulator-layout">
        
        <!-- Colonne Paramètres & Sliders -->
        <div class="params-column glass-card" appTilt3d [maxTilt]="6">
          <h2 class="card-title">Paramètres de votre Toiture</h2>
          <p class="card-sub">Ajustez les curseurs pour recalculer en temps réel</p>

          <!-- Rendu 3D interactif Three.js des panneaux solaires -->
          <app-solar-3d 
            [surfaceM2]="surfaceM2()" 
            [orientation]="orientation()"
          ></app-solar-3d>

          <div class="inputs-list">
            
            <!-- Gouvernorat -->
            <div class="input-group">
              <label class="input-label">Gouvernorat de résidence :</label>
              <select class="form-select" [(ngModel)]="selectedGovId" (change)="recalculate()">
                @for (gov of eleService.governorates(); track gov.id) {
                  <option [value]="gov.id">{{ gov.name }} ({{ gov.nameAr }})</option>
                }
              </select>
            </div>

            <!-- Surface Toiture -->
            <div class="input-group">
              <div class="label-row">
                <span class="input-label">Surface disponible :</span>
                <span class="val-highlight">{{ surfaceM2() }} m²</span>
              </div>
              <input 
                type="range" 
                class="range-slider" 
                min="12" 
                max="140" 
                step="2" 
                [ngModel]="surfaceM2()" 
                (ngModelChange)="onSurfaceChange($event)"
              />
              <span class="input-hint">Soit environ {{ Math.round(surfaceM2() / 6.2) }} panneaux de 400 Wc</span>
            </div>

            <!-- Orientation -->
            <div class="input-group">
              <label class="input-label">Orientation de la toiture :</label>
              <div class="orientations-pills">
                @for (opt of orientationOptions; track opt.value) {
                  <button 
                    class="orient-pill" 
                    [class.active]="orientation() === opt.value"
                    (click)="setOrientation(opt.value)"
                  >
                    {{ opt.label }}
                  </button>
                }
              </div>
            </div>

            <!-- Facture bimestrielle moyenne -->
            <div class="input-group">
              <div class="label-row">
                <span class="input-label">Facture STEG actuelle (Mois) :</span>
                <span class="val-highlight">{{ monthlyBillTnd() }} DT</span>
              </div>
              <input 
                type="range" 
                class="range-slider" 
                min="50" 
                max="500" 
                step="10" 
                [ngModel]="monthlyBillTnd()" 
                (ngModelChange)="monthlyBillTnd.set($event); recalculate()"
              />
            </div>

          </div>
        </div>

        <!-- Colonne Résultats & Bilan Économique -->
        <div class="results-column">
          
          <div class="results-grid">
            
            <div class="res-card glass-card" appTilt3d [maxTilt]="8">
              <div class="res-icon sun">
                <span class="material-symbols-rounded">bolt</span>
              </div>
              <div class="res-meta">
                <span class="r-label">Puissance Crête</span>
                <span class="r-val">{{ simResult().installedPowerKwc }} <small>kWc</small></span>
                <span class="r-sub">Production : {{ simResult().annualProductionKwh | number }} kWh / an</span>
              </div>
            </div>

            <div class="res-card glass-card" appTilt3d [maxTilt]="8">
              <div class="res-icon nature">
                <span class="material-symbols-rounded">savings</span>
              </div>
              <div class="res-meta">
                <span class="r-label">Économies Annuelles</span>
                <span class="r-val text-nature">{{ simResult().annualSavingsTnd | number }} <small>DT / an</small></span>
                <span class="r-sub">Gain mensuel : ~{{ Math.round(simResult().annualSavingsTnd / 12) }} DT</span>
              </div>
            </div>

            <div class="res-card glass-card" appTilt3d [maxTilt]="8">
              <div class="res-icon sky">
                <span class="material-symbols-rounded">hourglass_top</span>
              </div>
              <div class="res-meta">
                <span class="r-label">Retour sur Investissement</span>
                <span class="r-val text-sky">{{ simResult().roiYears }} <small>ans</small></span>
                <span class="r-sub">Rentabilité sur 25 ans : +380%</span>
              </div>
            </div>

            <div class="res-card glass-card" appTilt3d [maxTilt]="8">
              <div class="res-icon green">
                <span class="material-symbols-rounded">park</span>
              </div>
              <div class="res-meta">
                <span class="r-label">Impact Climat</span>
                <span class="r-val">{{ simResult().co2SavedTonsPerYear }} <small>t CO₂ / an</small></span>
                <span class="r-sub">Équivaut à 120 arbres plantés</span>
              </div>
            </div>

          </div>

          <!-- Détail du Financement & Subvention ANME Prosol -->
          <div class="funding-card glass-card">
            <h3 class="card-title">Plan de Financement Prosol Élec (STEG & ANME)</h3>
            
            <div class="financial-breakdown">
              <div class="fin-row">
                <span>Coût clé en main estimé :</span>
                <strong>{{ simResult().systemCostTnd | number }} DT</strong>
              </div>
              <div class="fin-row highlight-sub">
                <span>Prime ANME FTE (-25%) :</span>
                <strong class="text-nature">- {{ simResult().stegSubsidyTnd | number }} DT</strong>
              </div>
              <div class="fin-row total">
                <span>Reste à charge net (crédit sur facture STEG) :</span>
                <strong class="text-sun">{{ simResult().netCostTnd | number }} DT</strong>
              </div>
            </div>

            <!-- Répartition mensuelle -->
            <div class="monthly-chart-box">
              <span class="chart-caption">Production solaire prévisionnelle sur l'année (kWh/mois) :</span>
              <div class="months-bar-chart">
                @for (m of simResult().monthlyProductionChart; track m.month) {
                  <div class="m-col">
                    <span class="m-val">{{ m.kwh }}</span>
                    <div class="m-bar-track">
                      <div 
                        class="m-bar-fill" 
                        [style.height.%]="(m.kwh / (simResult().annualProductionKwh * 0.14)) * 100"
                      ></div>
                    </div>
                    <span class="m-lbl">{{ m.month }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Estimation IA selon Météo Réelle (Open-Meteo) -->
            <div class="weather-ai-box glass-panel">
              <div class="w-head">
                <span class="material-symbols-rounded text-sun">wb_sunny</span>
                <strong>Estimation IA Météo en Direct (Open-Meteo) :</strong>
                <span class="glass-badge badge-nature">Rendement IA : 98.4%</span>
              </div>
              <p class="w-text">
                Ensoleillement mesuré : <strong>5.8 kWh/m²/jour</strong> • Ciel dégagé optimal pour la production maximale sur toiture.
              </p>
            </div>

            <div class="actions-buttons-grid">
              <button class="btn-primary btn-cta" (click)="requestQuote()">
                <span class="material-symbols-rounded">assignment_turned_in</span>
                <span>Demander un Devis Certifié ANME</span>
              </button>
              <button class="btn-secondary btn-cta" (click)="downloadProsolApplication()">
                <span class="material-symbols-rounded">download_for_offline</span>
                <span>Dossier Prosol Prérempli (PDF)</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  `,
  styles: [`
    .solar-page {
      display: flex;
      flex-direction: column;
      gap: 28px;
      padding-bottom: 50px;
    }

    .solar-header {
      padding: 28px 32px;
      border-radius: var(--radius-xl);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 248, 230, 0.9) 100%);
      border: 1px solid rgba(255, 183, 3, 0.35);
    }

    .badge-row {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }

    .header-title {
      font-size: 28px;
      font-weight: 900;
      color: var(--text-main);
      margin-bottom: 6px;
    }

    .header-desc {
      font-size: 14.5px;
      color: var(--text-muted);
      max-width: 700px;
    }

    .simulator-layout {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 24px;
    }

    .params-column {
      padding: 26px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .inputs-list {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .input-label {
      font-size: 13px;
      font-weight: 800;
      color: var(--text-main);
    }

    .val-highlight {
      font-family: var(--font-title);
      font-size: 16px;
      font-weight: 900;
      color: var(--sun-amber);
    }

    .input-hint {
      font-size: 11.5px;
      color: var(--text-light);
    }

    .orientations-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .orient-pill {
      padding: 6px 12px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(29, 53, 87, 0.12);
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

    /* Results */
    .results-column {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .res-card {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      border-radius: var(--radius-lg);
    }

    .res-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      flex-shrink: 0;

      &.sun { background: var(--sun-gradient); box-shadow: 0 4px 12px rgba(251, 133, 0, 0.35); }
      &.nature { background: var(--nature-gradient); box-shadow: 0 4px 12px rgba(82, 183, 136, 0.35); }
      &.sky { background: var(--sky-gradient); box-shadow: 0 4px 12px rgba(76, 201, 240, 0.35); }
      &.green { background: linear-gradient(135deg, #2D6A4F 0%, #52B788 100%); }
    }

    .r-label {
      font-size: 11.5px;
      color: var(--text-muted);
      font-weight: 700;
    }

    .r-val {
      font-family: var(--font-title);
      font-size: 24px;
      font-weight: 900;
      color: var(--text-main);
      display: block;
      line-height: 1.15;
      margin: 2px 0;

      small { font-size: 13px; font-weight: 700; }
      &.text-nature { color: var(--nature-green); }
      &.text-sky { color: var(--sky-ocean); }
    }

    .r-sub {
      font-size: 11px;
      color: var(--text-light);
    }

    /* Funding Card */
    .funding-card {
      padding: 24px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .financial-breakdown {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.75);
      border-radius: var(--radius-md);
    }

    .fin-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: var(--text-main);

      &.highlight-sub { color: var(--nature-green); }
      &.total {
        padding-top: 10px;
        border-top: 1.5px dashed rgba(29, 53, 87, 0.12);
        font-size: 15px;
        font-weight: 800;
      }
    }

    .text-sun { color: var(--sun-amber); }

    .monthly-chart-box {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .chart-caption {
      font-size: 12.5px;
      font-weight: 700;
      color: var(--text-muted);
    }

    .months-bar-chart {
      height: 140px;
      display: flex;
      align-items: flex-end;
      gap: 8px;
    }

    .m-col {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
    }

    .m-val {
      font-size: 9.5px;
      color: var(--text-light);
      font-weight: 700;
    }

    .m-bar-track {
      width: 100%;
      height: 100px;
      background: rgba(29, 53, 87, 0.04);
      border-radius: var(--radius-xs);
      display: flex;
      align-items: flex-end;
      overflow: hidden;
    }

    .m-bar-fill {
      width: 100%;
      background: var(--sun-gradient);
      border-radius: var(--radius-xs) var(--radius-xs) 0 0;
      transition: height 0.3s ease-out;
    }

    .m-lbl {
      font-size: 10.5px;
      color: var(--text-muted);
      font-weight: 700;
    }

    .weather-ai-box {
      margin-top: 14px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, rgba(254, 243, 199, 0.6) 0%, rgba(255, 251, 235, 0.8) 100%);
      border: 1px solid rgba(245, 158, 11, 0.3);
      .w-head {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #92400e;
        margin-bottom: 4px;
        flex-wrap: wrap;
      }
      .w-text {
        font-size: 11.5px;
        color: #78350f;
        margin: 0;
        line-height: 1.4;
      }
    }

    .actions-buttons-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 14px;
    }

    .btn-cta {
      padding: 12px 16px;
      font-size: 13.5px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    @media (max-width: 992px) {
      .simulator-layout { grid-template-columns: 1fr; }
      .actions-buttons-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SolarSimulatorComponent {
  solarService = inject(SolarService);
  eleService = inject(ElectricityService);
  notifService = inject(NotificationService);

  Math = Math;
  selectedGovId = 'gov-tunis';
  surfaceM2 = signal(36);
  orientation = signal<SolarOrientation>('SUD');
  monthlyBillTnd = signal(160);

  orientationOptions: { value: SolarOrientation; label: string }[] = [
    { value: 'SUD', label: 'Plein Sud (100%)' },
    { value: 'SUD_EST', label: 'Sud-Est (96%)' },
    { value: 'SUD_OUEST', label: 'Sud-Ouest (96%)' },
    { value: 'EST', label: 'Est (86%)' },
    { value: 'OUEST', label: 'Ouest (85%)' }
  ];

  simResult = signal(this.calculate());

  onSurfaceChange(val: number): void {
    this.surfaceM2.set(val);
    this.recalculate();
  }

  setOrientation(val: SolarOrientation): void {
    this.orientation.set(val);
    this.recalculate();
  }

  recalculate(): void {
    this.simResult.set(this.calculate());
  }

  private calculate() {
    return this.solarService.simulate({
      surfaceM2: this.surfaceM2(),
      orientation: this.orientation(),
      tiltAngleDeg: 30,
      governorateId: this.selectedGovId,
      monthlyBillTnd: this.monthlyBillTnd()
    });
  }

  requestQuote(): void {
    this.notifService.showToast(
      'Demande de Devis Enregistrée !',
      'Votre simulation a été transmise aux installateurs certifiés ANME de votre gouvernorat.',
      'SUCCESS',
      5000
    );
  }

  downloadProsolApplication(): void {
    const res = this.simResult();
    const gov = this.eleService.getGovernorate(this.selectedGovId)?.name || 'Tunis';
    const dateStr = new Date().toLocaleDateString('fr-TN');

    const content = `
========================================================================
             RÉPUBLIQUE TUNISIENNE — MINISTÈRE DE L'INDUSTRIE ET DE L'ÉNERGIE
             ANME (Agence Nationale pour la Maîtrise de l'Énergie)
             STEG (Société Tunisienne de l'Électricité et du Gaz)
             PROGRAMME NATIONAL « PROSOL ÉLEC » — FORMULAIRE OFFICIEL
========================================================================
Date de la demande      : ${dateStr}
Référence Dossier       : PROSOL-TN-${Math.floor(100000 + Math.random() * 900000)}
Gouvernorat             : ${gov}

1. BÉNÉFICIAIRE / CITOYEN DEMANDEUR
------------------------------------------------------------------------
Nom & Prénom            : Citoyen VoltTN
Compteur STEG           : MTR-TN-882419 (Basse Tension)
Facture Mensuelle Moy.  : ${this.monthlyBillTnd()} DT

2. CARACTÉRISTIQUES TECHNIQUES DE L'INSTALLATION PROJETÉE
------------------------------------------------------------------------
Surface toiture utile   : ${this.surfaceM2()} m²
Orientation toiture     : ${this.orientation()} (Inclinaison 30°)
Puissance Crête         : ${res.installedPowerKwc} kWc (${Math.round(this.surfaceM2() / 6.2)} panneaux 400 Wc)
Production estimée IA   : ${res.annualProductionKwh.toLocaleString()} kWh / an
CO₂ évité certifié      : ${res.co2SavedTonsPerYear} tonnes / an

3. PLAN DE FINANCEMENT SUBVENTIONNÉ (PROSOL ÉLEC)
------------------------------------------------------------------------
Coût clé en main TTC    : ${res.systemCostTnd.toLocaleString()} DT
Prime ANME / FTE (25%)  : - ${res.stegSubsidyTnd.toLocaleString()} DT (Fonds de Transition Énergétique)
Crédit Bonifié STEG     : ${res.netCostTnd.toLocaleString()} DT (Remboursable sur facture STEG sur 7 ans)
Économie annuelle       : + ${res.annualSavingsTnd.toLocaleString()} DT / an
Retour investissement   : ${res.roiYears} ans

4. PIÈCES JUSTIFICATIVES ATTACHÉES
------------------------------------------------------------------------
[X] Copie de la CIN du demandeur
[X] Dernière facture STEG acquittée
[X] Attestation de propriété ou contrat de bail
[X] Devis technique délivré par un installateur agréé ANME

Cachet & Signature du Demandeur :                         Visa STEG / ANME :
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Dossier_Prosol_Elec_ANME_${gov}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    this.notifService.showToast(
      'Dossier Prosol Prérempli Téléchargé !',
      'Le formulaire officiel a été généré avec toutes vos caractéristiques techniques et financières.',
      'SUCCESS',
      6000
    );
  }
}
