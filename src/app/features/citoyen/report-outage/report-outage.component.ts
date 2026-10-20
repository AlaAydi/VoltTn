import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OutageService } from '../../../core/services/outage.service';
import { AuthService } from '../../../core/services/auth.service';
import { ElectricityService } from '../../../core/services/electricity.service';
import { NotificationService } from '../../../core/services/notification.service';
import { OutageType } from '../../../models/outage.model';
import { Tilt3dDirective } from '../../../shared/directives/tilt-3d.directive';

@Component({
  selector: 'app-report-outage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Tilt3dDirective],
  template: `
    <div class="report-page">
      
      <!-- Onglets Navigation Citoyen : Nouveau Signalement ou Suivi Type Colis -->
      <div class="report-tabs-nav glass-card animate-float">
        <button class="nav-tab-btn" [class.active]="activeTab() === 'report'" (click)="activeTab.set('report')">
          <span class="material-symbols-rounded">add_circle</span>
          <span>Signaler une Coupure</span>
        </button>
        <button class="nav-tab-btn" [class.active]="activeTab() === 'track'" (click)="activeTab.set('track')">
          <span class="material-symbols-rounded">local_shipping</span>
          <span>Suivi de Réclamation en Direct (Type Colis)</span>
          <span class="tab-badge">1 active</span>
        </button>
      </div>

      <!-- ONGLET 1 : FORMULAIRE DE SIGNALEMENT -->
      @if (activeTab() === 'report') {
        <div class="report-card glass-card animate-float" appTilt3d [maxTilt]="4">
          
          <div class="card-header">
            <div class="header-icon-box">
              <span class="material-symbols-rounded">report_problem</span>
            </div>
            <h1 class="header-title">Signaler une Coupure d'Électricité</h1>
            <p class="header-desc">
              Votre signalement est géolocalisé et transmis instantanément au centre de dispatching STEG pour accélérer l'intervention.
            </p>
          </div>

          <form (ngSubmit)="onSubmit()" class="report-form">
            
            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Gouvernorat :</label>
                <select class="form-select" [(ngModel)]="governorate" name="governorate" required (change)="onGovChange()">
                  @for (gov of eleService.governorates(); track gov.id) {
                    <option [value]="gov.name">{{ gov.name }} ({{ gov.nameAr }})</option>
                  }
                </select>
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Quartier / Cité :</label>
                <input 
                  type="text" 
                  class="form-input" 
                  [(ngModel)]="district" 
                  name="district" 
                  placeholder="Ex: Cité Ennasr 2" 
                  required 
                />
              </div>
            </div>

            <div class="form-group">
              <div class="label-with-action">
                <label class="form-label">Adresse Précise / Point de Repère :</label>
                <button type="button" class="btn-detect-gps" (click)="detectGps()">
                  <span class="material-symbols-rounded">my_location</span>
                  <span>Détecter ma position GPS</span>
                </button>
              </div>
              <input 
                type="text" 
                class="form-input" 
                [(ngModel)]="address" 
                name="address" 
                placeholder="Ex: Avenue Hédi Nouira, près de la pharmacie de nuit" 
                required 
              />
              <span class="coord-tag">Coordonnées GPS estimées : {{ lat.toFixed(4) }}°N, {{ lng.toFixed(4) }}°E</span>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Heure de début de la coupure :</label>
                <input 
                  type="time" 
                  class="form-input" 
                  [(ngModel)]="outageTime" 
                  name="outageTime" 
                  required 
                />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Ampleur constatée :</label>
                <select class="form-select" [(ngModel)]="estimatedScope" name="estimatedScope">
                  <option value="MON_FOYER">Mon domicile uniquement (disjoncteur testé)</option>
                  <option value="IMMEUBLE">Mon immeuble / ma résidence</option>
                  <option value="RUE">Toute la rue / quartier sans courant</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Nature constatée de la panne :</label>
              <div class="types-grid">
                @for (t of outageTypes; track t.value) {
                  <div 
                    class="type-pill" 
                    [class.active]="selectedType === t.value"
                    (click)="selectedType = t.value"
                  >
                    <span class="material-symbols-rounded">{{ t.icon }}</span>
                    <span>{{ t.label }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Commentaire / Observations :</label>
              <textarea 
                class="form-textarea" 
                rows="3" 
                [(ngModel)]="notes" 
                name="notes"
                placeholder="Ex: Étincelles observées sur le poteau après le coup de vent, plusieurs voisins sont également privés d'électricité."
              ></textarea>
            </div>

            <!-- Photo Upload Simulation -->
            <div class="form-group">
              <label class="form-label">Photo du poteau ou câble endommagé (optionnel) :</label>
              @if (attachedPhoto()) {
                <div class="photo-preview-box">
                  <img [src]="attachedPhoto()" alt="Photo incident" class="preview-img" />
                  <div class="preview-info">
                    <span class="p-title">Photo_Incident_STEG.jpg</span>
                    <span class="p-size">1.4 Mo • Géolocalisé</span>
                    <button type="button" class="btn-remove-photo" (click)="removePhoto()">
                      <span class="material-symbols-rounded">delete</span>
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              } @else {
                <div class="photo-mock-box" (click)="simulatePhotoUpload()">
                  <span class="material-symbols-rounded photo-icon">add_a_photo</span>
                  <div>
                    <span class="photo-text">Prendre ou joindre une photo de l'avarie</span>
                    <span class="photo-sub">Cliquez pour simuler l'import d'une photo de poteau endommagé</span>
                  </div>
                </div>
              }
            </div>

            <div class="actions-row">
              <a routerLink="/citoyen/dashboard" class="btn-secondary">Annuler</a>
              <button type="submit" class="btn-primary flex-1">
                <span class="material-symbols-rounded">send</span>
                <span>Envoyer le Signalement à la STEG</span>
              </button>
            </div>

          </form>

        </div>
      }

      <!-- ONGLET 2 : SUIVI DE RÉCLAMATION TYPE COLIS [NOUVEAU] -->
      @if (activeTab() === 'track') {
        <div class="tracking-card glass-card animate-float" appTilt3d [maxTilt]="3">
          
          <div class="track-header">
            <div class="track-id-badge">
              <span class="material-symbols-rounded">inventory_2</span>
              <span>Dossier Réclamation : <strong>{{ trackingTicket.ref }}</strong></span>
            </div>
            <span class="track-live-chip">
              <span class="pulse-dot"></span>
              En cours de traitement
            </span>
          </div>

          <!-- Estimation IA du temps de rétablissement -->
          <div class="ai-restoration-box glass-panel">
            <div class="ai-icon-bubble">
              <span class="material-symbols-rounded">schedule</span>
            </div>
            <div class="ai-content">
              <div class="ai-title-row">
                <span class="ai-badge">Modèle IA Prédictif</span>
                <span class="ai-conf">Confiance : 96.4%</span>
              </div>
              <h3 class="ai-time">Durée Estimée de Rétablissement : <strong>{{ trackingTicket.estimatedTimeRemaining }}</strong></h3>
              <p class="ai-factors">
                Facteurs pris en compte : type de panne (<em>{{ trackingTicket.outageType }}</em>), conditions météo actuelles (<em>{{ trackingTicket.weatherCondition }}</em>), et distance du technicien mobile le plus proche (<em>{{ trackingTicket.techDistance }}</em>).
              </p>
            </div>
          </div>

          <!-- Stepper Visuel Type Colis à 5 étapes -->
          <div class="parcel-stepper">
            @for (step of parcelSteps; track step.id; let idx = $index) {
              <div class="step-col" [class.completed]="currentStepIndex() > idx" [class.current]="currentStepIndex() === idx">
                <div class="step-circle">
                  <span class="material-symbols-rounded">{{ step.icon }}</span>
                </div>
                <div class="step-info">
                  <strong class="step-label">{{ step.label }}</strong>
                  <span class="step-time">{{ step.time }}</span>
                  <p class="step-desc">{{ step.desc }}</p>
                </div>
                @if (idx < parcelSteps.length - 1) {
                  <div class="step-connector" [class.active]="currentStepIndex() > idx"></div>
                }
              </div>
            }
          </div>

          <!-- Carte info Technicien & Équipe affectée -->
          <div class="tech-assignment-card glass-panel">
            <div class="tech-avatar-box">
              <span class="material-symbols-rounded">engineering</span>
            </div>
            <div class="tech-details">
              <strong>Équipe STEG Mobilisée : Brigade Nord-Est</strong>
              <span>Technicien référent : <em>{{ trackingTicket.technicianName }}</em> (Véhicule Nacelle #44)</span>
              <span class="tech-status">
                <span class="material-symbols-rounded text-green">near_me</span>
                Position actuelle : En route vers {{ trackingTicket.district }} (Arrivée dans ~12 min)
              </span>
            </div>
            <button class="btn-secondary" (click)="simulateSmsAlert()">
              <span class="material-symbols-rounded">sms</span>
              <span>Recevoir Alerte SMS</span>
            </button>
          </div>

          <!-- Outils de simulation de l'avancement pour démo -->
          <div class="demo-controls-box glass-panel">
            <div class="demo-lbl">Simulateur d'Avancement de la Réclamation (Démo) :</div>
            <div class="demo-btns-row">
              <button class="btn-step" (click)="advanceStep(0)" [class.active]="currentStepIndex() === 0">1. Signalé</button>
              <button class="btn-step" (click)="advanceStep(1)" [class.active]="currentStepIndex() === 1">2. Assigné</button>
              <button class="btn-step" (click)="advanceStep(2)" [class.active]="currentStepIndex() === 2">3. En Route</button>
              <button class="btn-step" (click)="advanceStep(3)" [class.active]="currentStepIndex() === 3">4. En Réparation</button>
              <button class="btn-step" (click)="advanceStep(4)" [class.active]="currentStepIndex() === 4">5. Résolu & Rétabli</button>
            </div>
          </div>

        </div>
      }

    </div>
  `,
  styles: [`
    .report-page {
      display: flex;
      justify-content: center;
      padding: 20px 16px 50px 16px;
    }

    .report-card {
      width: 100%;
      max-width: 680px;
      padding: 36px 34px;
      border-radius: var(--radius-xl);
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid var(--border-glass);
      box-shadow: var(--shadow-lg);
    }

    .card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 26px;
    }

    .header-icon-box {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FF6B6B 0%, #D90429 100%);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      box-shadow: 0 6px 18px rgba(255, 107, 107, 0.4);
      margin-bottom: 14px;
    }

    .header-title {
      font-size: 24px;
      font-weight: 900;
      color: var(--text-main);
      margin-bottom: 6px;
    }

    .header-desc {
      font-size: 14px;
      color: var(--text-muted);
      max-width: 500px;
    }

    .report-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
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

    .label-with-action {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .btn-detect-gps {
      background: none;
      border: none;
      color: var(--sky-deep);
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      &:hover { text-decoration: underline; }
      .material-symbols-rounded { font-size: 16px; }
    }

    .coord-tag {
      font-size: 11px;
      color: var(--text-light);
      font-family: monospace;
    }

    .form-label {
      font-size: 13px;
      font-weight: 800;
      color: var(--text-main);
    }

    .form-input, .form-select, .form-textarea {
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1.5px solid rgba(29, 53, 87, 0.12);
      font-size: 13.5px;
      color: var(--text-main);
      outline: none;
      font-family: inherit;
      background: rgba(255, 255, 255, 0.9);
      &:focus { border-color: var(--sun-gold); }
    }

    .types-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .type-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.9);
      border: 1.5px solid rgba(29, 53, 87, 0.1);
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      color: var(--text-muted);
      transition: all var(--transition-fast);

      .material-symbols-rounded { font-size: 20px; color: var(--sun-amber); }

      &:hover {
        background: #FFFFFF;
        border-color: var(--sun-amber);
        color: var(--text-main);
      }

      &.active {
        background: var(--sun-gradient);
        color: #FFFFFF;
        border-color: transparent;
        .material-symbols-rounded { color: #FFFFFF; }
      }
    }

    .photo-mock-box {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
      border: 2px dashed rgba(29, 53, 87, 0.18);
      border-radius: var(--radius-md);
      background: rgba(255, 251, 242, 0.6);
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--sky-blue);
        background: #FFFFFF;
      }
    }

    .photo-icon {
      font-size: 28px;
      color: var(--sky-ocean);
    }

    .photo-text {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-main);
      display: block;
    }

    .photo-sub {
      font-size: 11.5px;
      color: var(--text-light);
    }

    .photo-preview-box {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.95);
      border: 1.5px solid var(--nature-green);
      border-radius: var(--radius-md);
    }

    .preview-img {
      width: 60px;
      height: 60px;
      border-radius: var(--radius-sm);
      object-fit: cover;
      box-shadow: var(--shadow-sm);
    }

    .preview-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      .p-title { font-size: 12.5px; font-weight: 800; color: var(--text-main); }
      .p-size { font-size: 11px; color: var(--text-light); }
    }

    .btn-remove-photo {
      background: none;
      border: none;
      color: var(--alert-coral);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 0;
      &:hover { text-decoration: underline; }
    }

    .report-tabs-nav {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      padding: 8px;
      background: rgba(255, 255, 255, 0.85);
      border-radius: var(--radius-lg);
      max-width: 760px;
      width: 100%;
    }

    .nav-tab-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 12px 18px;
      border: none;
      background: none;
      border-radius: var(--radius-md);
      font-size: 14px;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.25s ease;

      .material-symbols-rounded { font-size: 20px; }

      &.active {
        background: #FFFFFF;
        color: var(--text-main);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }
    }

    .tab-badge {
      background: rgba(245, 158, 11, 0.15);
      color: var(--sun-amber);
      font-size: 11px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: var(--radius-full);
    }

    .tracking-card {
      width: 100%;
      max-width: 760px;
      padding: 36px 34px;
      border-radius: var(--radius-xl);
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid var(--border-glass);
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .track-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      padding-bottom: 18px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    .track-id-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      color: var(--text-main);
      .material-symbols-rounded { color: var(--sun-amber); }
      strong { color: var(--sky-ocean); font-size: 17px; }
    }

    .track-live-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(46, 196, 182, 0.15);
      color: #0d5c52;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 800;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #0d5c52;
      animation: pulseGlow 1.8s infinite;
    }

    .ai-restoration-box {
      display: flex;
      gap: 18px;
      padding: 20px 22px;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, rgba(237, 246, 249, 0.9) 0%, rgba(224, 251, 252, 0.9) 100%);
      border: 1px solid rgba(142, 202, 230, 0.4);
    }

    .ai-icon-bubble {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0E6BA8 0%, #1D3557 100%);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      .material-symbols-rounded { font-size: 26px; }
    }

    .ai-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .ai-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .ai-badge {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--sky-ocean);
      background: rgba(14, 107, 168, 0.12);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
    }

    .ai-conf {
      font-size: 12px;
      color: var(--nature-green);
      font-weight: 700;
    }

    .ai-time {
      font-size: 18px;
      color: var(--text-main);
      margin: 0;
      strong { color: var(--alert-coral); font-size: 22px; }
    }

    .ai-factors {
      font-size: 12.5px;
      color: var(--text-muted);
      line-height: 1.45;
      margin: 0;
    }

    .parcel-stepper {
      display: flex;
      justify-content: space-between;
      position: relative;
      margin: 15px 0;
      gap: 8px;
    }

    .step-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
      z-index: 1;
    }

    .step-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #E2E8F0;
      color: #94A3B8;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10px;
      transition: all 0.3s;
      .material-symbols-rounded { font-size: 22px; }
    }

    .step-col.completed .step-circle {
      background: var(--nature-green);
      color: #FFFFFF;
      box-shadow: 0 4px 12px rgba(46, 196, 182, 0.4);
    }

    .step-col.current .step-circle {
      background: var(--sun-amber);
      color: #FFFFFF;
      box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.2);
      animation: pulseGlow 2s infinite;
    }

    .step-label {
      font-size: 13px;
      font-weight: 800;
      color: var(--text-main);
      display: block;
      margin-bottom: 2px;
    }

    .step-time {
      font-size: 11px;
      color: var(--text-light);
      display: block;
      margin-bottom: 4px;
    }

    .step-desc {
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.35;
      max-width: 120px;
      margin: 0;
    }

    .step-connector {
      position: absolute;
      top: 22px;
      left: 50%;
      width: 100%;
      height: 4px;
      background: #E2E8F0;
      z-index: -1;
      &.active {
        background: var(--nature-green);
      }
    }

    .tech-assignment-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      border-radius: var(--radius-md);
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      flex-wrap: wrap;
    }

    .tech-avatar-box {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(14, 107, 168, 0.12);
      color: var(--sky-ocean);
      display: flex;
      align-items: center;
      justify-content: center;
      .material-symbols-rounded { font-size: 24px; }
    }

    .tech-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
      font-size: 13px;
      strong { color: var(--text-main); }
      span { color: var(--text-muted); }
      .tech-status {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #0d5c52;
        font-weight: 600;
        font-size: 12px;
      }
    }

    .demo-controls-box {
      padding: 16px;
      border-radius: var(--radius-md);
      background: rgba(255, 251, 242, 0.85);
      border: 1px dashed rgba(245, 158, 11, 0.4);
    }

    .demo-lbl {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    .demo-btns-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn-step {
      padding: 6px 14px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(29, 53, 87, 0.2);
      background: #FFFFFF;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-main);
      cursor: pointer;
      transition: all 0.2s;
      &:hover { border-color: var(--sky-ocean); }
      &.active {
        background: var(--sky-ocean);
        color: #FFFFFF;
        border-color: var(--sky-ocean);
      }
    }

    @media (max-width: 650px) {
      .parcel-stepper { flex-direction: column; gap: 20px; }
      .step-connector { display: none; }
      .step-col { flex-direction: row; gap: 14px; text-align: left; }
      .step-desc { max-width: none; }
    }
  `]
})
export class ReportOutageComponent {
  outageService = inject(OutageService);
  eleService = inject(ElectricityService);
  authService = inject(AuthService);
  notifService = inject(NotificationService);
  router = inject(Router);

  activeTab = signal<'report' | 'track'>('report');
  currentStepIndex = signal<number>(2);

  trackingTicket = {
    ref: '#STG-2025-9921',
    estimatedTimeRemaining: '1h 35min',
    outageType: 'Ligne Moyenne Tension Disjonctée',
    weatherCondition: '36°C Chaleur estivale',
    techDistance: '3.8 km',
    technicianName: 'Sami Khelifi',
    district: 'Menzah 6'
  };

  parcelSteps = [
    { id: 1, label: '1. Signalé', time: '11:15', desc: 'Signalement validé par la STEG et regroupé avec 14 voisins.', icon: 'mark_email_read' },
    { id: 2, label: '2. Assigné', time: '11:22', desc: 'Affecté au technicien Sami K. (District Ariana Nord).', icon: 'assignment_ind' },
    { id: 3, label: '3. En Route', time: '11:34', desc: 'Véhicule nacelle #44 en route vers le transformateur.', icon: 'local_shipping' },
    { id: 4, label: '4. En Réparation', time: 'En cours', desc: 'Remplacement du fusible HT et purge de ligne.', icon: 'build' },
    { id: 5, label: '5. Rétabli', time: 'Estimé 12:50', desc: 'Courant rétabli et vérification télémétrique.', icon: 'check_circle' }
  ];

  governorate = 'Tunis';
  district = 'Menzah 6';
  address = '14 Rue de la Liberté, Menzah 6';
  lat = 36.8189;
  lng = 10.1798;
  outageTime = '11:30';
  estimatedScope = 'RUE';
  selectedType: OutageType = 'PANNE_TRANSFORMATEUR';
  notes = '';
  attachedPhoto = signal<string | null>(null);

  outageTypes: { value: OutageType; label: string; icon: string }[] = [
    { value: 'PANNE_TRANSFORMATEUR', label: 'Transformateur / Quartier', icon: 'electric_meter' },
    { value: 'LIGNE_COUPEE', label: 'Câble Tombé / Aérien', icon: 'cable' },
    { value: 'SURCHARGE_RESEAU', label: 'Surcharge & Coupure', icon: 'bolt' },
    { value: 'INTEMPERIES', label: 'Intempéries / Sirocco', icon: 'storm' }
  ];

  detectGps(): void {
    const gov = this.eleService.governorates().find(g => g.name === this.governorate);
    if (gov) {
      this.lat = gov.lat + (Math.random() - 0.5) * 0.02;
      this.lng = gov.lng + (Math.random() - 0.5) * 0.02;
      this.address = `Avenue Habib Bourguiba, Secteur Central, ${this.governorate}`;
      this.notifService.showToast('Position GPS Détectée', `Coordonnées fixées : ${this.lat.toFixed(4)}°N, ${this.lng.toFixed(4)}°E`, 'SUCCESS');
    }
  }

  onGovChange(): void {
    this.detectGps();
  }

  simulatePhotoUpload(): void {
    this.attachedPhoto.set('https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=300&q=80');
    this.notifService.showToast('Photo Attachée', 'Photo de l\'incident ajoutée avec succès au rapport.', 'INFO');
  }

  removePhoto(): void {
    this.attachedPhoto.set(null);
  }

  advanceStep(idx: number): void {
    this.currentStepIndex.set(idx);
    const step = this.parcelSteps[idx];
    if (idx === 4) {
      this.notifService.showToast(
        'Courant Rétabli !',
        'L\'intervention technique est terminée avec succès. Votre secteur est de nouveau alimenté.',
        'SUCCESS',
        6000
      );
    } else {
      this.notifService.showToast(
        `Statut Réclamation : ${step.label}`,
        step.desc,
        'INFO',
        3500
      );
    }
  }

  simulateSmsAlert(): void {
    this.notifService.showToast(
      'Notification SMS Programmée',
      'Un SMS vous sera envoyé dès l\'arrivée du technicien et à la clôture de l\'intervention au +216 20 123 456.',
      'SUCCESS',
      4000
    );
  }

  onSubmit(): void {
    const report = this.outageService.reportOutage({
      governorate: this.governorate,
      district: this.district,
      address: this.address,
      type: this.selectedType,
      notes: `${this.notes} [Heure signalée: ${this.outageTime}, Ampleur: ${this.estimatedScope}]`,
      reportedBy: this.authService.currentUser()?.name || 'Citoyen Connecté'
    });

    this.trackingTicket.ref = report.reference;
    this.activeTab.set('track');

    this.notifService.showToast(
      'Signalement Envoyé à la STEG !',
      `Référence ${report.reference} enregistrée. Votre suivi en direct de type colis est ouvert ci-dessous.`,
      'SUCCESS',
      5000
    );
  }
}
