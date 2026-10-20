import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CitizenService } from '../../../core/services/citizen.service';
import { Tilt3dDirective } from '../../../shared/directives/tilt-3d.directive';

@Component({
  selector: 'app-tips',
  standalone: true,
  imports: [CommonModule, RouterModule, Tilt3dDirective],
  template: `
    <div class="tips-page">
      
      <div class="tips-header glass-card">
        <div class="badge-row">
          <span class="glass-badge badge-nature">
            <span class="material-symbols-rounded">energy_savings_leaf</span>
            Sobriété Énergétique Tunisie
          </span>
          <span class="glass-badge badge-sun">Économies Estimées : ~210 DT / an</span>
        </div>
        <h1 class="header-title">Conseils & Éco-Gestes Adaptés à la Tunisie</h1>
        <p class="header-desc">
          En Tunisie, la climatisation estivale et les heures de pointe (19h-22h) pèsent lourd sur la facture. Découvrez nos conseils pratiques validés par l'ANME pour réduire vos dépenses sans sacrifier votre confort.
        </p>
      </div>

      <div class="tips-grid">
        @for (tip of citizenService.tips(); track tip.id) {
          <div class="tip-card glass-card" appTilt3d [maxTilt]="6">
            <div class="tip-top">
              <div class="tip-icon-box">
                <span class="material-symbols-rounded">{{ tip.icon }}</span>
              </div>
              <span class="gain-badge">-{{ tip.savingsTndPerMonth }} DT / mois</span>
            </div>
            
            <h2 class="tip-title">{{ tip.title }}</h2>
            <p class="tip-text">{{ tip.description }}</p>

            <div class="tip-bottom">
              <span class="glass-badge badge-sky">{{ tip.category }}</span>
              <span class="glass-badge badge-nature">{{ tip.difficulty }}</span>
            </div>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .tips-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 50px;
    }

    .tips-header {
      padding: 28px 32px;
      border-radius: var(--radius-xl);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 253, 244, 0.9) 100%);
      border: 1px solid rgba(82, 183, 136, 0.3);
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

    .tips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .tip-card {
      padding: 24px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
    }

    .tip-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .tip-icon-box {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: var(--sun-light);
      color: #A35C00;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
    }

    .gain-badge {
      font-size: 12px;
      font-weight: 800;
      color: var(--nature-green);
      background: var(--nature-light);
      padding: 5px 12px;
      border-radius: var(--radius-full);
      box-shadow: var(--shadow-sm);
    }

    .tip-title {
      font-size: 17px;
      font-weight: 800;
      color: var(--text-main);
    }

    .tip-text {
      font-size: 13.5px;
      color: var(--text-muted);
      line-height: 1.5;
      flex: 1;
    }

    .tip-bottom {
      display: flex;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid rgba(29, 53, 87, 0.08);
    }
  `]
})
export class TipsComponent {
  citizenService = inject(CitizenService);
}
