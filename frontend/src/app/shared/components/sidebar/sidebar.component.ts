import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface NavItem {
  path: string;
  labelKey: string;
  icon: string;
  badge?: string;
  badgeColor?: 'sun' | 'sky' | 'coral' | 'nature';
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <aside class="sidebar-wrapper glass-panel" [class.collapsed]="isCollapsed()">
      
      <!-- En-tête Sidebar & Toggle -->
      <div class="sidebar-header">
        <div class="role-indicator" [class.hidden]="isCollapsed()">
          <span class="role-caption">Espace</span>
          <span class="role-title">{{ getRoleTitle() }}</span>
        </div>
        <button class="toggle-btn" (click)="toggleCollapse()" [title]="isCollapsed() ? 'Agrandir' : 'Réduire'">
          <span class="material-symbols-rounded">
            {{ isCollapsed() ? 'chevron_right' : 'chevron_left' }}
          </span>
        </button>
      </div>

      <!-- Liens de navigation selon rôle -->
      <nav class="sidebar-nav">
        @for (item of getNavItems(); track item.path) {
          <a 
            [routerLink]="item.path" 
            routerLinkActive="active" 
            class="sidebar-link"
            [title]="item.labelKey | trans"
          >
            <div class="link-icon-box">
              <span class="material-symbols-rounded">{{ item.icon }}</span>
            </div>
            <span class="link-label" [class.hidden]="isCollapsed()">{{ item.labelKey | trans }}</span>
            @if (item.badge && !isCollapsed()) {
              <span class="link-badge" [ngClass]="'badge-' + item.badgeColor">{{ item.badge }}</span>
            }
          </a>
        }
      </nav>

      <div class="sidebar-footer" [class.hidden]="isCollapsed()">
        <div class="grid-status-card glass-card">
          <div class="status-header">
            <span class="pulse-indicator"></span>
            <span class="status-title">Réseau Tunisie</span>
          </div>
          <div class="status-metrics">
            <div class="metric">
              <span class="m-val">50.02 Hz</span>
              <span class="m-label">Fréquence</span>
            </div>
            <div class="metric">
              <span class="m-val highlight">18.4%</span>
              <span class="m-label">Solaire</span>
            </div>
          </div>
        </div>
      </div>

    </aside>
  `,
  styles: [`
    .sidebar-wrapper {
      width: 260px;
      margin: 0 0 16px 16px;
      border-radius: var(--radius-xl);
      background: var(--bg-card);
      box-shadow: var(--shadow-md);
      display: flex;
      flex-direction: column;
      padding: 16px 12px;
      transition: width var(--transition-normal), transform var(--transition-normal);
      flex-shrink: 0;
      min-height: calc(100vh - 120px);

      &.collapsed {
        width: 80px;
        .sidebar-header { justify-content: center; }
        .sidebar-link { justify-content: center; padding: 12px; }
      }
    }

    [dir="rtl"] .sidebar-wrapper {
      margin: 0 16px 16px 0;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px 18px 10px;
      border-bottom: 1px solid rgba(29, 53, 87, 0.08);
      margin-bottom: 12px;
    }

    .role-indicator {
      display: flex;
      flex-direction: column;
    }

    .role-caption {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-light);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .role-title {
      font-family: var(--font-title);
      font-size: 16px;
      font-weight: 800;
      color: var(--sun-amber);
    }

    .toggle-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(29, 53, 87, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-main);
      transition: all var(--transition-fast);
      &:hover {
        background: #FFFFFF;
        color: var(--sun-amber);
        transform: scale(1.1);
      }
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      color: var(--text-main);
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      transition: all var(--transition-fast);

      &:hover {
        background: rgba(255, 255, 255, 0.95);
        color: var(--sun-amber);
        transform: translateX(4px);
      }

      &.active {
        background: var(--sun-gradient);
        color: #FFFFFF;
        box-shadow: 0 4px 14px rgba(251, 133, 0, 0.35);

        .link-icon-box {
          color: #FFFFFF;
        }
      }
    }

    [dir="rtl"] .sidebar-link:hover {
      transform: translateX(-4px);
    }

    .link-icon-box {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--sky-ocean);
      transition: color var(--transition-fast);
    }

    .link-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .link-badge {
      font-size: 10px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      &.badge-sun { background: var(--sun-light); color: #B36800; }
      &.badge-sky { background: var(--sky-light); color: #0E6BA8; }
      &.badge-coral { background: var(--alert-coral-light); color: var(--alert-coral); }
      &.badge-nature { background: var(--nature-light); color: var(--nature-green); }
    }

    .sidebar-footer {
      margin-top: auto;
      padding-top: 16px;
    }

    .grid-status-card {
      padding: 12px 14px;
      border-radius: var(--radius-md);
      border: 1px solid rgba(82, 183, 136, 0.3);
      background: rgba(255, 255, 255, 0.85);
    }

    .status-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .pulse-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--nature-green);
      box-shadow: 0 0 8px var(--nature-green);
      animation: pulseGlow 2s infinite;
    }

    .status-title {
      font-size: 12px;
      font-weight: 800;
      color: var(--text-main);
    }

    .status-metrics {
      display: flex;
      justify-content: space-between;
    }

    .metric {
      display: flex;
      flex-direction: column;
      .m-val {
        font-size: 13px;
        font-weight: 800;
        color: var(--text-main);
        &.highlight { color: var(--nature-green); }
      }
      .m-label {
        font-size: 10px;
        color: var(--text-light);
      }
    }

    .hidden {
      display: none !important;
    }

    @media (max-width: 1024px) and (min-width: 641px) {
      .sidebar-wrapper {
        width: 76px;
        padding: 12px 8px;
        min-height: calc(100vh - 110px);
      }
      .sidebar-header { justify-content: center; padding: 8px 4px 14px 4px; }
      .role-indicator { display: none; }
      .sidebar-link { justify-content: center; padding: 12px 8px; }
      .link-label, .link-badge, .sidebar-footer { display: none; }
    }

    /* --- Mobile (≤ 640px): Bottom navigation bar --- */
    @media (max-width: 640px) {
      .sidebar-wrapper {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100% !important;
        height: auto;
        min-height: auto;
        margin: 0;
        border-radius: var(--radius-xl) var(--radius-xl) 0 0;
        flex-direction: row;
        z-index: 1000;
        padding: 6px 8px env(safe-area-inset-bottom, 6px);
        box-shadow: 0 -4px 20px rgba(29, 53, 87, 0.12);
      }
      .sidebar-header, .sidebar-footer { display: none; }
      .sidebar-nav {
        flex-direction: row;
        justify-content: space-around;
        width: 100%;
      }
      .sidebar-link {
        flex-direction: column;
        gap: 3px;
        padding: 8px 6px;
        font-size: 10px;
        border-radius: var(--radius-md);
        flex: 1;
        justify-content: center;
        align-items: center;
        transform: none !important;
      }
      .link-label {
        display: block !important;
        font-size: 10px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 60px;
        text-align: center;
      }
      .link-badge { display: none; }
      .link-icon-box .material-symbols-rounded { font-size: 22px; }
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);
  i18n = inject(I18nService);

  isCollapsed = signal(false);

  toggleCollapse(): void {
    this.isCollapsed.update(v => !v);
  }

  getRoleTitle(): string {
    const role = this.authService.userRole();
    switch (role) {
      case 'CITOYEN': return 'Citoyen';
      case 'OPERATEUR': return 'Opérateur STEG';
      case 'TECHNICIEN': return 'Technicien';
      case 'ADMIN': return 'Administrateur';
      default: return 'Public';
    }
  }

  getNavItems(): NavItem[] {
    const role = this.authService.userRole();
    switch (role) {
      case 'CITOYEN':
        return [
          { path: '/citoyen/dashboard', labelKey: 'nav.dashboard', icon: 'speed', badge: 'En direct', badgeColor: 'sun' },
          { path: '/citoyen/consumption', labelKey: 'nav.consumption', icon: 'monitoring' },
          { path: '/citoyen/billing', labelKey: 'nav.billing', icon: 'receipt_long', badge: 'OCR + IA', badgeColor: 'sky' },
          { path: '/citoyen/coach', labelKey: 'nav.coach', icon: 'workspace_premium', badge: 'Éco-Score', badgeColor: 'nature' },
          { path: '/citoyen/report-outage', labelKey: 'nav.report_outage', icon: 'report_problem', badgeColor: 'coral' },
          { path: '/solar', labelKey: 'nav.solar', icon: 'wb_sunny', badge: 'Éco', badgeColor: 'nature' },
          { path: '/citoyen/tips', labelKey: 'nav.tips', icon: 'tips_and_updates' }
        ];

      case 'OPERATEUR':
        return [
          { path: '/operateur/dashboard', labelKey: 'nav.dashboard', icon: 'monitoring', badge: '3D', badgeColor: 'sky' },
          { path: '/operateur/load-forecast', labelKey: 'nav.forecast', icon: 'query_stats', badge: 'J+1 / J+7', badgeColor: 'sun' },
          { path: '/operateur/outages', labelKey: 'nav.grid_management', icon: 'map', badge: 'Affectations', badgeColor: 'coral' },
          { path: '/operateur/maintenance', labelKey: 'nav.maintenance', icon: 'build_circle', badge: 'Risques HT', badgeColor: 'sun' },
          { path: '/operateur/scheduler', labelKey: 'nav.scheduler', icon: 'schedule', badge: 'Auto', badgeColor: 'nature' },
          { path: '/operateur/fraud', labelKey: 'nav.fraud', icon: 'policy', badge: '50 SHAP', badgeColor: 'coral' },
          { path: '/operateur/stats', labelKey: 'nav.stats', icon: 'download' }
        ];

      case 'TECHNICIEN':
        return [
          { path: '/technicien/interventions', labelKey: 'nav.interventions', icon: 'assignment', badge: 'Prioritaire', badgeColor: 'coral' },
          { path: '/outages', labelKey: 'nav.outages', icon: 'pin_drop' }
        ];

      case 'ADMIN':
        return [
          { path: '/admin/users', labelKey: 'nav.users', icon: 'group' },
          { path: '/admin/thresholds', labelKey: 'nav.thresholds', icon: 'tune' },
          { path: '/admin/ml-models', labelKey: 'nav.ml_models', icon: 'model_training', badge: 'v2.4', badgeColor: 'nature' },
          { path: '/admin/data', labelKey: 'nav.data', icon: 'upload_file', badge: 'CSV', badgeColor: 'sky' },
          { path: '/admin/audit', labelKey: 'nav.audit', icon: 'history' },
          { path: '/admin/demo-generator', labelKey: 'nav.demo_generator', icon: 'auto_fix_high', badge: '1-Clic', badgeColor: 'sun' }
        ];

      default:
        return [
          { path: '/', labelKey: 'nav.home', icon: 'home' },
          { path: '/outages', labelKey: 'nav.outages', icon: 'map' },
          { path: '/solar', labelKey: 'nav.solar', icon: 'wb_sunny' }
        ];
    }
  }
}
