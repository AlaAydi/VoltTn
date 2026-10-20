import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CitizenService } from '../../../core/services/citizen.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Tilt3dDirective } from '../../../shared/directives/tilt-3d.directive';

export interface MeterReading {
  id: string;
  date: string;
  indexKwh: number;
  consumptionKwh: number;
  costTnd: number;
  source: 'OCR_PHOTO' | 'TELERELEVE' | 'CONTROLEUR';
  status: 'VALIDE' | 'REJETE' | 'EN_ATTENTE';
  notes?: string;
}

@Component({
  selector: 'app-smart-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, Tilt3dDirective],
  template: `
    <div class="smart-billing-page">
      
      <!-- En-tête Facture & Relève Intelligente -->
      <div class="billing-header glass-card animate-float">
        <div class="header-left">
          <div class="badge-row">
            <span class="glass-badge badge-sun">
              <span class="material-symbols-rounded">receipt_long</span>
              Facturation Intelligente STEG & IA
            </span>
            <span class="glass-badge badge-sky">OCR Compteur par Vision</span>
            <span class="glass-badge badge-nature">Tarif Basse Tension Réglementé</span>
          </div>
          <h1 class="header-title">Facture Prédictive & Relève par Photo</h1>
          <p class="header-desc">
            Comprenez chaque millime de votre facture STEG, simulez vos économies d'énergie et photographiez votre compteur pour une relève certifiée sans attendre le passage du contrôleur.
          </p>
        </div>
        
        <div class="bill-summary-pill glass-panel" appTilt3d [maxTilt]="6">
          <span class="pill-label">Facture Estimée du Mois en cours :</span>
          <div class="pill-amount">
            <span class="currency">DT</span>
            <span class="amount">{{ currentBillEstimate() | number:'1.2-2' }}</span>
          </div>
          <span class="pill-trend" [class.trend-down]="isBillLowerThanLastMonth()">
            <span class="material-symbols-rounded">{{ isBillLowerThanLastMonth() ? 'trending_down' : 'trending_up' }}</span>
            <span>{{ isBillLowerThanLastMonth() ? '-8% vs mois dernier' : '+14% vs mois dernier' }}</span>
          </span>
        </div>
      </div>

      <!-- Navigation par Onglets du Module Facturation -->
      <div class="billing-tabs-nav glass-card">
        <button class="tab-btn" [class.active]="activeTab() === 'explainer'" (click)="activeTab.set('explainer')">
          <span class="material-symbols-rounded">psychology</span>
          <span>Explicateur de Facture IA</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'ocr'" (click)="activeTab.set('ocr')">
          <span class="material-symbols-rounded">document_scanner</span>
          <span>Relève Compteur par Photo OCR</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'whatif'" (click)="activeTab.set('whatif')">
          <span class="material-symbols-rounded">tune</span>
          <span>Simulateur « Et si... » IA</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'history'" (click)="activeTab.set('history')">
          <span class="material-symbols-rounded">history</span>
          <span>Historique des Relevés ({{ readings().length }})</span>
        </button>
      </div>

      <!-- ================= ONGLET 1 : EXPLICATEUR DE FACTURE IA ================= -->
      @if (activeTab() === 'explainer') {
        <div class="tab-content explainer-grid">
          
          <!-- Décomposition des 4 Tranches Tarifaires STEG -->
          <div class="steptiers-card glass-card">
            <div class="card-head">
              <div>
                <h2 class="card-title">Décomposition par Tranches Tarifaires STEG</h2>
                <p class="card-subtitle">Tarif progressif appliqué à vos <strong>{{ citizenService.consumption().monthForecastKwh }} kWh</strong> estimés ce mois-ci :</p>
              </div>
              <span class="glass-badge badge-sun">Grille Officielle BT</span>
            </div>

            <div class="tiers-bars-stack">
              @for (tier of getTierBreakdown(); track tier.tierName) {
                <div class="tier-item" [class.active]="tier.kwhInTier > 0">
                  <div class="tier-info-row">
                    <div class="tier-name-box">
                      <strong class="t-name">{{ tier.tierName }}</strong>
                      <span class="t-rate">{{ tier.unitPrice }} DT / kWh</span>
                    </div>
                    <div class="tier-calc">
                      <span class="t-kwh">{{ tier.kwhInTier }} kWh</span>
                      <strong class="t-cost">{{ tier.costTnd | number:'1.3-3' }} DT</strong>
                    </div>
                  </div>

                  <div class="tier-bar-track">
                    <div 
                      class="tier-bar-fill" 
                      [style.width.%]="(tier.kwhInTier / tier.maxKwh) * 100"
                      [ngClass]="'fill-' + tier.color"
                    ></div>
                  </div>
                  <span class="t-range">{{ tier.rangeLabel }}</span>
                </div>
              }
            </div>

            <div class="fixed-taxes-panel glass-panel">
              <div class="tax-row">
                <span>Redevance fixe puissance & compteur :</span>
                <strong>4.200 DT</strong>
              </div>
              <div class="tax-row">
                <span>Taxe municipale (FODEC / Électrification) :</span>
                <strong>3.800 DT</strong>
              </div>
              <div class="tax-row">
                <span>TVA (7% sur l'énergie consommée) :</span>
                <strong>{{ (currentBillEstimate() * 0.07) | number:'1.3-3' }} DT</strong>
              </div>
              <div class="tax-total-row">
                <span>Total Facture TTC :</span>
                <strong class="text-sun">{{ currentBillEstimate() | number:'1.3-3' }} DT</strong>
              </div>
            </div>
          </div>

          <!-- Analyse causale de la hausse par IA -->
          <div class="causes-card glass-card">
            <div class="card-head">
              <div>
                <h2 class="card-title">Diagnostic des Causes de Variation (IA)</h2>
                <p class="card-subtitle">Comparaison intelligente par rapport au même mois de l'année précédente :</p>
              </div>
              <span class="glass-badge badge-coral">Écart Détecté : +14%</span>
            </div>

            <div class="causes-breakdown-list">
              <div class="cause-item glass-panel">
                <div class="cause-icon-box coral">
                  <span class="material-symbols-rounded">mode_heat</span>
                </div>
                <div class="cause-content">
                  <div class="cause-title-row">
                    <strong>Vague de Canicule (+4.2°C)</strong>
                    <span class="impact-val text-coral">+18.400 DT</span>
                  </div>
                  <p class="cause-desc">La climatisation a fonctionné 3.5 heures de plus par jour pendant les 5 jours de pic de chaleur.</p>
                </div>
              </div>

              <div class="cause-item glass-panel">
                <div class="cause-icon-box sun">
                  <span class="material-symbols-rounded">water_heater</span>
                </div>
                <div class="cause-content">
                  <div class="cause-title-row">
                    <strong>Chauffe-eau en Heures Pleines</strong>
                    <span class="impact-val text-sun">+7.800 DT</span>
                  </div>
                  <p class="cause-desc">Déclenchements fréquents entre 19h et 21h (tranche tarifaire la plus élevée).</p>
                </div>
              </div>

              <div class="cause-item glass-panel">
                <div class="cause-icon-box nature">
                  <span class="material-symbols-rounded">solar_power</span>
                </div>
                <div class="cause-content">
                  <div class="cause-title-row">
                    <strong>Compensation Solaire Photovoltaïque</strong>
                    <span class="impact-val text-nature">-12.600 DT</span>
                  </div>
                  <p class="cause-desc">Vos panneaux ont produit 62 kWh injectés sur le réseau, réduisant directement la tranche 3.</p>
                </div>
              </div>
            </div>

            <!-- Conseil de régulation instantané -->
            <div class="ai-recommendation-box glass-panel">
              <span class="material-symbols-rounded ai-sparkle">tips_and_updates</span>
              <div>
                <strong>Recommandation du Conseiller IA :</strong>
                <p>En ajustant votre thermostat de climatisation de 23°C à 26°C et en programmant votre chauffe-eau à 23h00, vous basculerez 100% de votre surconsommation dans la Tranche 2 économique, économisant ainsi <strong>24.500 DT</strong> le mois prochain.</p>
              </div>
            </div>

          </div>

        </div>
      }

      <!-- ================= ONGLET 2 : RELÈVE PAR PHOTO OCR [IA] ================= -->
      @if (activeTab() === 'ocr') {
        <div class="tab-content ocr-layout">
          
          <div class="ocr-scanner-card glass-card">
            <div class="card-head">
              <div>
                <h2 class="card-title">Scanner Intelligent de Compteur STEG</h2>
                <p class="card-subtitle">Photographiez votre cadran : l'algorithme de vision par ordinateur lit les rouleaux et extrait l'index certifié.</p>
              </div>
              <span class="glass-badge badge-sky">Vision AI v2.4</span>
            </div>

            <div class="scanner-viewport">
              @if (!scannedImage()) {
                <div class="upload-placeholder" (click)="simulatePhotoUpload()">
                  <span class="material-symbols-rounded camera-icon">photo_camera</span>
                  <div class="placeholder-text">
                    <strong>Prendre une photo ou importer un cliché</strong>
                    <span>Cadrez les 6 chiffres du cadran (kWh)</span>
                  </div>
                  <button type="button" class="btn-primary">
                    <span class="material-symbols-rounded">upload</span>
                    <span>Sélectionner une Photo de Compteur</span>
                  </button>
                </div>
              } @else {
                <div class="active-scan-container">
                  <img [src]="scannedImage()" alt="Compteur Scanné" class="scanned-preview-img" />
                  
                  <!-- Boîte englobante verte OCR animée -->
                  <div class="ocr-bounding-box" [class.scanning]="isScanning()">
                    <div class="laser-scanner-line"></div>
                    <span class="ocr-tag">INDEX DÉTECTÉ : {{ detectedIndex() }} kWh</span>
                  </div>

                  @if (isScanning()) {
                    <div class="scan-overlay">
                      <span class="material-symbols-rounded spinner-icon">hourglass_top</span>
                      <span>Extraction neuronale des chiffres en cours...</span>
                    </div>
                  }
                </div>
              }
            </div>

            @if (scannedImage() && !isScanning()) {
              <div class="scan-result-panel glass-panel">
                <div class="detected-display">
                  <span class="d-label">Index Détecté par OCR :</span>
                  <div class="digits-odometer">
                    @for (digit of detectedIndex().toString().padStart(6, '0').split(''); track $index) {
                      <span class="digit-box">{{ digit }}</span>
                    }
                    <span class="unit">kWh</span>
                  </div>
                </div>

                <div class="verification-controls">
                  <label class="form-label">Ajuster manuellement si nécessaire :</label>
                  <div class="input-with-button">
                    <input 
                      type="number" 
                      class="form-input" 
                      [(ngModel)]="detectedIndex" 
                      name="detectedIndex"
                    />
                    <button class="btn-primary" (click)="submitReading()">
                      <span class="material-symbols-rounded">check_circle</span>
                      <span>Valider & Transmettre à la STEG</span>
                    </button>
                    <button class="btn-secondary" (click)="resetScanner()">
                      <span class="material-symbols-rounded">refresh</span>
                      <span>Reprendre</span>
                    </button>
                  </div>
                </div>

                @if (validationError()) {
                  <div class="validation-error-alert animate-float">
                    <span class="material-symbols-rounded">warning</span>
                    <div>
                      <strong>Erreur de Cohérence Détectée :</strong>
                      <p>{{ validationError() }}</p>
                    </div>
                  </div>
                }
              </div>
            }

          </div>

          <!-- Guide pour une bonne photo -->
          <div class="ocr-guide-card glass-card">
            <h3 class="guide-title">Contrôles de Validité Automatisés</h3>
            <div class="rules-list">
              <div class="rule-item">
                <span class="material-symbols-rounded check-icon text-nature">check_circle</span>
                <div>
                  <strong>Contrôle de Monotonie :</strong>
                  <p>L'index ne peut jamais être inférieur à votre dernier relevé validé ({{ lastValidatedIndex }} kWh).</p>
                </div>
              </div>
              <div class="rule-item">
                <span class="material-symbols-rounded check-icon text-nature">check_circle</span>
                <div>
                  <strong>Plafond de Vraisemblance :</strong>
                  <p>Une hausse supérieure à 2 500 kWh en 30 jours déclenche automatiquement une double vérification humaine.</p>
                </div>
              </div>
              <div class="rule-item">
                <span class="material-symbols-rounded check-icon text-nature">check_circle</span>
                <div>
                  <strong>Horodatage & Métadonnées EXIF :</strong>
                  <p>La date et l'heure de la prise de vue sont cryptographiquement signées pour éviter toute contestation.</p>
                </div>
              </div>
            </div>

            <div class="meter-info-card glass-panel">
              <span class="lbl">Compteur Associé Actif :</span>
              <strong>MTR-TN-882419 (Électronique Monophasé)</strong>
              <span>Dernier relevé STEG : <strong>15 Septembre 2025 (48 100 kWh)</strong></span>
            </div>
          </div>

        </div>
      }

      <!-- ================= ONGLET 3 : SIMULATEUR « ET SI... » IA ================= -->
      @if (activeTab() === 'whatif') {
        <div class="tab-content whatif-grid">
          
          <div class="sim-controls-card glass-card">
            <div class="card-head">
              <div>
                <h2 class="card-title">Simulateur d'Économies Énergétiques « Et si... »</h2>
                <p class="card-subtitle">Testez en direct l'impact financier de vos changements d'habitudes sur votre prochaine facture STEG.</p>
              </div>
              <button class="btn-secondary" (click)="resetSimulation()">
                <span class="material-symbols-rounded">restart_alt</span>
                <span>Réinitialiser</span>
              </button>
            </div>

            <div class="sim-sliders-list">
              <!-- Curseur Climatisation -->
              <div class="sim-slider-box glass-panel">
                <div class="sim-slider-header">
                  <div class="icon-label">
                    <span class="material-symbols-rounded text-coral">ac_unit</span>
                    <div>
                      <strong>Climatisation / Chauffage Réversible</strong>
                      <span>Température de consigne souhaitée</span>
                    </div>
                  </div>
                  <strong class="sim-val text-coral">{{ acTemp() }} °C</strong>
                </div>
                <input 
                  type="range" 
                  min="20" 
                  max="28" 
                  step="1" 
                  [ngModel]="acTemp()" 
                  (ngModelChange)="acTemp.set($event)" 
                  class="range-slider"
                />
                <div class="range-labels">
                  <span>20°C (Gourmand)</span>
                  <span class="highlight">26°C (Recommandé STEG)</span>
                  <span>28°C (Éco Max)</span>
                </div>
              </div>

              <!-- Curseur Heures Creuses Lave-Linge -->
              <div class="sim-slider-box glass-panel">
                <div class="sim-slider-header">
                  <div class="icon-label">
                    <span class="material-symbols-rounded text-sky">local_laundry_service</span>
                    <div>
                      <strong>Décalage Appareils en Heures Creuses (22h - 06h)</strong>
                      <span>Part des machines lancées la nuit</span>
                    </div>
                  </div>
                  <strong class="sim-val text-sky">{{ offPeakShiftPct() }}%</strong>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="10" 
                  [ngModel]="offPeakShiftPct()" 
                  (ngModelChange)="offPeakShiftPct.set($event)" 
                  class="range-slider"
                />
              </div>

              <!-- Curseur Éclairage LED -->
              <div class="sim-slider-box glass-panel">
                <div class="sim-slider-header">
                  <div class="icon-label">
                    <span class="material-symbols-rounded text-sun">lightbulb</span>
                    <div>
                      <strong>Remplacement Ampoules par des LED</strong>
                      <span>Nombre d'ampoules changées</span>
                    </div>
                  </div>
                  <strong class="sim-val text-sun">{{ ledBulbs() }} ampoules</strong>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="20" 
                  step="2" 
                  [ngModel]="ledBulbs()" 
                  (ngModelChange)="ledBulbs.set($event)" 
                  class="range-slider"
                />
              </div>

              <!-- Toggle Veilles Appareils -->
              <div class="sim-toggle-row glass-panel">
                <div class="icon-label">
                  <span class="material-symbols-rounded text-nature">power_settings_new</span>
                  <div>
                    <strong>Couper les Veilles la Nuit (Multiprises à interrupteur)</strong>
                    <span>TV, décodeur, box internet, console</span>
                  </div>
                </div>
                <label class="switch">
                  <input type="checkbox" [checked]="cutStandby()" (change)="cutStandby.set(!cutStandby())" />
                  <span class="slider round"></span>
                </label>
              </div>

            </div>
          </div>

          <!-- Résultat financier en direct -->
          <div class="sim-result-card glass-card" appTilt3d [maxTilt]="6">
            <div class="result-badge-row">
              <span class="glass-badge badge-nature">Résultat Modélisé IA</span>
            </div>
            
            <h3 class="result-title">Vos Économies Mensuelles Estimées :</h3>
            
            <div class="savings-amount-display">
              <span class="minus">-</span>
              <span class="num">{{ calculateSimSavings() | number:'1.2-2' }}</span>
              <span class="cur">DT / mois</span>
            </div>

            <div class="yearly-badge glass-panel">
              <span>Soit une économie annuelle de :</span>
              <strong class="text-nature">{{ (calculateSimSavings() * 12) | number:'1.0-0' }} Dinars Tunisiens</strong>
            </div>

            <div class="impact-metrics-row">
              <div class="i-box">
                <span class="material-symbols-rounded icon text-sky">bolt</span>
                <strong>-{{ calculateKwhSaved() }} kWh</strong>
                <span>Énergie non consommée</span>
              </div>
              <div class="i-box">
                <span class="material-symbols-rounded icon text-nature">forest</span>
                <strong>-{{ (calculateKwhSaved() * 0.52) | number:'1.0-0' }} kg</strong>
                <span>Émissions de CO₂ évitées</span>
              </div>
            </div>

            <button class="btn-primary btn-apply-tips" (click)="saveSimulationPlan()">
              <span class="material-symbols-rounded">bookmark_added</span>
              <span>Adopter ce Plan d'Économie dans mon Espace</span>
            </button>
          </div>

        </div>
      }

      <!-- ================= ONGLET 4 : HISTORIQUE DES RELEVÉS ================= -->
      @if (activeTab() === 'history') {
        <div class="tab-content glass-card">
          <div class="table-top-bar">
            <div>
              <h2 class="card-title">Registre Certifié des Relevés de Compteur</h2>
              <p class="card-subtitle">Traçabilité complète des index transmis par télérelevé automatique, photo citoyen OCR ou agents STEG.</p>
            </div>
            <button class="btn-sky" (click)="exportReadingsCSV()">
              <span class="material-symbols-rounded">download</span>
              <span>Exporter Historique (CSV)</span>
            </button>
          </div>

          <div class="table-responsive">
            <table class="volttn-table">
              <thead>
                <tr>
                  <th style="min-width: 130px;">Date de Relève</th>
                  <th style="min-width: 140px;">Index Cadran</th>
                  <th style="min-width: 140px;">Consommation</th>
                  <th style="min-width: 130px;">Facture TTC</th>
                  <th style="min-width: 160px;">Source de Relève</th>
                  <th style="min-width: 120px;">Statut STEG</th>
                </tr>
              </thead>
              <tbody>
                @for (r of readings(); track r.id) {
                  <tr>
                    <td><strong>{{ r.date }}</strong></td>
                    <td><span class="meter-chip-mono">{{ r.indexKwh | number }} kWh</span></td>
                    <td><strong>+{{ r.consumptionKwh }} kWh</strong></td>
                    <td><strong class="text-sun">{{ r.costTnd | number:'1.3-3' }} DT</strong></td>
                    <td>
                      <span class="glass-badge" [ngClass]="getSourceBadge(r.source)">
                        <span class="material-symbols-rounded badge-mini-icon">{{ getSourceIcon(r.source) }}</span>
                        <span>{{ getSourceLabel(r.source) }}</span>
                      </span>
                    </td>
                    <td>
                      <span class="glass-badge" [ngClass]="r.status === 'VALIDE' ? 'badge-nature' : 'badge-coral'">
                        {{ r.status }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .smart-billing-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 50px;
    }

    .billing-header {
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
      line-height: 1.4;
    }

    .bill-summary-pill {
      padding: 16px 24px;
      border-radius: var(--radius-lg);
      background: rgba(255, 255, 255, 0.95);
      border: 1.5px solid rgba(251, 133, 0, 0.3);
      box-shadow: var(--shadow-md);
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      min-width: 220px;
    }

    .pill-label { font-size: 11px; font-weight: 700; color: var(--text-muted); }
    .pill-amount {
      display: flex;
      align-items: baseline;
      gap: 4px;
      .currency { font-size: 14px; font-weight: 800; color: var(--sun-amber); }
      .amount { font-size: 32px; font-weight: 900; color: var(--text-main); line-height: 1.1; }
    }
    .pill-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11.5px;
      font-weight: 800;
      color: var(--alert-coral);
      &.trend-down { color: var(--nature-green); }
      .material-symbols-rounded { font-size: 15px; }
    }

    .billing-tabs-nav {
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

    .tab-content {
      padding: 26px;
      border-radius: var(--radius-xl);
    }

    /* Explainer Grid */
    .explainer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      padding: 0;
      background: transparent;
    }

    .steptiers-card, .causes-card {
      padding: 26px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .card-title { font-size: 18px; font-weight: 900; color: var(--text-main); }
    .card-subtitle { font-size: 12.5px; color: var(--text-muted); margin-top: 2px; }

    .tiers-bars-stack {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .tier-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      background: rgba(29, 53, 87, 0.02);
      border: 1px solid rgba(29, 53, 87, 0.05);

      &.active {
        background: rgba(255, 255, 255, 0.9);
        border-color: rgba(251, 133, 0, 0.2);
      }
    }

    .tier-info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }

    .tier-name-box {
      display: flex;
      align-items: center;
      gap: 8px;
      .t-name { font-weight: 800; color: var(--text-main); }
      .t-rate { font-size: 11.5px; color: var(--text-muted); }
    }

    .tier-calc {
      display: flex;
      gap: 12px;
      .t-kwh { color: var(--text-muted); font-size: 12.5px; }
      .t-cost { color: var(--text-main); }
    }

    .tier-bar-track {
      width: 100%;
      height: 8px;
      border-radius: var(--radius-full);
      background: rgba(29, 53, 87, 0.08);
      overflow: hidden;
    }

    .tier-bar-fill {
      height: 100%;
      border-radius: var(--radius-full);
      transition: width 0.6s ease;

      &.fill-green { background: linear-gradient(to right, #52B788, #2D6A4F); }
      &.fill-sky { background: linear-gradient(to right, #4CC9F0, #2A9DF4); }
      &.fill-amber { background: linear-gradient(to right, #FFB703, #FB8500); }
      &.fill-coral { background: linear-gradient(to right, #FF6B6B, #D90429); }
    }

    .t-range { font-size: 10.5px; color: var(--text-light); }

    .fixed-taxes-panel {
      padding: 14px 18px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12.5px;

      .tax-row {
        display: flex;
        justify-content: space-between;
        color: var(--text-muted);
      }
      .tax-total-row {
        display: flex;
        justify-content: space-between;
        padding-top: 8px;
        margin-top: 4px;
        border-top: 1.5px solid rgba(29, 53, 87, 0.1);
        font-size: 14px;
        font-weight: 900;
        color: var(--text-main);
      }
    }

    /* Causes list */
    .causes-breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .cause-item {
      display: flex;
      gap: 14px;
      padding: 14px 16px;
      border-radius: var(--radius-md);
      align-items: flex-start;
    }

    .cause-icon-box {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      .material-symbols-rounded { font-size: 20px; color: #FFFFFF; }
      &.coral { background: var(--alert-coral); }
      &.sun { background: var(--sun-amber); }
      &.nature { background: var(--nature-green); }
    }

    .cause-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .cause-title-row {
      display: flex;
      justify-content: space-between;
      font-size: 13.5px;
      .impact-val { font-weight: 900; }
    }
    .cause-desc { font-size: 12px; color: var(--text-muted); line-height: 1.35; }

    .ai-recommendation-box {
      padding: 14px 16px;
      border-radius: var(--radius-md);
      display: flex;
      gap: 12px;
      background: rgba(255, 240, 194, 0.4);
      border-left: 4px solid var(--sun-amber);
      font-size: 12px;
      color: var(--text-main);
      line-height: 1.4;

      .ai-sparkle { color: var(--sun-amber); font-size: 24px; flex-shrink: 0; }
    }

    /* OCR Layout */
    .ocr-layout {
      display: grid;
      grid-template-columns: 1.3fr 0.7fr;
      gap: 24px;
      padding: 0;
      background: transparent;
    }

    .ocr-scanner-card, .ocr-guide-card {
      padding: 26px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .scanner-viewport {
      min-height: 320px;
      border-radius: var(--radius-lg);
      border: 2px dashed rgba(29, 53, 87, 0.2);
      background: rgba(29, 53, 87, 0.03);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      text-align: center;
      cursor: pointer;
      padding: 30px;
      .camera-icon { font-size: 52px; color: var(--sky-ocean); }
      .placeholder-text {
        strong { font-size: 15px; color: var(--text-main); display: block; }
        span { font-size: 12px; color: var(--text-light); }
      }
    }

    .active-scan-container {
      width: 100%;
      height: 360px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000000;
    }

    .scanned-preview-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      opacity: 0.85;
    }

    .ocr-bounding-box {
      position: absolute;
      top: 38%;
      left: 28%;
      width: 44%;
      height: 22%;
      border: 2.5px solid #52B788;
      box-shadow: 0 0 15px rgba(82, 183, 136, 0.6);
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      &.scanning .laser-scanner-line {
        height: 2px;
        background: #FF6B6B;
        box-shadow: 0 0 10px #FF6B6B;
        animation: laserScan 1.5s infinite alternate ease-in-out;
      }
    }

    @keyframes laserScan {
      0% { transform: translateY(0); }
      100% { transform: translateY(60px); }
    }

    .ocr-tag {
      position: absolute;
      top: -24px;
      left: 0;
      background: #52B788;
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
      white-space: nowrap;
    }

    .scan-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      gap: 10px;
      font-size: 13px;
      font-weight: 700;
      .spinner-icon { font-size: 36px; animation: spin 1s infinite linear; }
    }

    @keyframes spin { 100% { transform: rotate(360deg); } }

    .scan-result-panel {
      padding: 18px 22px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .detected-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      .d-label { font-size: 12px; font-weight: 700; color: var(--text-muted); }
    }

    .digits-odometer {
      display: flex;
      gap: 4px;
      align-items: center;
      .digit-box {
        font-family: monospace;
        font-size: 24px;
        font-weight: 900;
        background: #1D3557;
        color: #FFFFFF;
        padding: 6px 12px;
        border-radius: 6px;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
      }
      .unit { font-size: 14px; font-weight: 800; color: var(--text-muted); margin-left: 6px; }
    }

    .verification-controls {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .input-with-button {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      .form-input { max-width: 180px; font-size: 15px; font-weight: 800; }
    }

    .validation-error-alert {
      display: flex;
      gap: 10px;
      background: var(--alert-coral-light);
      border-left: 4px solid var(--alert-coral);
      padding: 12px 14px;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      color: #B91C1C;
      font-size: 12.5px;
      line-height: 1.35;
      .material-symbols-rounded { font-size: 22px; flex-shrink: 0; }
    }

    /* Rules Guide */
    .rules-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .rule-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      font-size: 12.5px;
      strong { color: var(--text-main); display: block; margin-bottom: 2px; }
      p { color: var(--text-muted); line-height: 1.3; }
      .check-icon { font-size: 20px; }
    }

    .meter-info-card {
      padding: 14px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 12px;
      .lbl { font-weight: 700; color: var(--text-muted); }
      strong { color: var(--text-main); font-size: 13px; }
    }

    /* What-If Grid */
    .whatif-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 24px;
      padding: 0;
      background: transparent;
    }

    .sim-controls-card, .sim-result-card {
      padding: 26px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .sim-sliders-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .sim-slider-box {
      padding: 14px 18px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .sim-slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .icon-label {
      display: flex;
      align-items: center;
      gap: 10px;
      strong { font-size: 13.5px; color: var(--text-main); display: block; }
      span { font-size: 11.5px; color: var(--text-light); }
      .material-symbols-rounded { font-size: 24px; }
    }

    .sim-val { font-size: 16px; font-weight: 900; }

    .range-labels {
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      color: var(--text-light);
      .highlight { color: var(--sun-amber); font-weight: 800; }
    }

    .sim-toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      border-radius: var(--radius-md);
    }

    /* Switch */
    .switch {
      position: relative;
      display: inline-block;
      width: 46px;
      height: 24px;
      input { opacity: 0; width: 0; height: 0; }
    }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #CBD5E1;
      transition: .4s;
      &.round { border-radius: 34px; }
      &.round:before { border-radius: 50%; }
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .4s;
    }
    input:checked + .slider { background-color: var(--nature-green); }
    input:checked + .slider:before { transform: translateX(22px); }

    /* Result Card */
    .sim-result-card {
      align-items: center;
      text-align: center;
      justify-content: center;
      background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(234,247,240,0.8) 100%);
    }

    .result-title { font-size: 15px; color: var(--text-muted); font-weight: 700; }

    .savings-amount-display {
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin: 10px 0;
      .minus { font-size: 32px; font-weight: 900; color: var(--nature-green); }
      .num { font-size: 54px; font-weight: 900; color: var(--nature-green); line-height: 1; }
      .cur { font-size: 16px; font-weight: 800; color: var(--text-muted); }
    }

    .yearly-badge {
      padding: 10px 18px;
      border-radius: var(--radius-full);
      display: flex;
      gap: 6px;
      font-size: 12.5px;
      color: var(--text-main);
      margin-bottom: 16px;
    }

    .impact-metrics-row {
      display: flex;
      gap: 16px;
      width: 100%;
      margin-bottom: 20px;
    }

    .i-box {
      flex: 1;
      padding: 12px;
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.9);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      strong { font-size: 16px; color: var(--text-main); }
      span { font-size: 11px; color: var(--text-light); }
      .icon { font-size: 24px; }
    }

    .btn-apply-tips { width: 100%; padding: 12px; font-size: 14px; }

    /* Table Meter Mono */
    .meter-chip-mono {
      font-family: monospace;
      font-size: 13px;
      font-weight: 800;
      background: rgba(29, 53, 87, 0.06);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
    }

    .badge-mini-icon { font-size: 14px; margin-right: 4px; }

    @media (max-width: 992px) {
      .explainer-grid, .ocr-layout, .whatif-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SmartBillingComponent {
  citizenService = inject(CitizenService);
  authService = inject(AuthService);
  notifService = inject(NotificationService);

  activeTab = signal<'explainer' | 'ocr' | 'whatif' | 'history'>('explainer');

  currentBillEstimate = signal<number>(84.750);
  lastValidatedIndex = 48100;

  // OCR state
  scannedImage = signal<string | null>(null);
  isScanning = signal<boolean>(false);
  detectedIndex = signal<number>(48291);
  validationError = signal<string | null>(null);

  // What-If Simulator state
  acTemp = signal<number>(25);
  offPeakShiftPct = signal<number>(40);
  ledBulbs = signal<number>(6);
  cutStandby = signal<boolean>(true);

  // Relevés historiques
  readings = signal<MeterReading[]>([
    { id: 'rel-01', date: '15 Oct 2025', indexKwh: 48291, consumptionKwh: 191, costTnd: 84.750, source: 'OCR_PHOTO', status: 'VALIDE' },
    { id: 'rel-02', date: '15 Sep 2025', indexKwh: 48100, consumptionKwh: 220, costTnd: 98.400, source: 'TELERELEVE', status: 'VALIDE' },
    { id: 'rel-03', date: '15 Août 2025', indexKwh: 47880, consumptionKwh: 265, costTnd: 124.800, source: 'TELERELEVE', status: 'VALIDE' },
    { id: 'rel-04', date: '15 Juil 2025', indexKwh: 47615, consumptionKwh: 240, costTnd: 110.200, source: 'CONTROLEUR', status: 'VALIDE' }
  ]);

  isBillLowerThanLastMonth(): boolean {
    return true;
  }

  getTierBreakdown() {
    const kwh = this.citizenService.consumption()?.monthForecastKwh || 210;
    return [
      { tierName: 'Tranche 1 (Économique)', unitPrice: 0.181, kwhInTier: Math.min(kwh, 50), maxKwh: 50, costTnd: Math.min(kwh, 50) * 0.181, rangeLabel: '0 à 50 kWh', color: 'green' },
      { tierName: 'Tranche 2 (Normale)', unitPrice: 0.223, kwhInTier: Math.max(0, Math.min(kwh - 50, 50)), maxKwh: 50, costTnd: Math.max(0, Math.min(kwh - 50, 50)) * 0.223, rangeLabel: '51 à 100 kWh', color: 'sky' },
      { tierName: 'Tranche 3 (Confort)', unitPrice: 0.338, kwhInTier: Math.max(0, Math.min(kwh - 100, 100)), maxKwh: 100, costTnd: Math.max(0, Math.min(kwh - 100, 100)) * 0.338, rangeLabel: '101 à 200 kWh', color: 'amber' },
      { tierName: 'Tranche 4 (Forte)', unitPrice: 0.410, kwhInTier: Math.max(0, kwh - 200), maxKwh: 150, costTnd: Math.max(0, kwh - 200) * 0.410, rangeLabel: '> 200 kWh', color: 'coral' }
    ];
  }

  simulatePhotoUpload(): void {
    this.scannedImage.set('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=700&q=80');
    this.isScanning.set(true);
    this.validationError.set(null);

    setTimeout(() => {
      this.isScanning.set(false);
      this.detectedIndex.set(48291);
      this.notifService.showToast('Index Lu par OCR', 'Index 48 291 kWh extrait avec 98.4% de confiance.', 'INFO');
    }, 1400);
  }

  resetScanner(): void {
    this.scannedImage.set(null);
    this.validationError.set(null);
  }

  submitReading(): void {
    const val = Number(this.detectedIndex());
    if (val < this.lastValidatedIndex) {
      this.validationError.set(`Index impossible : ${val} kWh est inférieur au relevé précédent (${this.lastValidatedIndex} kWh).`);
      this.notifService.showToast('Rejet de Cohérence', 'L\'index saisi est inférieur à la relève précédente.', 'ALERT');
      return;
    }

    const conso = val - this.lastValidatedIndex;
    const newReading: MeterReading = {
      id: 'rel-' + Date.now(),
      date: 'Aujourd\'hui',
      indexKwh: val,
      consumptionKwh: conso,
      costTnd: (conso * 0.28) + 8.0,
      source: 'OCR_PHOTO',
      status: 'VALIDE'
    };

    this.readings.update(prev => [newReading, ...prev]);
    this.lastValidatedIndex = val;
    this.validationError.set(null);
    this.notifService.showToast('Relève Certifiée Transmise', `Index ${val} kWh validé et consigné dans votre historique STEG.`, 'SUCCESS');
  }

  calculateSimSavings(): number {
    let savings = 0;
    // Climatisation
    const diffTemp = Math.max(0, this.acTemp() - 22);
    savings += diffTemp * 6.5; // ~6.5 DT par degré au-dessus de 22
    // Heures creuses
    savings += (this.offPeakShiftPct() / 100) * 16.0;
    // LED
    savings += this.ledBulbs() * 1.4;
    // Veilles
    if (this.cutStandby()) savings += 7.2;

    return Math.round(savings * 100) / 100;
  }

  calculateKwhSaved(): number {
    return Math.round(this.calculateSimSavings() * 3.4);
  }

  resetSimulation(): void {
    this.acTemp.set(22);
    this.offPeakShiftPct.set(0);
    this.ledBulbs.set(0);
    this.cutStandby.set(false);
  }

  saveSimulationPlan(): void {
    this.notifService.showToast(
      'Plan d\'Économie Actif !',
      `Objectif de -${this.calculateSimSavings()} DT/mois enregistré dans votre tableau de bord citoyen.`,
      'SUCCESS'
    );
  }

  exportReadingsCSV(): void {
    const headers = 'ID,Date,Index_kWh,Consommation_kWh,Montant_DT,Source,Statut\n';
    const rows = this.readings().map(r => `${r.id},${r.date},${r.indexKwh},${r.consumptionKwh},${r.costTnd},${r.source},${r.status}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Releves_Compteur_VoltTN_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    this.notifService.showToast('Export Réussi', 'Historique des relevés téléchargé en CSV.', 'SUCCESS');
  }

  getSourceBadge(source: string): string {
    if (source === 'OCR_PHOTO') return 'badge-sky';
    if (source === 'TELERELEVE') return 'badge-nature';
    return 'badge-sun';
  }

  getSourceIcon(source: string): string {
    if (source === 'OCR_PHOTO') return 'photo_camera';
    if (source === 'TELERELEVE') return 'sensors';
    return 'badge';
  }

  getSourceLabel(source: string): string {
    if (source === 'OCR_PHOTO') return 'Photo Citoyen OCR';
    if (source === 'TELERELEVE') return 'Télérelevé Automatique';
    return 'Contrôleur STEG';
  }
}
