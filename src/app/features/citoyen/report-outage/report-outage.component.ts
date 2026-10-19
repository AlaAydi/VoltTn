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

    .actions-row {
      display: flex;
      gap: 12px;
      margin-top: 10px;
    }

    @media (max-width: 600px) {
      .form-row { flex-direction: column; }
      .types-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ReportOutageComponent {
  outageService = inject(OutageService);
  eleService = inject(ElectricityService);
  authService = inject(AuthService);
  notifService = inject(NotificationService);
  router = inject(Router);

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
    // Photo réaliste d'infrastructure électrique
    this.attachedPhoto.set('https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=300&q=80');
    this.notifService.showToast('Photo Attachée', 'Photo de l\'incident ajoutée avec succès au rapport.', 'INFO');
  }

  removePhoto(): void {
    this.attachedPhoto.set(null);
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

    this.notifService.showToast(
      'Signalement Envoyé à la STEG !',
      `Référence ${report.reference} enregistrée. L'équipe d'intervention la plus proche a été mobilisée.`,
      'SUCCESS',
      5000
    );

    this.router.navigate(['/outages']);
  }
}
