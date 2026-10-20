import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CitizenService } from '../../../core/services/citizen.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Tilt3dDirective } from '../../../shared/directives/tilt-3d.directive';

export interface MonthlyChallenge {
  id: string;
  title: string;
  desc: string;
  icon: string;
  targetDays: number;
  currentDays: number;
  pointsReward: number;
  status: 'EN_COURS' | 'VALIDE';
}

@Component({
  selector: 'app-eco-coach',
  standalone: true,
  imports: [CommonModule, FormsModule, Tilt3dDirective],
  template: `
    <div class="coach-page">
      
      <!-- En-tête Coach Énergie & Éco-Score -->
      <div class="coach-header glass-card animate-float">
        <div class="header-left">
          <div class="badge-row">
            <span class="glass-badge badge-nature">
              <span class="material-symbols-rounded">eco</span>
              Coach Virtuel & Éco-Score Citoyen
            </span>
            <span class="glass-badge badge-sun">Défis Mensuels STEG</span>
            <span class="glass-badge badge-sky">Optimiseur Heures Creuses</span>
          </div>
          <h1 class="header-title">Votre Coach Énergie & Éco-Score National</h1>
          <p class="header-desc">
            Relevez des défis simples pour faire chuter votre facture, comparez votre gouvernorat aux autres régions tunisiennes et lancez vos appareils au moment le plus rentable.
          </p>
        </div>
        
        <div class="header-actions">
          <button class="btn-primary" (click)="generateMonthlyPdfReport()">
            <span class="material-symbols-rounded">picture_as_pdf</span>
            <span>Télécharger mon Bilan PDF</span>
          </button>
        </div>
      </div>

      <!-- Section 1 : Carte Éco-Score 3D + Optimiseur Heures Creuses -->
      <div class="coach-top-grid">
        
        <!-- Jauge Circulaire Éco-Score du Foyer -->
        <div class="score-card glass-card" appTilt3d [maxTilt]="6">
          <div class="card-head">
            <div>
              <h2 class="card-title">Éco-Score de Votre Foyer</h2>
              <p class="card-subtitle">Calculé selon votre profil horaire, vos pointes et vos écogestes :</p>
            </div>
            <span class="glass-badge badge-nature">Niveau A : Exemplaire</span>
          </div>

          <div class="gauge-wrapper">
            <svg class="svg-gauge" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="68" class="gauge-bg" />
              <circle 
                cx="80" 
                cy="80" 
                r="68" 
                class="gauge-fill" 
                [style.strokeDashoffset]="427 - (427 * ecoScore() / 100)"
              />
            </svg>
            <div class="gauge-center-content">
              <span class="score-num text-nature">{{ ecoScore() }}</span>
              <span class="score-max">/ 100</span>
              <span class="score-rank">Top 8% Tunisie</span>
            </div>
          </div>

          <div class="pillars-list">
            <div class="pillar-row">
              <div class="p-meta">
                <span>Usage en Heures Creuses :</span>
                <strong>88%</strong>
              </div>
              <div class="p-bar"><div class="p-fill" style="width: 88%"></div></div>
            </div>
            <div class="pillar-row">
              <div class="p-meta">
                <span>Maîtrise des Pointes Estivales :</span>
                <strong>78%</strong>
              </div>
              <div class="p-bar"><div class="p-fill" style="width: 78%"></div></div>
            </div>
            <div class="pillar-row">
              <div class="p-meta">
                <span>Régularité des Écogestes :</span>
                <strong>92%</strong>
              </div>
              <div class="p-bar"><div class="p-fill" style="width: 92%"></div></div>
            </div>
          </div>

        </div>

        <!-- Optimiseur Heures Creuses IA -->
        <div class="optimizer-card glass-card">
          <div class="card-head">
            <div>
              <h2 class="card-title">Optimiseur d'Heures Creuses (IA)</h2>
              <p class="card-subtitle">Meilleurs créneaux pour lancer vos appareils au tarif réduit STEG :</p>
            </div>
            <span class="glass-badge badge-sun">Économie : -32%</span>
          </div>

          <div class="schedule-clock-bar glass-panel">
            <div class="clock-segment green" title="22h - 06h : Tarif Réduit (0.181 DT)">
              <span class="seg-time">22h - 06h</span>
              <strong class="seg-rate">HEURES CREUSES (0.181 DT)</strong>
              <span class="seg-hint">Idéal pour lave-linge, chauffe-eau, recharge</span>
            </div>
            <div class="clock-segment amber" title="06h - 18h : Tarif Normal (0.223 DT)">
              <span class="seg-time">06h - 18h</span>
              <strong class="seg-rate">HEURES NORMALES (0.223 DT)</strong>
              <span class="seg-hint">Consommation courante modérée</span>
            </div>
            <div class="clock-segment red" title="18h - 22h : Pic National (0.410 DT)">
              <span class="seg-time">18h - 22h</span>
              <strong class="seg-rate">HEURE DE POINTE STEG (0.410 DT)</strong>
              <span class="seg-hint">Évitez les appareils énergivores</span>
            </div>
          </div>

          <div class="appliance-selector">
            <span class="sel-label">Simuler le créneau idéal pour :</span>
            <div class="appliance-buttons">
              <button 
                class="app-btn" 
                [class.active]="selectedAppliance() === 'washing'" 
                (click)="selectedAppliance.set('washing')"
              >
                <span class="material-symbols-rounded">local_laundry_service</span>
                <span>Lave-Linge</span>
              </button>
              <button 
                class="app-btn" 
                [class.active]="selectedAppliance() === 'water_heater'" 
                (click)="selectedAppliance.set('water_heater')"
              >
                <span class="material-symbols-rounded">water_heater</span>
                <span>Chauffe-eau</span>
              </button>
              <button 
                class="app-btn" 
                [class.active]="selectedAppliance() === 'ev'" 
                (click)="selectedAppliance.set('ev')"
              >
                <span class="material-symbols-rounded">electric_car</span>
                <span>Recharge Véhicule</span>
              </button>
            </div>

            <div class="appliance-advice-box glass-panel animate-float">
              <span class="material-symbols-rounded advice-icon">timer</span>
              <div>
                <strong>Programmation Recommandée : {{ getApplianceRecommendation().timeSlot }}</strong>
                <p>{{ getApplianceRecommendation().text }} Économie estimée : <strong class="text-nature">{{ getApplianceRecommendation().savings }}</strong>.</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- Section 2 : Défis Mensuels d'Économie + Classement des Gouvernorats -->
      <div class="coach-bottom-grid">
        
        <!-- Défis d'Économie Mensuels -->
        <div class="challenges-card glass-card">
          <div class="card-head">
            <div>
              <h2 class="card-title">Défis Citoyens du Mois d'Octobre</h2>
              <p class="card-subtitle">Cumulez des points STEG pour décrocher des réductions et badges écologiques.</p>
            </div>
            <span class="total-points-badge">
              <span class="material-symbols-rounded">military_tech</span>
              <span>420 Points Cumulés</span>
            </span>
          </div>

          <div class="challenges-list">
            @for (ch of challenges(); track ch.id) {
              <div class="challenge-item glass-panel">
                <div class="ch-icon-wrap" [class.done]="ch.status === 'VALIDE'">
                  <span class="material-symbols-rounded">{{ ch.icon }}</span>
                </div>
                <div class="ch-content">
                  <div class="ch-top">
                    <strong>{{ ch.title }}</strong>
                    <span class="ch-pts">+{{ ch.pointsReward }} pts</span>
                  </div>
                  <p class="ch-desc">{{ ch.desc }}</p>

                  <div class="ch-progress-row">
                    <div class="ch-bar">
                      <div class="ch-fill" [style.width.%]="(ch.currentDays / ch.targetDays) * 100"></div>
                    </div>
                    <span class="ch-count">{{ ch.currentDays }}/{{ ch.targetDays }} jours</span>
                  </div>
                </div>

                <button 
                  class="btn-sm" 
                  [ngClass]="ch.status === 'VALIDE' ? 'btn-nature' : 'btn-sky'"
                  (click)="validateDayAction(ch)"
                >
                  <span class="material-symbols-rounded">{{ ch.status === 'VALIDE' ? 'check' : 'add_task' }}</span>
                  <span>{{ ch.status === 'VALIDE' ? 'Validé !' : 'Valider mon écogeste' }}</span>
                </button>
              </div>
            }
          </div>
        </div>

        <!-- Classement des Gouvernorats -->
        <div class="ranking-card glass-card">
          <div class="card-head">
            <div>
              <h2 class="card-title">Classement Éco-Score National</h2>
              <p class="card-subtitle">Moyenne de sobriété énergétique des foyers par gouvernorat :</p>
            </div>
            <span class="glass-badge badge-nature">Podium 24 Régions</span>
          </div>

          <div class="ranking-table-wrap">
            <table class="volttn-table">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Gouvernorat</th>
                  <th>Éco-Score Moyen</th>
                  <th>Tendance</th>
                </tr>
              </thead>
              <tbody>
                @for (gov of governoratesRanking; track gov.rank) {
                  <tr [class.highlight-my-gov]="gov.name === authService.currentUser()?.governorate">
                    <td>
                      <div class="rank-badge" [ngClass]="'rank-' + gov.rank">
                        {{ gov.rank === 1 ? '🥇' : (gov.rank === 2 ? '🥈' : (gov.rank === 3 ? '🥉' : gov.rank)) }}
                      </div>
                    </td>
                    <td>
                      <strong>{{ gov.name }}</strong>
                      @if (gov.name === authService.currentUser()?.governorate) {
                        <span class="my-gov-tag">Votre Région</span>
                      }
                    </td>
                    <td><strong class="text-nature">{{ gov.avgScore }} / 100</strong></td>
                    <td>
                      <span class="trend-badge text-nature">
                        <span class="material-symbols-rounded">trending_up</span>
                        <span>+{{ gov.gainPts }} pts</span>
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .coach-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 50px;
    }

    .coach-header {
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

    /* Top Grid */
    .coach-top-grid, .coach-bottom-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 24px;
    }

    .score-card, .optimizer-card, .challenges-card, .ranking-card {
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

    /* SVG Gauge */
    .gauge-wrapper {
      position: relative;
      width: 170px;
      height: 170px;
      margin: 10px auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .svg-gauge {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .gauge-bg {
      fill: none;
      stroke: rgba(29, 53, 87, 0.08);
      stroke-width: 14;
    }

    .gauge-fill {
      fill: none;
      stroke: #52B788;
      stroke-width: 14;
      stroke-linecap: round;
      stroke-dasharray: 427;
      transition: stroke-dashoffset 1s ease-out;
    }

    .gauge-center-content {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      .score-num { font-size: 44px; font-weight: 900; line-height: 1; }
      .score-max { font-size: 13px; color: var(--text-light); font-weight: 800; }
      .score-rank { font-size: 11px; color: var(--text-muted); font-weight: 700; margin-top: 4px; }
    }

    .pillars-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .pillar-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      .p-meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: var(--text-muted);
        strong { color: var(--text-main); }
      }
      .p-bar {
        width: 100%;
        height: 6px;
        border-radius: var(--radius-full);
        background: rgba(29, 53, 87, 0.08);
        overflow: hidden;
      }
      .p-fill {
        height: 100%;
        border-radius: var(--radius-full);
        background: var(--nature-gradient);
      }
    }

    /* Clock Bar */
    .schedule-clock-bar {
      padding: 16px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .clock-segment {
      padding: 10px 14px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 12px;
      border-left: 4px solid transparent;

      &.green { background: rgba(82, 183, 136, 0.12); border-color: var(--nature-green); color: #2D6A4F; }
      &.amber { background: rgba(251, 133, 0, 0.12); border-color: var(--sun-amber); color: #B36800; }
      &.red { background: rgba(255, 107, 107, 0.12); border-color: var(--alert-coral); color: #B91C1C; }

      .seg-time { font-size: 11px; font-weight: 800; }
      .seg-rate { font-size: 13.5px; font-weight: 900; }
      .seg-hint { font-size: 11px; opacity: 0.9; }
    }

    /* Appliance Selector */
    .appliance-selector {
      display: flex;
      flex-direction: column;
      gap: 12px;
      .sel-label { font-size: 12px; font-weight: 700; color: var(--text-muted); }
    }

    .appliance-buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .app-btn {
      flex: 1;
      padding: 10px;
      border-radius: var(--radius-md);
      border: 1.5px solid rgba(29, 53, 87, 0.1);
      background: #FFFFFF;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-main);
      transition: all var(--transition-fast);

      .material-symbols-rounded { font-size: 24px; color: var(--sky-ocean); }

      &:hover {
        border-color: var(--sun-amber);
        transform: translateY(-2px);
      }

      &.active {
        border-color: var(--nature-green);
        background: rgba(234, 247, 240, 0.7);
        color: #2D6A4F;
        .material-symbols-rounded { color: var(--nature-green); }
      }
    }

    .appliance-advice-box {
      padding: 14px 18px;
      border-radius: var(--radius-md);
      display: flex;
      gap: 14px;
      align-items: center;
      background: rgba(255, 255, 255, 0.95);
      border-left: 4px solid var(--nature-green);
      font-size: 12.5px;
      color: var(--text-main);
      line-height: 1.4;

      .advice-icon { font-size: 28px; color: var(--nature-green); flex-shrink: 0; }
    }

    /* Challenges */
    .total-points-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: var(--radius-full);
      background: var(--sun-light);
      color: #A35C00;
      font-size: 13px;
      font-weight: 900;
      .material-symbols-rounded { font-size: 18px; }
    }

    .challenges-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .challenge-item {
      display: flex;
      gap: 16px;
      padding: 16px;
      border-radius: var(--radius-md);
      align-items: center;
    }

    .ch-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--sun-light);
      color: var(--sun-amber);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      .material-symbols-rounded { font-size: 24px; }
      &.done { background: var(--nature-light); color: var(--nature-green); }
    }

    .ch-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .ch-top {
      display: flex;
      justify-content: space-between;
      font-size: 13.5px;
      strong { color: var(--text-main); }
      .ch-pts { font-weight: 800; color: var(--sun-amber); }
    }

    .ch-desc { font-size: 12px; color: var(--text-muted); }

    .ch-progress-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 4px;
    }

    .ch-bar {
      flex: 1;
      height: 6px;
      border-radius: var(--radius-full);
      background: rgba(29, 53, 87, 0.08);
      overflow: hidden;
    }

    .ch-fill {
      height: 100%;
      background: var(--sun-gradient);
      border-radius: var(--radius-full);
    }

    .ch-count { font-size: 11px; font-weight: 800; color: var(--text-light); }

    .btn-sm {
      padding: 8px 14px;
      font-size: 12px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      gap: 5px;
      font-weight: 800;
      cursor: pointer;
      white-space: nowrap;
      border: none;
      .material-symbols-rounded { font-size: 16px; }
    }

    .btn-nature { background: var(--nature-green); color: #FFFFFF; }

    /* Ranking Table */
    .ranking-table-wrap {
      width: 100%;
      overflow-x: auto;
    }

    .rank-badge {
      font-weight: 800;
      font-size: 14px;
    }

    .my-gov-tag {
      font-size: 10px;
      font-weight: 800;
      background: var(--sun-light);
      color: #A35C00;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 6px;
    }

    .highlight-my-gov {
      background: rgba(255, 183, 3, 0.08) !important;
    }

    .trend-badge {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: 12px;
      font-weight: 800;
      .material-symbols-rounded { font-size: 16px; }
    }

    /* ===== RESPONSIVE ECO COACH ===== */

    /* Tablet (641px – 1024px) */
    @media (max-width: 1024px) {
      .coach-top-grid, .coach-bottom-grid { grid-template-columns: 1fr; }
    }

    /* Mobile (≤ 640px) */
    @media (max-width: 640px) {
      .coach-page { gap: 12px; }

      .coach-header {
        flex-direction: column !important;
        gap: 12px;
        padding: 16px !important;
      }
      .header-title { font-size: 18px; }
      .header-desc { font-size: 12.5px; }
      .header-actions { width: 100%; button { width: 100%; } }

      .score-card, .optimizer-card { padding: 18px; }

      .gauge-wrapper {
        width: 140px !important;
        height: 140px !important;
      }
      .gauge-center-content .score-num { font-size: 34px; }

      .schedule-clock-bar { padding: 12px; gap: 8px; }
      .clock-segment { padding: 8px 12px; }
      .seg-rate { font-size: 12px; }

      .appliance-buttons { gap: 6px; }
      .appliance-btn { padding: 6px 10px; font-size: 11.5px; }

      /* Ranking table: scrollable */
      .ranking-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

      /* Challenges list */
      .challenge-card { padding: 14px 16px; gap: 8px; }
      .ch-top strong { font-size: 12.5px; }
    }

    /* Small mobile (≤ 380px) */
    @media (max-width: 380px) {
      .coach-top-grid { gap: 10px; }
      .appliance-buttons { flex-wrap: wrap; }
    }
  `]
})
export class EcoCoachComponent {
  citizenService = inject(CitizenService);
  authService = inject(AuthService);
  notifService = inject(NotificationService);

  ecoScore = signal<number>(84);
  selectedAppliance = signal<'washing' | 'water_heater' | 'ev'>('washing');

  challenges = signal<MonthlyChallenge[]>([
    {
      id: 'ch-01',
      title: 'Défi Climatisation 26°C',
      desc: 'Maintenez la température à 26°C minimum lors des journées chaudes.',
      icon: 'ac_unit',
      targetDays: 7,
      currentDays: 6,
      pointsReward: 120,
      status: 'EN_COURS'
    },
    {
      id: 'ch-02',
      title: 'Veille Zéro Nocturne',
      desc: 'Coupez vos multiprises avant de vous coucher (TV, box, ordi).',
      icon: 'nightlight',
      targetDays: 30,
      currentDays: 22,
      pointsReward: 150,
      status: 'EN_COURS'
    },
    {
      id: 'ch-03',
      title: 'Lessives en Heures Creuses',
      desc: 'Lancez vos machines après 22h00 pour profiter du tarif réduit.',
      icon: 'local_laundry_service',
      targetDays: 5,
      currentDays: 5,
      pointsReward: 100,
      status: 'VALIDE'
    }
  ]);

  governoratesRanking = [
    { rank: 1, name: 'Nabeul', avgScore: 88, gainPts: 4.2 },
    { rank: 2, name: 'Tozeur', avgScore: 86, gainPts: 3.8 },
    { rank: 3, name: 'Tunis', avgScore: 84, gainPts: 2.5 },
    { rank: 4, name: 'Sousse', avgScore: 81, gainPts: 1.9 },
    { rank: 5, name: 'Bizerte', avgScore: 79, gainPts: 3.1 },
    { rank: 6, name: 'Sfax', avgScore: 78, gainPts: 1.2 }
  ];

  getApplianceRecommendation() {
    switch (this.selectedAppliance()) {
      case 'washing':
        return {
          timeSlot: 'Entre 22h30 et 05h00',
          text: 'Décaler votre lave-linge en heure creuse réduit son coût par cycle de 0.850 DT à 0.420 DT.',
          savings: '-18 DT / mois'
        };
      case 'water_heater':
        return {
          timeSlot: 'Entre 23h00 et 04h00 (Minuterie)',
          text: 'Chauffer l\'eau sanitaire la nuit maintient la réserve chaude pour toute la journée au tarif de 0.181 DT.',
          savings: '-24 DT / mois'
        };
      case 'ev':
        return {
          timeSlot: 'Entre 00h00 et 06h00',
          text: 'Charge complète à 100% en heures creuses sans aucun impact sur la tranche 3 de votre foyer.',
          savings: '-45 DT / mois'
        };
    }
  }

  validateDayAction(ch: MonthlyChallenge): void {
    if (ch.currentDays < ch.targetDays) {
      ch.currentDays++;
      if (ch.currentDays === ch.targetDays) {
        ch.status = 'VALIDE';
        this.ecoScore.update(s => Math.min(100, s + 3));
        this.notifService.showToast('Défi Validé !', `Bravo ! Vous avez remporté +${ch.pointsReward} points STEG.`, 'SUCCESS');
      } else {
        this.notifService.showToast('Action Enregistrée', `Progression : ${ch.currentDays}/${ch.targetDays} jours.`, 'INFO');
      }
    }
  }

  generateMonthlyPdfReport(): void {
    window.print();
  }
}
