import { Component, inject } from '@angular/core';
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

        <form (ngSubmit)="onSubmit()" class="register-form">
          
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
                placeholder="Au moins 6 caractères" 
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
                <span class="material-symbols-rounded input-icon">electric_meter</span>
                <input 
                  type="text" 
                  class="form-input" 
                  [(ngModel)]="meterNumber" 
                  name="meterNumber" 
                  placeholder="Ex: MTR-TN-882419" 
                />
              </div>
              <small class="hint-text">Si vous n'avez pas de numéro sous la main, un compteur de test vous sera attribué.</small>
            </div>
          }

          <button type="submit" class="btn-primary btn-submit">
            <span class="material-symbols-rounded">check</span>
            <span>Créer mon Compte & Accéder à mon Espace</span>
          </button>

        </form>

        <div class="card-footer">
          <span>Vous avez déjà un compte ?</span>
          <a routerLink="/login" class="link-bold">Se connecter</a>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .register-page {
      min-height: calc(100vh - 160px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 30px 16px;
    }

    .register-card {
      width: 100%;
      max-width: 620px;
      padding: 36px 34px;
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
      margin-bottom: 24px;
    }

    .brand-badge {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      background: var(--sun-gradient);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      box-shadow: 0 4px 14px rgba(251, 133, 0, 0.4);
      margin-bottom: 12px;
    }

    .register-title {
      font-size: 24px;
      font-weight: 900;
      color: var(--text-main);
      margin-bottom: 4px;
    }

    .register-sub {
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

    .register-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .roles-selection-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-top: 4px;
    }

    .role-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 4px;
      padding: 12px 8px;
      background: rgba(255, 255, 255, 0.85);
      border: 2px solid rgba(29, 53, 87, 0.1);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--sun-amber);
        transform: translateY(-2px);
      }

      &.active {
        border-color: var(--sun-amber);
        background: rgba(255, 183, 3, 0.12);
        box-shadow: 0 4px 12px rgba(251, 133, 0, 0.2);
      }
    }

    .r-icon {
      font-size: 24px;
      &.sun { color: var(--sun-amber); }
      &.sky { color: var(--sky-ocean); }
      &.nature { color: var(--nature-green); }
      &.admin { color: var(--text-main); }
    }

    .r-title {
      font-size: 12px;
      font-weight: 800;
      color: var(--text-main);
    }

    .r-desc {
      font-size: 9.5px;
      color: var(--text-muted);
      line-height: 1.2;
    }

    .form-row {
      display: flex;
      gap: 14px;
    }

    .flex-1 { flex: 1; }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 13px;
      font-weight: 800;
      color: var(--text-main);
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
    }

    .input-with-icon .form-input {
      padding-left: 44px;
    }

    .hint-text {
      font-size: 11px;
      color: var(--text-light);
    }

    .btn-submit {
      width: 100%;
      margin-top: 10px;
      padding: 13px;
      font-size: 15px;
    }

    .card-footer {
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-top: 22px;
      padding-top: 16px;
      border-top: 1px solid rgba(29, 53, 87, 0.08);
      font-size: 13px;
      color: var(--text-muted);
    }

    .link-bold {
      font-weight: 700;
      color: var(--sun-amber);
      &:hover { text-decoration: underline; }
    }

    @media (max-width: 600px) {
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

  selectedRole: UserRole = 'CITOYEN';
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  governorate = 'Tunis';
  phone = '';
  meterNumber = '';
  errorMessage = '';

  onSubmit(): void {
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
        `Bienvenue, ${res.user.name} !`,
        `Votre compte ${res.user.role} est activé. Redirection vers votre tableau de bord...`,
        'SUCCESS',
        4000
      );
    } else {
      this.errorMessage = res.message || 'Erreur lors de l\'inscription.';
    }
  }
}
