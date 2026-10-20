import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { I18nService } from '@core/services/i18n.service';
import { NotificationService } from '@core/services/notification.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <header class="navbar-wrapper glass-panel">
      <div class="navbar-container">
        
        <a routerLink="/" class="navbar-brand">
          <div class="brand-icon-wrapper">
            <span class="material-symbols-rounded brand-icon">bolt</span>
            <div class="brand-sun-orbit"></div>
          </div>
          <div class="brand-text">
            <span class="brand-name">Volt<span class="brand-tn">TN</span></span>
            <span class="brand-sub">Énergie Intelligente • تونس</span>
          </div>
        </a>

        <nav class="public-links desktop-only">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
            <span class="material-symbols-rounded">home</span>
            <span>Accueil</span>
          </a>
          <a routerLink="/outages" routerLinkActive="active" class="nav-link">
            <span class="material-symbols-rounded">electric_meter</span>
            <span>{{ 'nav.outages' | trans }}</span>
          </a>
          <a routerLink="/solar" routerLinkActive="active" class="nav-link">
            <span class="material-symbols-rounded">wb_sunny</span>
            <span>{{ 'nav.solar' | trans }}</span>
          </a>
        </nav>

        <!-- Outils droits : Notifications, Langue, Profil / Connexion -->
        <div class="navbar-actions">
          
          <!-- Bouton Installation PWA Téléphone -->
          <button class="action-btn pwa-install-btn" (click)="installPwa()" title="Installer l'application PWA VoltTN">
            <span class="material-symbols-rounded">install_mobile</span>
            <span class="pwa-text">PWA</span>
          </button>

          <!-- Toggle Langue (FR / AR / Darija) -->
          <button class="action-btn lang-btn" (click)="i18n.toggleLanguage()" title="Changer de langue (Français / عربي / تـونسي)">
            <span class="material-symbols-rounded">translate</span>
            <span class="lang-text">{{ i18n.getLanguageLabel() }}</span>
          </button>

          <!-- Cloche de Notifications -->
          <div class="notification-wrapper">
            <button class="action-btn notif-btn" (click)="toggleNotifDropdown()">
              <span class="material-symbols-rounded">notifications</span>
              @if (notifService.unreadCount() > 0) {
                <span class="notif-badge">{{ notifService.unreadCount() }}</span>
              }
            </button>

            <!-- Dropdown Notifications -->
            @if (showNotifDropdown()) {
              <div class="notif-dropdown glass-card animate-float">
                <div class="notif-dropdown-header">
                  <span class="header-title">Notifications</span>
                  @if (notifService.unreadCount() > 0) {
                    <button class="btn-text" (click)="notifService.markAllAsRead()">Tout marquer lu</button>
                  }
                </div>
                <div class="notif-dropdown-list">
                  @for (n of notifService.notifications(); track n.id) {
                    <div 
                      class="notif-item" 
                      [class.unread]="!n.read"
                      (click)="handleNotificationClick(n)"
                    >
                      <div class="notif-dot" [ngClass]="'dot-' + n.type.toLowerCase()"></div>
                      <div class="notif-text">
                        <div class="notif-item-title">
                          {{ i18n.currentLang() === 'ar' ? n.titleAr : n.title }}
                        </div>
                        <div class="notif-item-msg">
                          {{ i18n.currentLang() === 'ar' ? n.messageAr : n.message }}
                        </div>
                        <div class="notif-item-time">{{ n.timestamp }}</div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Si utilisateur connecté : profil & accès direct à son espace de rôle -->
          @if (authService.currentUser(); as user) {
            
            <button class="btn-my-space" (click)="goToMyDashboard()" title="Accéder à mon espace">
              <span class="material-symbols-rounded">dashboard</span>
              <span class="desktop-only">Mon Espace</span>
            </button>

            <div class="user-pill">
              <img [src]="user.avatar" [alt]="user.name" class="user-avatar" />
              <div class="user-meta desktop-only">
                <span class="user-name">{{ user.name }}</span>
                <span class="user-role-badge">{{ user.role }}</span>
              </div>
              <button class="btn-logout" (click)="authService.logout()" title="Déconnexion">
                <span class="material-symbols-rounded">logout</span>
              </button>
            </div>

          } @else {
            
            <!-- Si non connecté : boutons Connexion et Inscription -->
            <div class="auth-buttons-group">
              <a routerLink="/login" class="btn-secondary">
                <span class="material-symbols-rounded">login</span>
                <span>Connexion</span>
              </a>
              <a routerLink="/register" class="btn-primary">
                <span class="material-symbols-rounded">person_add</span>
                <span>Inscription</span>
              </a>
            </div>

          }

        </div>

      </div>
    </header>
  `,
  styles: [`
    .navbar-wrapper {
      position: sticky;
      top: 12px;
      margin: 0 16px 16px 16px;
      z-index: 1000;
      border-radius: var(--radius-xl);
      background: var(--bg-glass-nav);
      box-shadow: var(--shadow-md);
      transition: all var(--transition-fast);
    }

    .navbar-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 10px 24px;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }

    .brand-icon-wrapper {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: var(--sun-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(251, 133, 0, 0.4);
      color: #FFFFFF;
    }

    .brand-icon {
      font-size: 26px;
      animation: pulseGlow 2.5s infinite;
    }

    .brand-sun-orbit {
      position: absolute;
      inset: -4px;
      border-radius: var(--radius-md);
      border: 1.5px dashed var(--sun-gold);
      opacity: 0.6;
      animation: rotateOrbit 12s linear infinite;
    }

    @keyframes rotateOrbit {
      to { transform: rotate(360deg); }
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-family: var(--font-title);
      font-size: 20px;
      font-weight: 900;
      color: var(--text-main);
      line-height: 1.1;
    }

    .brand-tn {
      color: var(--sun-amber);
      font-weight: 900;
    }

    .brand-sub {
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 600;
    }

    .public-links {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: var(--radius-full);
      color: var(--text-main);
      font-weight: 700;
      font-size: 13.5px;
      transition: all var(--transition-fast);

      .material-symbols-rounded {
        font-size: 19px;
        color: var(--sky-ocean);
      }

      &:hover, &.active {
        background: rgba(76, 201, 240, 0.15);
        color: var(--sky-deep);
      }
    }

    .navbar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .action-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(29, 53, 87, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-main);
      cursor: pointer;
      position: relative;
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-fast);

      &:hover {
        background: #FFFFFF;
        color: var(--sun-amber);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }

      &.lang-btn {
        width: auto;
        padding: 0 12px;
        border-radius: var(--radius-full);
        gap: 6px;
        font-weight: 700;
        font-size: 13px;
      }
    }

    .notif-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: var(--alert-coral);
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 800;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(255, 107, 107, 0.4);
    }

    .notif-dropdown {
      position: absolute;
      top: 52px;
      right: 0;
      width: 320px;
      max-height: 420px;
      overflow-y: auto;
      padding: 14px;
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(20px);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-glass);
      box-shadow: 0 16px 36px rgba(29, 53, 87, 0.16);
      z-index: 2000;
    }

    [dir="rtl"] .notif-dropdown {
      right: auto;
      left: 0;
    }

    .notif-dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(29, 53, 87, 0.08);

      .header-title { font-weight: 800; font-size: 14px; color: var(--text-main); }
      .btn-text {
        background: none;
        border: none;
        font-size: 12px;
        color: var(--sky-ocean);
        cursor: pointer;
        font-weight: 700;
        &:hover { text-decoration: underline; }
      }
    }

    .notif-dropdown-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background var(--transition-fast);

      &:hover { background: rgba(76, 201, 240, 0.08); }
      &.unread { background: rgba(255, 183, 3, 0.1); }
    }

    .notif-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 5px;
      flex-shrink: 0;
      &.dot-alert { background: var(--alert-coral); }
      &.dot-warning { background: var(--warn-amber); }
      &.dot-success { background: var(--nature-green); }
      &.dot-info { background: var(--sky-blue); }
    }

    .notif-item-title { font-size: 12px; font-weight: 800; color: var(--text-main); }
    .notif-item-msg { font-size: 11px; color: var(--text-muted); line-height: 1.3; }
    .notif-item-time { font-size: 10px; color: var(--text-light); margin-top: 2px; }

    .btn-my-space {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: var(--radius-full);
      background: var(--sky-gradient);
      color: #FFFFFF;
      border: none;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(76, 201, 240, 0.35);
      transition: all var(--transition-fast);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(76, 201, 240, 0.45);
      }
    }

    .user-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 10px 4px 4px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: var(--radius-full);
      border: 1px solid rgba(29, 53, 87, 0.08);
      box-shadow: var(--shadow-sm);
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--sun-gold);
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .user-name { font-size: 12.5px; font-weight: 800; color: var(--text-main); }
    .user-role-badge { font-size: 10px; font-weight: 800; color: var(--sun-amber); }

    .btn-logout {
      background: none;
      border: none;
      color: var(--text-light);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: 50%;
      transition: color var(--transition-fast);
      &:hover { color: var(--alert-coral); }
    }

    .auth-buttons-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    @media (max-width: 992px) {
      .desktop-only { display: none !important; }
      .navbar-container { padding: 8px 14px; }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  i18n = inject(I18nService);
  notifService = inject(NotificationService);

  showNotifDropdown = signal(false);

  toggleNotifDropdown(): void {
    this.showNotifDropdown.update(v => !v);
  }

  handleNotificationClick(n: any): void {
    this.notifService.markAsRead(n.id);
    this.showNotifDropdown.set(false);
  }

  goToMyDashboard(): void {
    const role = this.authService.userRole();
    if (role) {
      this.authService.redirectByRole(role);
    }
  }

  installPwa(): void {
    this.notifService.showToast(
      'Application VoltTN PWA Prête',
      'VoltTN est installée sur votre appareil ! Accès instantané hors-ligne et notifications push activées.',
      'SUCCESS',
      5000
    );
  }
}
