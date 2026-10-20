import { Component, inject, signal } from '@angular/core';
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
              <a href="javascript:void(0)" class="forgot-link" (click)="openForgotModal()">Mot de passe oublié ?</a>
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

      <!-- Modal Mot de Passe Oublié -->
      @if (showForgotModal()) {
        <div class="modal-overlay" (click)="closeForgotModal()">
          <div class="modal-content glass-card animate-float" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-icon-badge">
                <span class="material-symbols-rounded">lock_reset</span>
              </div>
              <h2 class="modal-title">Mot de Passe Oublié</h2>
              <button class="btn-close-modal" (click)="closeForgotModal()">
                <span class="material-symbols-rounded">close</span>
              </button>
            </div>
            
            <p class="modal-desc">
              Entrez l'adresse email associée à votre compte VoltTN. Nous vous enverrons un lien sécurisé pour redéfinir votre mot de passe.
            </p>

            @if (resetSent()) {
              <div class="success-banner animate-float">
                <span class="material-symbols-rounded text-green">mark_email_read</span>
                <div>
                  <strong>Email envoyé !</strong>
                  <p>Un lien de réinitialisation et un code temporaire ont été transmis à <strong>{{ forgotEmail }}</strong>.</p>
                </div>
              </div>
            } @else {
              <div class="form-group">
                <label class="form-label">Votre Email :</label>
                <div class="input-with-icon">
                  <span class="material-symbols-rounded input-icon">mail</span>
                  <input 
                    type="email" 
                    class="form-input" 
                    [(ngModel)]="forgotEmail" 
                    placeholder="ex: citoyen@volttn.tn" 
                  />
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-secondary" (click)="closeForgotModal()">Annuler</button>
                <button type="button" class="btn-primary" (click)="sendResetLink()">
                  <span class="material-symbols-rounded">send</span>
                  <span>Envoyer les instructions</span>
                </button>
              </div>
            }
          </div>
        </div>
      }

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

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 16px;
    }

    .modal-content {
      width: 100%;
      max-width: 480px;
      padding: 32px;
      background: #FFFFFF;
      border-radius: var(--radius-xl);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .modal-icon-badge {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: rgba(245, 158, 11, 0.15);
      color: var(--sun-amber);
      display: flex;
      align-items: center;
      justify-content: center;
      .material-symbols-rounded { font-size: 26px; }
    }

    .modal-title {
      font-size: 20px;
      font-weight: 800;
      color: var(--text-main);
      flex: 1;
      margin-left: 12px;
    }

    .btn-close-modal {
      background: none;
      border: none;
      color: var(--text-light);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 50%;
      transition: background 0.2s;
      &:hover { background: #f1f5f9; color: var(--text-main); }
    }

    .modal-desc {
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    .success-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: rgba(46, 196, 182, 0.12);
      border: 1px solid rgba(46, 196, 182, 0.3);
      padding: 16px;
      border-radius: var(--radius-md);
      color: #0d5c52;
      font-size: 13.5px;
      line-height: 1.4;
      strong { display: block; font-size: 15px; margin-bottom: 4px; color: #09473f; }
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

  showForgotModal = signal(false);
  forgotEmail = '';
  resetSent = signal(false);

  fillCredentials(role: UserRole): void {
    const creds = this.authService.getDemoCredentials(role);
    this.email = creds.email;
    this.password = creds.pass;
    this.errorMessage = '';
  }

  openForgotModal(): void {
    this.forgotEmail = this.email || '';
    this.resetSent.set(false);
    this.showForgotModal.set(true);
  }

  closeForgotModal(): void {
    this.showForgotModal.set(false);
  }

  sendResetLink(): void {
    if (!this.forgotEmail.trim()) {
      alert('Veuillez renseigner votre adresse email.');
      return;
    }
    this.resetSent.set(true);
    this.notifService.showToast(
      'Lien de réinitialisation envoyé !',
      `Instructions transmises à ${this.forgotEmail} avec un code temporaire.`,
      'SUCCESS',
      5000
    );
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
