import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OutageService } from '../../../core/services/outage.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { OutageReport, OutageStatus } from '../../../models/outage.model';
import { Tilt3dDirective } from '../../../shared/directives/tilt-3d.directive';

@Component({
  selector: 'app-technicien-interventions',
  standalone: true,
  imports: [CommonModule, FormsModule, Tilt3dDirective],
  template: `
    <div class="tech-page">
      
      <div class="tech-header glass-card">
        <div class="header-content">
          <div class="badge-row">
            <span class="glass-badge badge-sun">
              <span class="material-symbols-rounded">engineering</span>
              Équipe d'Intervention Rapide
            </span>
            <span class="glass-badge badge-sky">District Tunis & Nord-Est</span>
          </div>
          <h1 class="header-title">Mes Ordres de Mission & Interventions</h1>
          <p class="header-desc">
            Intervenant assigné : <strong>{{ authService.currentUser()?.name }}</strong>. 
            Mettez à jour vos statuts de terrain pour synchroniser le centre de contrôle et les notifications citoyens.
          </p>
        </div>
        <div class="status-counters">
          <div class="count-box coral">
            <span class="c-val">{{ countPending() }}</span>
            <span class="c-label">À Prendre en Charge</span>
          </div>
          <div class="count-box sun">
            <span class="c-val">{{ countInProgress() }}</span>
            <span class="c-label">En Cours de Réparation</span>
          </div>
          <div class="count-box nature">
            <span class="c-val">{{ countResolved() }}</span>
            <span class="c-label">Résolus Aujourd'hui</span>
          </div>
        </div>
      </div>

      <div class="filter-bar glass-card">
        <div class="tab-filters">
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'ALL'" 
            (click)="activeTab.set('ALL')"
          >
            Toutes les missions ({{ myInterventions().length }})
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'EN_COURS'" 
            (click)="activeTab.set('EN_COURS')"
          >
            En Cours ({{ countInProgress() }})
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'SIGNALE'" 
            (click)="activeTab.set('SIGNALE')"
          >
            Non Démarrées ({{ countPending() }})
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'RESOLU'" 
            (click)="activeTab.set('RESOLU')"
          >
            Résolues ({{ countResolved() }})
          </button>
        </div>
      </div>

      <!-- Grille des Ordres de Mission -->
      <div class="interventions-grid">
        @for (item of filteredInterventions(); track item.id) {
          <div class="intervention-card glass-card" appTilt3d [maxTilt]="6">
            
            <div class="card-top">
              <div class="ref-group">
                <span class="ref-badge">{{ item.reference }}</span>
                <span class="type-tag">{{ formatType(item.type) }}</span>
              </div>
              <span class="glass-badge" [ngClass]="'badge-' + getSeverityColor(item.severity)">
                {{ item.severity }}
              </span>
            </div>

            <div class="location-group">
              <span class="material-symbols-rounded loc-icon">location_on</span>
              <div>
                <h3 class="loc-address">{{ item.address }}</h3>
                <span class="loc-gov">{{ item.district }}, <strong>{{ item.governorate }}</strong></span>
              </div>
            </div>

            <div class="details-list">
              <div class="detail-row">
                <span class="d-label">Abonnés impactés :</span>
                <span class="d-val text-coral font-bold">{{ item.affectedCustomers | number }}</span>
              </div>
              <div class="detail-row">
                <span class="d-label">Signalé le :</span>
                <span class="d-val">{{ item.reportedAt }}</span>
              </div>
              <div class="detail-row">
                <span class="d-label">Rétablissement estimé :</span>
                <span class="d-val highlight">{{ item.estimatedResolution }}</span>
              </div>
            </div>

            <!-- Notes techniques actuelles -->
            <div class="notes-box">
              <span class="notes-caption">Diagnostic / Notes :</span>
              <p class="notes-text">{{ item.notes }}</p>
            </div>

            <!-- Boutons de passage d'état du workflow -->
            <div class="action-footer">
              @if (item.status === 'SIGNALE') {
                <button class="btn-primary btn-full" (click)="updateStatus(item, 'EN_COURS')">
                  <span class="material-symbols-rounded">play_arrow</span>
                  <span>Prendre en Charge & Aller sur Site</span>
                </button>
              } @else if (item.status === 'EN_COURS') {
                <div class="status-action-row">
                  <button class="btn-nature btn-half" (click)="openResolveDialog(item)">
                    <span class="material-symbols-rounded">check_circle</span>
                    <span>Clôturer (Résolu)</span>
                  </button>
                  <button class="btn-secondary btn-half" (click)="addQuickNote(item)">
                    <span class="material-symbols-rounded">edit_note</span>
                    <span>Ajouter Note</span>
                  </button>
                </div>
              } @else {
                <div class="resolved-banner">
                  <span class="material-symbols-rounded check-icon">verified</span>
                  <span>Intervention finalisée avec succès</span>
                </div>
              }
            </div>

          </div>
        }
      </div>

      <!-- Dialogue Modal de clôture d'intervention -->
      @if (selectedForResolve()) {
        <div class="modal-backdrop">
          <div class="resolve-modal glass-card animate-float">
            <div class="modal-header">
              <h2 class="modal-title">Rapport de Clôture d'Intervention</h2>
              <button class="btn-close" (click)="selectedForResolve.set(null)">✕</button>
            </div>
            <div class="modal-body">
              <p class="modal-sub">
                Incident : <strong>{{ selectedForResolve()?.reference }}</strong> — {{ selectedForResolve()?.address }}
              </p>
              <div class="form-group">
                <label>Rapport technique de réparation :</label>
                <textarea 
                  class="form-textarea" 
                  rows="3" 
                  [(ngModel)]="resolutionNotes"
                  placeholder="Ex : Remplacement fusible MT 100A, nettoyage des bornes du transformateur et remise sous tension sans anomalie."
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" (click)="selectedForResolve.set(null)">Annuler</button>
              <button class="btn-nature" (click)="confirmResolution()">
                <span class="material-symbols-rounded">check</span>
                <span>Valider et Rétablir le Courant</span>
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .tech-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 40px;
    }

    .tech-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 30px;
      border-radius: var(--radius-xl);
      gap: 20px;
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
      font-size: 14px;
      color: var(--text-muted);
      max-width: 600px;
    }

    .status-counters {
      display: flex;
      gap: 14px;
      flex-shrink: 0;
    }

    .count-box {
      padding: 14px 18px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: var(--shadow-sm);
      min-width: 130px;

      .c-val {
        font-family: var(--font-title);
        font-size: 26px;
        font-weight: 900;
      }
      .c-label {
        font-size: 11px;
        color: var(--text-muted);
        text-align: center;
        font-weight: 700;
      }

      &.coral .c-val { color: var(--alert-coral); }
      &.sun .c-val { color: var(--sun-amber); }
      &.nature .c-val { color: var(--nature-green); }
    }

    .filter-bar {
      padding: 12px 18px;
      border-radius: var(--radius-lg);
    }

    .tab-filters {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .tab-btn {
      padding: 8px 16px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(29, 53, 87, 0.1);
      background: rgba(255, 255, 255, 0.85);
      color: var(--text-muted);
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover { color: var(--text-main); }
      &.active {
        background: var(--sun-gradient);
        color: #FFFFFF;
        border-color: transparent;
        box-shadow: 0 2px 8px rgba(251, 133, 0, 0.3);
      }
    }

    /* Grille Interventions */
    .interventions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }

    .intervention-card {
      padding: 22px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .ref-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ref-badge {
      font-family: var(--font-title);
      font-weight: 800;
      font-size: 13px;
      color: var(--text-main);
      background: rgba(29, 53, 87, 0.08);
      padding: 3px 8px;
      border-radius: var(--radius-xs);
    }

    .type-tag {
      font-size: 11px;
      font-weight: 700;
      color: var(--sky-deep);
    }

    .location-group {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .loc-icon {
      font-size: 24px;
      color: var(--sun-amber);
      margin-top: 2px;
    }

    .loc-address {
      font-size: 15px;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.25;
    }

    .loc-gov {
      font-size: 12px;
      color: var(--text-light);
    }

    .details-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.65);
      border-radius: var(--radius-md);
      font-size: 12.5px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      .d-label { color: var(--text-muted); }
      .d-val {
        color: var(--text-main);
        &.highlight { color: var(--sun-amber); font-weight: 700; }
      }
    }

    .notes-box {
      font-size: 12px;
      background: rgba(255, 251, 242, 0.8);
      border-left: 3px solid var(--sun-gold);
      padding: 8px 12px;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;

      .notes-caption {
        font-weight: 800;
        color: #A35C00;
        display: block;
        margin-bottom: 2px;
      }
      .notes-text {
        color: var(--text-muted);
        line-height: 1.35;
      }
    }

    .action-footer {
      padding-top: 10px;
      border-top: 1px solid rgba(29, 53, 87, 0.08);
    }

    .btn-full { width: 100%; }
    .status-action-row { display: flex; gap: 8px; }
    .btn-half { flex: 1; }

    .resolved-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      border-radius: var(--radius-full);
      background: var(--nature-light);
      color: var(--nature-green);
      font-weight: 800;
      font-size: 13px;

      .check-icon { font-size: 20px; }
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(29, 53, 87, 0.45);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
    }

    .resolve-modal {
      width: 100%;
      max-width: 520px;
      padding: 26px;
      background: rgba(255, 255, 255, 0.96);
      border-radius: var(--radius-xl);
      box-shadow: 0 20px 48px rgba(29, 53, 87, 0.25);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 800;
      color: var(--text-main);
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 18px;
      color: var(--text-light);
      cursor: pointer;
      &:hover { color: var(--alert-coral); }
    }

    .modal-sub {
      font-size: 13.5px;
      color: var(--text-muted);
      margin-bottom: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 20px;
      label {
        font-size: 13px;
        font-weight: 700;
        color: var(--text-main);
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    @media (max-width: 900px) {
      .tech-header { flex-direction: column; align-items: flex-start; }
      .status-counters { width: 100%; justify-content: space-between; }
    }
  `]
})
export class TechnicienInterventionsComponent {
  outageService = inject(OutageService);
  authService = inject(AuthService);
  notifService = inject(NotificationService);

  activeTab = signal<string>('ALL');
  selectedForResolve = signal<OutageReport | null>(null);
  resolutionNotes = 'Intervention réalisée conformément aux normes de sécurité STEG. Continuité de service vérifiée.';

  myInterventions(): OutageReport[] {
    // Affiche toutes les pannes (avec priorité pour celles assignées à Karim ou de son secteur)
    return this.outageService.outages();
  }

  filteredInterventions(): OutageReport[] {
    const tab = this.activeTab();
    const list = this.myInterventions();
    if (tab === 'ALL') return list;
    return list.filter(item => item.status === tab);
  }

  countPending(): number {
    return this.myInterventions().filter(i => i.status === 'SIGNALE').length;
  }

  countInProgress(): number {
    return this.myInterventions().filter(i => i.status === 'EN_COURS').length;
  }

  countResolved(): number {
    return this.myInterventions().filter(i => i.status === 'RESOLU').length;
  }

  updateStatus(item: OutageReport, newStatus: OutageStatus): void {
    this.outageService.updateOutageStatus(item.id, newStatus, 'Technicien en route avec véhicule d\'intervention rapide.');
    this.notifService.showToast('Ordre de mission démarré', `Prise en charge de ${item.reference} confirmée.`, 'INFO');
  }

  openResolveDialog(item: OutageReport): void {
    this.selectedForResolve.set(item);
  }

  confirmResolution(): void {
    const item = this.selectedForResolve();
    if (!item) return;

    this.outageService.updateOutageStatus(item.id, 'RESOLU', this.resolutionNotes);
    this.notifService.showToast(
      'Panne Résolue avec Succès !',
      `Le courant a été rétabli pour ${item.affectedCustomers} abonnés à ${item.address}.`,
      'SUCCESS'
    );
    this.selectedForResolve.set(null);
  }

  addQuickNote(item: OutageReport): void {
    const note = prompt('Ajouter une note de terrain pour ' + item.reference + ' :');
    if (note) {
      this.outageService.updateOutageStatus(item.id, item.status, note);
      this.notifService.showToast('Note ajoutée', 'Note enregistrée dans le dossier technique.', 'INFO');
    }
  }

  formatType(type: string): string {
    switch (type) {
      case 'PANNE_TRANSFORMATEUR': return 'Transformateur';
      case 'LIGNE_COUPEE': return 'Câble / Ligne';
      case 'SURCHARGE_RESEAU': return 'Surcharge Réseau';
      case 'MAINTENANCE_PREVENTIVE': return 'Maintenance';
      case 'INTEMPERIES': return 'Intempéries / Sirocco';
      default: return 'Incident Technique';
    }
  }

  getSeverityColor(sev: string): string {
    switch (sev) {
      case 'MAJEURE': return 'coral';
      case 'MOYENNE': return 'sun';
      default: return 'nature';
    }
  }
}
