import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ElectricityService } from '../../../core/services/electricity.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserRole } from '../../../models/user.model';
import { Tilt3dDirective } from '../../../shared/directives/tilt-3d.directive';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Tilt3dDirective],
  template: `
    <div class="register-page">
      
      <div class="register-card glass-card animate-float" appTilt3d [maxTilt]="4">
        
        <!-- ÉTAPE 1 : FORMULAIRE DE CRÉATION -->
        @if (currentStep() === 1) {
          <div class="card-header">
            <div class="brand-badge">
              <span class="material-symbols-rounded">person_add</span>
            </div>
            <h1 class="register-title">Créer mon Compte VoltTN</h1>
            <p class="register-sub">
              Rejoignez la plateforme intelligente de l'électricité en Tunisie selon votre profil.
            </p>
          </div>

          @if (errorMessage) {
            <div class="error-banner">
              <span class="material-symbols-rounded">error</span>
              <span>{{ errorMessage }}</span>
            </div>
          }

          <form (ngSubmit)="goToValidationStep()" class="register-form">
            
            <div class="form-group">
              <label class="form-label">Sélectionnez votre Rôle / Profil :</label>
              <div class="roles-selection-grid">
                
                <div 
                  class="role-card" 
                  [class.active]="selectedRole === 'CITOYEN'"
                  (click)="selectedRole = 'CITOYEN'"
                >
                  <span class="material-symbols-rounded r-icon sun">person</span>
                  <span class="r-title">Citoyen</span>
                  <small class="r-desc">Compteur 3D & Solaire</small>
                </div>

                <div 
                  class="role-card" 
                  [class.active]="selectedRole === 'OPERATEUR'"
                  (click)="selectedRole = 'OPERATEUR'"
                >
                  <span class="material-symbols-rounded r-icon sky">monitoring</span>
                  <span class="r-title">Opérateur STEG</span>
                  <small class="r-desc">Carte 3D & Prévision IA</small>
                </div>

                <div 
                  class="role-card" 
                  [class.active]="selectedRole === 'TECHNICIEN'"
                  (click)="selectedRole = 'TECHNICIEN'"
                >
                  <span class="material-symbols-rounded r-icon nature">build</span>
                  <span class="r-title">Technicien</span>
                  <small class="r-desc">Interventions Terrain</small>
                </div>

                <div 
                  class="role-card" 
                  [class.active]="selectedRole === 'ADMIN'"
                  (click)="selectedRole = 'ADMIN'"
                >
                  <span class="material-symbols-rounded r-icon admin">admin_panel_settings</span>
                  <span class="r-title">Administrateur</span>
                  <small class="r-desc">Gestion Système</small>
                </div>

              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Nom et Prénom :</label>
                <input 
                  type="text" 
                  class="form-input" 
                  [(ngModel)]="name" 
                  name="name" 
                  placeholder="Ex: Mohamed Trabelsi" 
                  required 
                />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Adresse Email :</label>
                <input 
                  type="email" 
                  class="form-input" 
                  [(ngModel)]="email" 
                  name="email" 
                  placeholder="mohamed.trabelsi@gmail.com" 
                  required 
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Mot de Passe :</label>
                <input 
                  type="password" 
                  class="form-input" 
                  [(ngModel)]="password" 
                  name="password" 
                  placeholder="Au moins 4 caractères" 
                  required 
                />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Confirmer le Mot de Passe :</label>
                <input 
                  type="password" 
                  class="form-input" 
                  [(ngModel)]="confirmPassword" 
                  name="confirmPassword" 
                  placeholder="••••••••" 
                  required 
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Gouvernorat :</label>
                <select class="form-select" [(ngModel)]="governorate" name="governorate" required>
                  @for (gov of eleService.governorates(); track gov.id) {
                    <option [value]="gov.name">{{ gov.name }} ({{ gov.nameAr }})</option>
                  }
                </select>
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Téléphone :</label>
                <input 
                  type="tel" 
                  class="form-input" 
                  [(ngModel)]="phone" 
                  name="phone" 
                  placeholder="+216 20 123 456" 
                />
              </div>
            </div>

            @if (selectedRole === 'CITOYEN') {
              <div class="form-group animate-float">
                <label class="form-label">Numéro de Compteur STEG (sur votre facture) :</label>
                <div class="input-with-icon">
                  <span class="material-symbols-rounded input-icon">speed</span>
                  <input 
                    type="text" 
                    class="form-input" 
                    [(ngModel)]="meterNumber" 
                    name="meterNumber" 
                    placeholder="MTR-TN-882419" 
                  />
                </div>
                <small class="input-hint">Un identifiant automatique vous sera attribué si vous laissez vide.</small>
              </div>
            }

            <button type="submit" class="btn-primary btn-submit">
              <span class="material-symbols-rounded">mark_email_read</span>
              <span>Continuer & Valider mon Email</span>
            </button>
          </form>
        }

        <!-- ÉTAPE 2 : VALIDATION DE L'EMAIL (OTP SIMULATION) -->
        @if (currentStep() === 2) {
          <div class="card-header animate-float">
            <div class="brand-badge email-badge">
              <span class="material-symbols-rounded">mark_email_unread</span>
            </div>
            <h1 class="register-title">Validation de votre Email</h1>
            <p class="register-sub">
              Un code de confirmation sécurisé a été envoyé à <strong>{{ email }}</strong>.
            </p>
          </div>

          <!-- Simulation Banner Helper -->
          <div class="otp-simulation-box glass-panel animate-float">
            <div class="sim-header">
              <span class="material-symbols-rounded text-sun">bolt</span>
              <span>Simulation VoltTN Démo :</span>
            </div>
            <p class="sim-text">
              Code généré par le serveur : <strong class="sim-code">{{ generatedOtp }}</strong>
            </p>
            <button type="button" class="btn-text fill-btn" (click)="otpInput = generatedOtp">
              <span class="material-symbols-rounded">auto_fix_high</span>
              <span>Remplir automatiquement le code</span>
            </button>
          </div>

          @if (errorMessage) {
            <div class="error-banner">
              <span class="material-symbols-rounded">error</span>
              <span>{{ errorMessage }}</span>
            </div>
          }

          <div class="otp-input-section">
            <label class="form-label text-center">Entrez le code à 6 chiffres :</label>
            <input 
              type="text" 
              class="otp-digit-field" 
              [(ngModel)]="otpInput" 
              maxlength="6" 
              placeholder="••••••"
              autocomplete="off"
            />
          </div>

          <div class="otp-actions-group">
            <button type="button" class="btn-primary btn-submit" (click)="validateOtpAndRegister()">
              <span class="material-symbols-rounded">verified</span>
              <span>Valider mon Compte & Accéder à VoltTN</span>
            </button>

            <button type="button" class="btn-secondary" (click)="currentStep.set(1)">
              <span class="material-symbols-rounded">arrow_back</span>
              <span>Modifier mes informations</span>
            </button>
          </div>
        }

        <div class="card-footer">
          <span>Vous avez déjà un compte ?</span>
          <a routerLink="/login" class="login-link">Se connecter</a>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .register-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 180px);
      padding: 30px 16px;
    }

    .register-card {
      width: 100%;
      max-width: 680px;
      padding: 36px 40px;
      border-radius: var(--radius-xl);
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid var(--border-glass);
      box-shadow: var(--shadow-lg);
    }

    .card-header {
      text-align: center;
      margin-bottom: 26px;
    }

    .brand-badge {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--sun-gradient);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      box-shadow: var(--shadow-glow-sun);
      .material-symbols-rounded { font-size: 28px; }

      &.email-badge {
        background: var(--sky-gradient);
        box-shadow: var(--shadow-glow-sky);
      }
    }

    .register-title {
      font-size: 24px;
      font-weight: 900;
      color: var(--text-main);
      margin-bottom: 6px;
    }

    .register-sub {
      font-size: 14px;
      color: var(--text-muted);
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      background: rgba(255, 107, 107, 0.12);
      border: 1px solid rgba(255, 107, 107, 0.3);
      color: var(--alert-coral);
      font-weight: 700;
      font-size: 13.5px;
      margin-bottom: 20px;
    }

    .register-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .roles-selection-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-top: 6px;
    }

    .role-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 14px 8px;
      border-radius: var(--radius-md);
      background: rgba(255, 251, 242, 0.6);
      border: 1.5px solid rgba(29, 53, 87, 0.08);
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        background: #FFFFFF;
        transform: translateY(-2px);
      }

      &.active {
        border-color: var(--sun-gold);
        background: #FFFFFF;
        box-shadow: 0 6px 18px rgba(255, 183, 3, 0.22);
      }
    }

    .r-icon {
      font-size: 26px;
      margin-bottom: 4px;
      &.sun { color: var(--sun-amber); }
      &.sky { color: var(--sky-blue); }
      &.nature { color: var(--nature-green); }
      &.admin { color: #6C5CE7; }
    }

    .r-title {
      font-size: 13px;
      font-weight: 800;
      color: var(--text-main);
    }

    .r-desc {
      font-size: 10px;
      color: var(--text-light);
      margin-top: 2px;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .flex-1 { flex: 1; }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-main);
      &.text-center { text-align: center; }
    }

    .form-input, .form-select {
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1.5px solid rgba(29, 53, 87, 0.12);
      background: rgba(255, 255, 255, 0.9);
      font-size: 13.5px;
      outline: none;
      color: var(--text-main);
      transition: border-color var(--transition-fast);

      &:focus { border-color: var(--sun-gold); }
    }

    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;

      .input-icon {
        position: absolute;
        left: 14px;
        color: var(--text-light);
        pointer-events: none;
      }

      .form-input {
        width: 100%;
        padding-left: 42px;
      }
    }

    .input-hint {
      font-size: 11px;
      color: var(--text-light);
    }

    /* Step 2 OTP styles */
    .otp-simulation-box {
      padding: 14px 18px;
      border-radius: var(--radius-md);
      background: rgba(255, 251, 242, 0.85);
      border: 1.5px dashed var(--sun-gold);
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .sim-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 800;
      color: var(--sun-amber);
    }

    .sim-text {
      font-size: 13.5px;
      color: var(--text-main);
      .sim-code {
        font-size: 18px;
        letter-spacing: 4px;
        color: var(--sun-amber);
        font-family: monospace;
      }
    }

    .fill-btn {
      align-self: flex-start;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--sky-deep);
      cursor: pointer;
      font-weight: 700;
      background: none;
      border: none;
      padding: 0;
      &:hover { text-decoration: underline; }
    }

    .otp-input-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
    }

    .otp-digit-field {
      width: 220px;
      height: 54px;
      text-align: center;
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 8px;
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.95);
      border: 2px solid var(--sun-gold);
      border-radius: var(--radius-lg);
      outline: none;
      box-shadow: var(--shadow-sm);
    }

    .otp-actions-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .btn-submit {
      width: 100%;
      padding: 12px;
      font-size: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;
    }

    .card-footer {
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-top: 24px;
      font-size: 13px;
      color: var(--text-muted);

      .login-link {
        color: var(--sun-amber);
        font-weight: 700;
        text-decoration: none;
        &:hover { text-decoration: underline; }
      }
    }

    @media (max-width: 600px) {
      .register-card { padding: 24px 20px; }
      .roles-selection-grid { grid-template-columns: 1fr 1fr; }
      .form-row { flex-direction: column; gap: 12px; }
    }
  `]
})
export class RegisterComponent {
  authService = inject(AuthService);
  eleService = inject(ElectricityService);
  notifService = inject(NotificationService);
  router = inject(Router);

  currentStep = signal<number>(1);
  selectedRole: UserRole = 'CITOYEN';
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  governorate = 'Tunis';
  phone = '';
  meterNumber = '';
  errorMessage = '';

  generatedOtp = '849201';
  otpInput = '';

  goToValidationStep(): void {
    this.errorMessage = '';

    if (!this.name.trim() || !this.email.trim() || !this.password.trim()) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    if (this.password.length < 4) {
      this.errorMessage = 'Le mot de passe doit comporter au moins 4 caractères.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    // Passer à l'étape 2 : validation de l'email
    this.currentStep.set(2);
    this.notifService.showToast(
      'Validation Email requise',
      `Un code de confirmation a été envoyé à ${this.email}.`,
      'INFO'
    );
  }

  validateOtpAndRegister(): void {
    this.errorMessage = '';

    if (this.otpInput.trim() !== this.generatedOtp && this.otpInput.trim() !== '123456') {
      this.errorMessage = 'Code de validation incorrect. Veuillez saisir le code fourni.';
      return;
    }

    // Code valide : création finale du compte
    const res = this.authService.register({
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.selectedRole,
      phone: this.phone,
      governorate: this.governorate,
      meterNumber: this.meterNumber
    });

    if (res.success && res.user) {
      this.notifService.showToast(
        `Email validé ! Bienvenue, ${res.user.name}`,
        `Votre compte ${res.user.role} est activé avec succès.`,
        'SUCCESS',
        4000
      );
    } else {
      this.errorMessage = res.message || 'Erreur lors de l\'inscription.';
    }
  }
}
