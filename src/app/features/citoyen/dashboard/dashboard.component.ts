import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CitizenService } from '../../../core/services/citizen.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Meter3dComponent } from '../../../shared/components/meter-3d/meter-3d.component';
import { Tilt3dDirective } from '../../../shared/directives/tilt-3d.directive';

@Component({
  selector: 'app-citoyen-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Meter3dComponent, Tilt3dDirective],
  template: `
    <div class="dashboard-page">
      
      <!-- Bannière d'accueil chaleureuse et lumineuse -->
      <div class="welcome-banner glass-card animate-float">
        <div class="banner-content">
          <div class="badge-row">
            <span class="glass-badge badge-sun">
              <span class="material-symbols-rounded">wb_sunny</span>
              Compteur Télérelevé STEG
            </span>
            <span class="glass-badge badge-nature">Tarif Creux Actif</span>
            <span class="glass-badge badge-sky">Gouvernorat : {{ authService.currentUser()?.governorate }}</span>
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
          <button class="btn-primary" (click)="openProfileModal()">
            <span class="material-symbols-rounded">manage_accounts</span>
            <span>Mon Compte & Préférences</span>
          </button>
          <a routerLink="/solar" class="btn-secondary">
            <span class="material-symbols-rounded">solar_power</span>
            <span>Simulateur Solaire</span>
          </a>
          <a routerLink="/citoyen/report-outage" class="btn-coral">
            <span class="material-symbols-rounded">report_problem</span>
            <span>Signaler une Panne</span>
          </a>
        </div>
      </div>

      <!-- Alerte de Seuil Personnel / Surconsommation si dépassement -->
      @if (isOverThreshold()) {
        <div class="alert-banner alert-over-threshold glass-card animate-float">
          <div class="alert-icon-box coral">
            <span class="material-symbols-rounded">warning</span>
          </div>
          <div class="alert-text">
            <div class="alert-heading text-coral">Alerte Seuil de Consommation Dépassé !</div>
            <div class="alert-body">
              Votre consommation mensuelle projetée ({{ citizenService.consumption().monthForecastKwh }} kWh) dépasse votre seuil configuré de <strong>{{ consumptionThresholdKwh() }} kWh</strong> (~{{ thresholdCostTnd() }} DT).
            </div>
          </div>
          <button class="btn-secondary" (click)="openThresholdModal()">
            <span class="material-symbols-rounded">tune</span>
            <span>Ajuster mon Seuil</span>
          </button>
        </div>
      } @else {
        <!-- Recommandation Aube & Canicule -->
        <div class="alert-banner glass-card">
          <div class="alert-icon-box">
            <span class="material-symbols-rounded">energy_savings_leaf</span>
          </div>
          <div class="alert-text">
            <div class="alert-heading">Recommandation Aube & Canicule STEG</div>
            <div class="alert-body">
              Forte chaleur prévue cet après-midi sur le Grand Tunis (34°C). Réglez vos climatiseurs sur 26°C pour économiser jusqu'à <strong>45 DT</strong> sur votre prochaine facture.
            </div>
          </div>
          <button class="btn-secondary" (click)="triggerPowerRestoredSimulation()">
            <span class="material-symbols-rounded">notifications_active</span>
            <span>Tester Alerte Retour Courant</span>
          </button>
        </div>
      }

      <!-- Grille Principale : Compteur 3D + Chiffres Clés -->
      <div class="main-grid">
        
        <!-- Carte Compteur 3D Interactif (Three.js) -->
        <div class="glass-card meter-card" appTilt3d [maxTilt]="6">
          <div class="card-header">
            <div>
              <div class="card-title-row">
                <h2 class="card-title">Compteur Intelligent 3D</h2>
                <button class="btn-mini-link" (click)="openMeterConfigModal()">
                  <span class="material-symbols-rounded">edit</span>
                  <span>Modifier Compteur</span>
                </button>
              </div>
              <span class="card-sub">N° {{ currentMeterId() }} • {{ meterTariffType() }}</span>
            </div>
            <span class="live-pulse-badge">
              <span class="dot"></span>
              Flux temps réel STEG
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
              <span class="stat-label">Estimation Facture Bimestrielle</span>
              <div class="stat-value-row">
                <span class="stat-value">{{ citizenService.consumption().estimatedBillTnd | number:'1.1-1' }}</span>
                <span class="stat-unit">DT</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill sun" style="width: 58%;"></div>
              </div>
              <span class="stat-trend trend-good">
                <span class="material-symbols-rounded">trending_down</span>
                -8% par rapport à la même période 2024
              </span>
            </div>
          </div>

          <div class="stat-card glass-card" appTilt3d [maxTilt]="8">
            <div class="stat-icon-wrapper sky">
              <span class="material-symbols-rounded">query_stats</span>
            </div>
            <div class="stat-info">
              <span class="stat-label">Prévision ML Fin de Mois</span>
              <div class="stat-value-row">
                <span class="stat-value">{{ citizenService.consumption().monthForecastKwh }}</span>
                <span class="stat-unit">kWh</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill sky" [style.width.%]="(citizenService.consumption().monthForecastKwh / 600) * 100"></div>
              </div>
              <span class="stat-trend">
                Moyenne régionale : {{ citizenService.consumption().regionalAverageKwh }} kWh (+11% climatisation)
              </span>
            </div>
          </div>

          <!-- Configuration du Seuil Personnel -->
          <div class="stat-card glass-card" appTilt3d [maxTilt]="8">
            <div class="stat-icon-wrapper amber">
              <span class="material-symbols-rounded">notifications_active</span>
            </div>
            <div class="stat-info">
              <div class="thresh-top-row">
                <span class="stat-label">Mon Seuil Personnel</span>
                <button class="btn-thresh-edit" (click)="openThresholdModal()">Régler</button>
              </div>
              <div class="stat-value-row">
                <span class="stat-value">{{ consumptionThresholdKwh() }}</span>
                <span class="stat-unit">kWh / mois</span>
              </div>
              <div class="progress-bar-bg">
                <div 
                  class="progress-bar-fill" 
                  [class.coral]="isOverThreshold()"
                  [class.nature]="!isOverThreshold()"
                  [style.width.%]="Math.min(100, (citizenService.consumption().monthForecastKwh / consumptionThresholdKwh()) * 100)"
                ></div>
              </div>
              <span class="stat-trend" [class.text-coral]="isOverThreshold()" [class.trend-good]="!isOverThreshold()">
                {{ isOverThreshold() ? 'Dépassement de seuil en cours' : 'Consommation conforme au budget' }}
              </span>
            </div>
          </div>

        </div>

      </div>

      <!-- Graphique de suivi (Onglets Heure, Jour, Mois avec pic estival tunisien) -->
      <div class="glass-card chart-card">
        <div class="chart-header">
          <div>
            <h2 class="card-title">Suivi & Comparaison de la Consommation</h2>
            <p class="card-sub">Courbes horaires, journalières et saisonnières avec comparaison moyenne des foyers tunisiens</p>
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
              7 Derniers Jours (vs Semaine Préc.)
            </button>
            <button 
              class="tab-btn" 
              [class.active]="selectedTab() === 'monthly'"
              (click)="selectedTab.set('monthly')"
            >
              12 Mois (vs Moyenne Régionale)
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
                    <div 
                      class="bar-ref-line" 
                      [style.bottom.%]="(d.previousWeekKwh / 22) * 100" 
                      title="Semaine précédente: {{ d.previousWeekKwh }} kWh"
                    ></div>
                  </div>
                  <span class="bar-label">{{ d.dayName }}</span>
                  <span class="bar-sub-cost">{{ d.costTnd | number:'1.1-1' }} DT</span>
                </div>
              }
            </div>
          } @else {
            <div class="bars-container">
              @for (m of citizenService.consumption().monthlyHistory; track m.month) {
                <div class="bar-col">
                  <div class="bar-val">{{ m.kwh }}</div>
                  <div class="bar-track">
                    <!-- Barre de référence : moyenne régionale -->
                    <div 
                      class="bar-regional-ref" 
                      [style.height.%]="(m.regionalAverageKwh / 700) * 100"
                      title="Moyenne régionale: {{ m.regionalAverageKwh }} kWh"
                    ></div>
                    <div 
                      class="bar-fill" 
                      [class.peak-summer]="m.month === 'Juil' || m.month === 'Août'"
                      [style.height.%]="(m.kwh / 700) * 100"
                    ></div>
                  </div>
                  <span class="bar-label">{{ m.month }}</span>
                  <span class="bar-sub-cost">{{ m.costTnd | number:'1.0-0' }} DT</span>
                </div>
              }
            </div>
          }
        </div>

        <div class="chart-legend-row">
          <div class="legend-item">
            <span class="bullet sun"></span>
            <span>Ma Consommation</span>
          </div>
          <div class="legend-item">
            <span class="bullet coral"></span>
            <span>Pic Canicule Estivale (Juillet/Août)</span>
          </div>
          <div class="legend-item">
            <span class="bullet sky"></span>
            <span>Moyenne des Foyers Similaires (STEG)</span>
          </div>
        </div>
      </div>

      <!-- Conseils personnalisés d'économie d'énergie -->
      <div class="tips-section">
        <div class="section-header">
          <div>
            <h2 class="card-title">Conseils Économies d'Énergie Spécial Tunisie</h2>
            <p class="card-sub">Recommandations calculées par IA selon votre profil de consommation</p>
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
                  -{{ tip.savingsTndPerMonth }} DT / mois
                </div>
              </div>
              <h3 class="tip-title">{{ tip.title }}</h3>
              <p class="tip-desc">{{ tip.description }}</p>
              <div class="tip-footer">
                <span class="glass-badge badge-nature">{{ tip.difficulty }}</span>
                <span class="glass-badge badge-sun">{{ tip.category }}</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- ================= MODAL 1 : MON COMPTE & PRÉFÉRENCES ================= -->
      @if (showProfileModal()) {
        <div class="modal-backdrop animate-float" (click)="closeProfileModal()">
          <div class="modal-card glass-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-box">
                <span class="material-symbols-rounded text-sun">manage_accounts</span>
                <h3>Mon Profil & Préférences</h3>
              </div>
              <button class="btn-close" (click)="closeProfileModal()">
                <span class="material-symbols-rounded">close</span>
              </button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nom et Prénom :</label>
                <input type="text" class="form-input" [(ngModel)]="profileName" />
              </div>

              <div class="form-group">
                <label class="form-label">Adresse en Tunisie :</label>
                <input type="text" class="form-input" [(ngModel)]="profileAddress" />
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Gouvernorat :</label>
                  <input type="text" class="form-input" [(ngModel)]="profileGov" />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Numéro Téléphone :</label>
                  <input type="text" class="form-input" [(ngModel)]="profilePhone" />
                </div>
              </div>

              <div class="pref-section-title">Canaux de Notification :</div>
              <div class="toggles-list">
                <label class="toggle-item">
                  <input type="checkbox" [(ngModel)]="notifApp" />
                  <span>Notifications Application Push (Temps Réel)</span>
                </label>
                <label class="toggle-item">
                  <input type="checkbox" [(ngModel)]="notifEmail" />
                  <span>Alertes par Email (Coupures & Factures)</span>
                </label>
                <label class="toggle-item">
                  <input type="checkbox" [(ngModel)]="notifSms" />
                  <span>SMS d'Urgence en cas de Surcharge Réseau</span>
                </label>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeProfileModal()">Annuler</button>
              <button class="btn-primary" (click)="saveProfileChanges()">Enregistrer les modifications</button>
            </div>
          </div>
        </div>
      }

      <!-- ================= MODAL 2 : ASSOCIER / MODIFIER COMPTEUR ================= -->
      @if (showMeterModal()) {
        <div class="modal-backdrop animate-float" (click)="showMeterModal.set(false)">
          <div class="modal-card glass-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-box">
                <span class="material-symbols-rounded text-sky">speed</span>
                <h3>Associer mon Compteur Électrique STEG</h3>
              </div>
              <button class="btn-close" (click)="showMeterModal.set(false)">
                <span class="material-symbols-rounded">close</span>
              </button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Numéro de Compteur (Matricule STEG) :</label>
                <input type="text" class="form-input" [(ngModel)]="meterNumberInput" placeholder="Ex: MTR-TN-882419" />
              </div>

              <div class="form-group">
                <label class="form-label">Adresse de raccordement :</label>
                <input type="text" class="form-input" [(ngModel)]="meterAddressInput" />
              </div>

              <div class="form-group">
                <label class="form-label">Type de Tarif STEG :</label>
                <select class="form-select" [(ngModel)]="meterTariffInput">
                  <option value="Tarif Basse Tension Bleu (Résidentiel Standard)">Tarif Basse Tension Bleu (Résidentiel Standard)</option>
                  <option value="Tarif Jaune Professionnel">Tarif Jaune Professionnel / Artisanal</option>
                  <option value="Tarif Économique Social (0 - 50 kWh)">Tarif Économique Social (0 - 50 kWh)</option>
                </select>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" (click)="showMeterModal.set(false)">Annuler</button>
              <button class="btn-primary" (click)="saveMeterChanges()">Associer & Synchroniser</button>
            </div>
          </div>
        </div>
      }

      <!-- ================= MODAL 3 : RÉGLER LE SEUIL PERSONNEL ================= -->
      @if (showThresholdModal()) {
        <div class="modal-backdrop animate-float" (click)="showThresholdModal.set(false)">
          <div class="modal-card glass-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-box">
                <span class="material-symbols-rounded text-sun">tune</span>
                <h3>Définir mon Seuil de Consommation Personnel</h3>
              </div>
              <button class="btn-close" (click)="showThresholdModal.set(false)">
                <span class="material-symbols-rounded">close</span>
              </button>
            </div>

            <div class="modal-body">
              <p class="modal-desc">
                Définissez la limite maximale mensuelle au-delà de laquelle vous souhaitez être alerté par notification et email pour éviter les mauvaises surprises sur votre facture STEG.
              </p>

              <div class="threshold-slider-box">
                <div class="slider-val-display">
                  <span class="t-kwh">{{ tempThreshold }} kWh</span>
                  <span class="t-cost">~{{ (tempThreshold * 0.338) | number:'1.0-0' }} DT</span>
                </div>
                <input 
                  type="range" 
                  class="range-slider" 
                  min="150" 
                  max="800" 
                  step="10" 
                  [(ngModel)]="tempThreshold" 
                />
                <div class="slider-limits">
                  <span>150 kWh (Frugal)</span>
                  <span>450 kWh (Moyen)</span>
                  <span>800 kWh (Climatisation intensive)</span>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" (click)="showThresholdModal.set(false)">Annuler</button>
              <button class="btn-primary" (click)="saveThreshold()">Valider le nouveau seuil</button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 40px;
    }

    .welcome-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 28px 32px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(255, 246, 233, 0.9) 100%);
      border: 1px solid rgba(255, 183, 3, 0.35);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      gap: 20px;
      flex-wrap: wrap;
    }

    .badge-row {
      display: flex;
      gap: 10px;
      margin-bottom: 12px;
      flex-wrap: wrap;
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

    .highlight-val { color: var(--sun-amber); font-weight: 800; }
    .highlight-nature { color: var(--nature-green); font-weight: 800; }

    .banner-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn-coral {
      padding: 10px 18px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, #FF6B6B 0%, #D90429 100%);
      color: #FFFFFF;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.35);
      transition: all var(--transition-fast);
      &:hover { transform: translateY(-2px); }
    }

    /* Alerts */
    .alert-banner {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 22px;
      border-radius: var(--radius-lg);
      background: rgba(255, 255, 255, 0.92);
      border: 1.5px solid rgba(82, 183, 136, 0.4);
      flex-wrap: wrap;

      &.alert-over-threshold {
        border-color: var(--alert-coral);
        background: rgba(255, 240, 240, 0.95);
      }
    }

    .alert-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--nature-light);
      color: var(--nature-green);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
      &.coral { background: var(--alert-coral-light); color: var(--alert-coral); }
    }

    .alert-text {
      flex: 1;
      min-width: 260px;
    }

    .alert-heading {
      font-size: 14.5px;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 2px;
    }

    .alert-body {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.4;
    }

    /* Grille principale */
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
    }

    .meter-card {
      padding: 24px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .card-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .card-title {
      font-size: 20px;
      font-weight: 900;
      color: var(--text-main);
    }

    .btn-mini-link {
      background: none;
      border: none;
      color: var(--sky-deep);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 700;
      .material-symbols-rounded { font-size: 15px; }
      &:hover { text-decoration: underline; }
    }

    .card-sub {
      font-size: 12.5px;
      color: var(--text-light);
    }

    .live-pulse-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: var(--radius-full);
      background: rgba(82, 183, 136, 0.15);
      color: var(--nature-green);
      font-size: 11.5px;
      font-weight: 800;

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--nature-green);
        box-shadow: 0 0 8px rgba(82, 183, 136, 0.8);
      }
    }

    .meter-footer-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      background: rgba(255, 251, 242, 0.7);
      padding: 12px 16px;
      border-radius: var(--radius-md);
      text-align: center;
    }

    .f-metric {
      display: flex;
      flex-direction: column;
      gap: 2px;
      .label { font-size: 11px; color: var(--text-muted); font-weight: 600; }
      .value { font-size: 15px; font-weight: 900; color: var(--text-main); }
    }

    /* Stats column */
    .stats-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .stat-card {
      padding: 18px;
      border-radius: var(--radius-lg);
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      flex-shrink: 0;

      &.sun { background: var(--sun-light); color: var(--sun-amber); }
      &.sky { background: var(--sky-light); color: var(--sky-ocean); }
      &.nature { background: var(--nature-light); color: var(--nature-green); }
      &.amber { background: #FFF4E5; color: #D97706; }
    }

    .stat-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .thresh-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .btn-thresh-edit {
      background: none;
      border: none;
      color: var(--sun-amber);
      font-size: 11.5px;
      font-weight: 800;
      cursor: pointer;
      &:hover { text-decoration: underline; }
    }

    .stat-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
    }

    .stat-value-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
      .stat-value { font-size: 22px; font-weight: 900; color: var(--text-main); }
      .stat-unit { font-size: 13px; font-weight: 700; color: var(--text-light); }
    }

    .progress-bar-bg {
      height: 6px;
      border-radius: var(--radius-full);
      background: rgba(29, 53, 87, 0.08);
      overflow: hidden;
      margin: 4px 0;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: var(--radius-full);
      &.sun { background: var(--sun-gradient); }
      &.sky { background: var(--sky-gradient); }
      &.nature { background: var(--nature-gradient); }
      &.coral { background: linear-gradient(135deg, #FF6B6B 0%, #D90429 100%); }
    }

    .stat-trend {
      font-size: 11px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
      .material-symbols-rounded { font-size: 15px; }
      &.trend-good { color: var(--nature-green); font-weight: 700; }
    }

    /* Chart section */
    .chart-card {
      padding: 24px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 20px;
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

    .chart-visual {
      height: 240px;
      width: 100%;
    }

    .bars-container {
      display: flex;
      height: 100%;
      align-items: flex-end;
      gap: 14px;
      padding-bottom: 20px;
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
      font-weight: 800;
      color: var(--text-main);
    }

    .bar-track {
      position: relative;
      width: 22px;
      height: 160px;
      background: rgba(29, 53, 87, 0.06);
      border-radius: var(--radius-full);
      display: flex;
      align-items: flex-end;
      overflow: hidden;
    }

    .bar-fill {
      width: 100%;
      border-radius: var(--radius-full);
      background: var(--sun-gradient);
      transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1);

      &.peak { background: linear-gradient(180deg, #FF6B6B 0%, #FB8500 100%); }
      &.peak-summer { background: linear-gradient(180deg, #D90429 0%, #FFB703 100%); }
      &.sky { background: var(--sky-gradient); }
    }

    .bar-ref-line {
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--text-light);
      border-top: 1px dashed rgba(29, 53, 87, 0.4);
    }

    .bar-regional-ref {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(76, 201, 240, 0.2);
      border-top: 2px solid var(--sky-blue);
      border-radius: var(--radius-full);
    }

    .bar-label {
      font-size: 11.5px;
      font-weight: 700;
      color: var(--text-muted);
    }

    .bar-sub-cost {
      font-size: 10.5px;
      color: var(--text-light);
    }

    .chart-legend-row {
      display: flex;
      gap: 18px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-main);
    }

    .bullet {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      &.sun { background: var(--sun-gold); }
      &.coral { background: var(--alert-coral); }
      &.sky { background: var(--sky-blue); }
    }

    /* Tips section */
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
      font-size: 15px;
      font-weight: 800;
      color: var(--text-main);
    }

    .tip-desc {
      font-size: 12.5px;
      color: var(--text-muted);
      line-height: 1.4;
      flex: 1;
    }

    .tip-footer {
      display: flex;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(29, 53, 87, 0.08);
    }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(29, 53, 87, 0.4);
      backdrop-filter: blur(6px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-card {
      width: 100%;
      max-width: 520px;
      background: rgba(255, 255, 255, 0.98);
      border-radius: var(--radius-xl);
      padding: 28px;
      box-shadow: var(--shadow-lg);
      border: 1.5px solid var(--border-glass);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title-box {
      display: flex;
      align-items: center;
      gap: 10px;
      h3 { font-size: 18px; font-weight: 900; color: var(--text-main); }
    }

    .btn-close {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-light);
      &:hover { color: var(--alert-coral); }
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-row { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 12.5px;
      font-weight: 700;
      color: var(--text-main);
    }

    .form-input, .form-select {
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1.5px solid rgba(29, 53, 87, 0.12);
      font-size: 13.5px;
      color: var(--text-main);
      outline: none;
      &:focus { border-color: var(--sun-gold); }
    }

    .pref-section-title {
      font-size: 13px;
      font-weight: 800;
      color: var(--text-main);
      margin-top: 6px;
    }

    .toggles-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .toggle-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      input { width: 18px; height: 18px; accent-color: var(--sun-gold); }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 14px;
      border-top: 1px solid rgba(29, 53, 87, 0.08);
    }

    .threshold-slider-box {
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: rgba(255, 251, 242, 0.8);
      padding: 16px;
      border-radius: var(--radius-md);
    }

    .slider-val-display {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      .t-kwh { font-size: 24px; font-weight: 900; color: var(--sun-amber); }
      .t-cost { font-size: 16px; font-weight: 700; color: var(--text-muted); }
    }

    .range-slider {
      width: 100%;
      accent-color: var(--sun-amber);
    }

    .slider-limits {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-light);
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
  notifService = inject(NotificationService);

  Math = Math;
  selectedTab = signal<'hourly' | 'daily' | 'monthly'>('monthly');

  // Modals
  showProfileModal = signal<boolean>(false);
  showMeterModal = signal<boolean>(false);
  showThresholdModal = signal<boolean>(false);

  // Profile data
  profileName = this.authService.currentUser()?.name || 'Yassine Ben Salem';
  profileAddress = this.authService.currentUser()?.address || '14 Rue de la Liberté, Menzah 6, Tunis';
  profileGov = this.authService.currentUser()?.governorate || 'Tunis';
  profilePhone = this.authService.currentUser()?.phone || '+216 22 456 789';
  notifApp = true;
  notifEmail = true;
  notifSms = false;

  // Meter data
  currentMeterId = signal<string>(this.citizenService.consumption().meterId);
  meterNumberInput = this.citizenService.consumption().meterId;
  meterAddressInput = this.citizenService.consumption().address;
  meterTariffType = signal<string>('Tarif Basse Tension Bleu (Résidentiel Standard)');
  meterTariffInput = 'Tarif Basse Tension Bleu (Résidentiel Standard)';

  // Threshold data
  consumptionThresholdKwh = signal<number>(400); // 400 kWh seuil personnel
  tempThreshold = 400;

  isOverThreshold(): boolean {
    return this.citizenService.consumption().monthForecastKwh > this.consumptionThresholdKwh();
  }

  thresholdCostTnd(): number {
    return Math.round(this.consumptionThresholdKwh() * 0.338);
  }

  openProfileModal(): void {
    this.profileName = this.authService.currentUser()?.name || '';
    this.profileAddress = this.authService.currentUser()?.address || '';
    this.profileGov = this.authService.currentUser()?.governorate || 'Tunis';
    this.profilePhone = this.authService.currentUser()?.phone || '';
    this.showProfileModal.set(true);
  }

  closeProfileModal(): void {
    this.showProfileModal.set(false);
  }

  saveProfileChanges(): void {
    const user = this.authService.currentUser();
    if (user) {
      user.name = this.profileName;
      user.address = this.profileAddress;
      user.governorate = this.profileGov;
      user.phone = this.profilePhone;
      localStorage.setItem('volttn_user', JSON.stringify(user));
    }
    this.notifService.showToast('Profil Mis à Jour', 'Vos coordonnées et préférences de notification ont été enregistrées.', 'SUCCESS');
    this.closeProfileModal();
  }

  openMeterConfigModal(): void {
    this.meterNumberInput = this.currentMeterId();
    this.showMeterModal.set(true);
  }

  saveMeterChanges(): void {
    if (this.meterNumberInput.trim()) {
      this.currentMeterId.set(this.meterNumberInput.trim());
      this.meterTariffType.set(this.meterTariffInput);
      this.notifService.showToast('Compteur Associé', `Compteur ${this.meterNumberInput} lié avec succès à votre compte.`, 'SUCCESS');
    }
    this.showMeterModal.set(false);
  }

  openThresholdModal(): void {
    this.tempThreshold = this.consumptionThresholdKwh();
    this.showThresholdModal.set(true);
  }

  saveThreshold(): void {
    this.consumptionThresholdKwh.set(this.tempThreshold);
    this.notifService.showToast('Seuil Personnalisé Enregistré', `Seuil fixé à ${this.tempThreshold} kWh/mois. Alertes actives.`, 'SUCCESS');
    this.showThresholdModal.set(false);
  }

  triggerPowerRestoredSimulation(): void {
    this.notifService.addNotification({
      title: 'Courant Rétabli dans votre Quartier !',
      titleAr: 'تمت عودة التيار الكهربائي بحيكم',
      message: 'L\'incident à Menzah 6 a été résolu par les techniciens STEG. Votre alimentation est de nouveau stable.',
      messageAr: 'تم إصلاح العطب بنجاح. التيار الكهربائي عاد للعمل بصورة طبيعية.',
      type: 'SUCCESS',
      targetRole: 'CITOYEN'
    });
  }
}
