import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserRole } from '../../../models/user.model';
import { Tilt3dDirective } from '../../../shared/directives/tilt-3d.directive';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Tilt3dDirective],
  template: `
    <div class="login-page">
      
      <div class="login-card glass-card animate-float" appTilt3d [maxTilt]="5">
        
        <div class="card-header">
          <div class="brand-badge">
            <span class="material-symbols-rounded">lock_open</span>
          </div>
          <h1 class="login-title">Connexion VoltTN</h1>
          <p class="login-sub">Accédez à votre tableau de bord selon vos autorisations</p>
        </div>

        @if (errorMessage) {
          <div class="error-banner">
            <span class="material-symbols-rounded">error</span>
            <span>{{ errorMessage }}</span>
          </div>
        }

        <div class="test-accounts-helper">
          <div class="helper-header">
            <span class="material-symbols-rounded">key</span>
            <span>Comptes de Test (1 clic pour pré-remplir) :</span>
          </div>
          <div class="helper-buttons-grid">
            <button type="button" class="btn-account-pill citizen" (click)="fillCredentials('CITOYEN')">
              <span class="material-symbols-rounded">person</span>
              <span>Citoyen</span>
            </button>
            <button type="button" class="btn-account-pill operator" (click)="fillCredentials('OPERATEUR')">
              <span class="material-symbols-rounded">monitoring</span>
              <span>Opérateur STEG</span>
            </button>
            <button type="button" class="btn-account-pill tech" (click)="fillCredentials('TECHNICIEN')">
              <span class="material-symbols-rounded">build</span>
              <span>Technicien</span>
            </button>
            <button type="button" class="btn-account-pill admin" (click)="fillCredentials('ADMIN')">
              <span class="material-symbols-rounded">admin_panel_settings</span>
              <span>Admin</span>
            </button>
          </div>
        </div>

        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label class="form-label">Adresse Email :</label>
            <div class="input-with-icon">
              <span class="material-symbols-rounded input-icon">mail</span>
              <input 
                type="email" 
                class="form-input" 
                [(ngModel)]="email" 
                name="email" 
                placeholder="ex: citoyen@volttn.tn" 
                required 
              />
            </div>
          </div>

          <div class="form-group">
            <div class="label-row">
              <label class="form-label">Mot de Passe :</label>
              <a href="javascript:void(0)" class="forgot-link" (click)="showPasswordHint()">Mot de passe oublié ?</a>
            </div>
            <div class="input-with-icon">
              <span class="material-symbols-rounded input-icon">lock</span>
              <input 
                type="password" 
                class="form-input" 
                [(ngModel)]="password" 
                name="password" 
                placeholder="••••••••" 
                required 
              />
            </div>
          </div>

          <button type="submit" class="btn-primary btn-submit">
            <span class="material-symbols-rounded">login</span>
            <span>Se Connecter & Accéder au Tableau de Bord</span>
          </button>
        </form>

        <div class="card-footer">
          <span>Vous n'avez pas de compte ?</span>
          <a routerLink="/register" class="link-bold">S'inscrire maintenant</a>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .login-page {
      min-height: calc(100vh - 160px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 30px 16px;
    }

    .login-card {
      width: 100%;
      max-width: 480px;
      padding: 36px 32px;
      border-radius: var(--radius-xl);
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 20px 48px rgba(29, 53, 87, 0.12);
      border: 1px solid var(--border-glass);
    }

    .card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 22px;
    }

    .brand-badge {
      width: 54px;
      height: 54px;
      border-radius: var(--radius-md);
      background: var(--sun-gradient);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30px;
      box-shadow: 0 6px 18px rgba(251, 133, 0, 0.4);
      margin-bottom: 12px;
    }

    .login-title {
      font-size: 24px;
      font-weight: 900;
      color: var(--text-main);
      margin-bottom: 4px;
    }

    .login-sub {
      font-size: 13.5px;
      color: var(--text-muted);
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: var(--alert-coral-light);
      border: 1px solid rgba(255, 107, 107, 0.4);
      border-radius: var(--radius-md);
      color: #C0392B;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 18px;
    }

    /* Raccourcis Comptes de Test */
    .test-accounts-helper {
      padding: 14px;
      background: rgba(255, 251, 242, 0.9);
      border: 1.5px dashed var(--sun-gold);
      border-radius: var(--radius-md);
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .helper-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      font-weight: 800;
      color: #A35C00;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      .material-symbols-rounded { font-size: 16px; }
    }

    .helper-buttons-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .btn-account-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 10px;
      background: #FFFFFF;
      border: 1px solid rgba(29, 53, 87, 0.12);
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 700;
      color: var(--text-main);
      cursor: pointer;
      transition: all var(--transition-fast);

      .material-symbols-rounded { font-size: 16px; }

      &:hover {
        border-color: var(--sun-amber);
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
      }

      &.citizen .material-symbols-rounded { color: var(--sun-amber); }
      &.operator .material-symbols-rounded { color: var(--sky-ocean); }
      &.tech .material-symbols-rounded { color: var(--nature-green); }
      &.admin .material-symbols-rounded { color: var(--text-main); }
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .form-label {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-main);
    }

    .forgot-link {
      font-size: 12px;
      color: var(--sky-ocean);
      font-weight: 600;
      &:hover { text-decoration: underline; }
    }

    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      color: var(--text-light);
      font-size: 20px;
      pointer-events: none;
    }

    .input-with-icon .form-input {
      padding-left: 44px;
    }

    .btn-submit {
      width: 100%;
      margin-top: 8px;
      padding: 13px;
      font-size: 15px;
    }

    .card-footer {
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid rgba(29, 53, 87, 0.08);
      font-size: 13px;
      color: var(--text-muted);
    }

    .link-bold {
      font-weight: 700;
      color: var(--sun-amber);
      &:hover { text-decoration: underline; }
    }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  notifService = inject(NotificationService);
  router = inject(Router);

  email = 'citoyen@volttn.tn';
  password = 'citoyen123';
  errorMessage = '';

  fillCredentials(role: UserRole): void {
    const creds = this.authService.getDemoCredentials(role);
    this.email = creds.email;
    this.password = creds.pass;
    this.errorMessage = '';
  }

  showPasswordHint(): void {
    alert('Pour les comptes de test, utilisez le mot de passe indiqué (ex: citoyen123, operateur123, technicien123, admin123).');
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.email.trim() || !this.password.trim()) {
      this.errorMessage = 'Veuillez saisir votre email et votre mot de passe.';
      return;
    }

    const res = this.authService.login(this.email, this.password);

    if (res.success && res.user) {
      this.notifService.showToast(
        `Bienvenue, ${res.user.name} !`,
        `Connexion réussie avec le rôle ${res.user.role}.`,
        'SUCCESS',
        3500
      );
    } else {
      this.errorMessage = res.message || 'Identifiants incorrects.';
    }
  }
}
