import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OutageService } from '../../../core/services/outage.service';
import { ElectricityService } from '../../../core/services/electricity.service';
import { OutageReport } from '../../../models/outage.model';

@Component({
  selector: 'app-outage-map',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="outages-page">
      
      <!-- En-tête Transparence Réseau -->
      <div class="page-header glass-card">
        <div class="header-left">
          <div class="badge-row">
            <span class="glass-badge badge-coral">
              <span class="material-symbols-rounded">power_off</span>
              Observatoire Public des Pannes
            </span>
            <span class="glass-badge badge-sky">Données Ouvertes Temps Réel</span>
          </div>
          <h1 class="header-title">Carte des Coupures & Interventions en Tunisie</h1>
          <p class="header-desc">
            Consultez les incidents en cours sur le réseau électrique moyenne et basse tension, les heures prévues de rétablissement et les équipes mobilisées.
          </p>
        </div>
        <div class="header-actions">
          <a routerLink="/citoyen/report-outage" class="btn-primary">
            <span class="material-symbols-rounded">add_alert</span>
            <span>Signaler une Panne dans mon Quartier</span>
          </a>
        </div>
      </div>

      <!-- Filtres et recherche -->
      <div class="filter-card glass-card">
        <div class="filter-row">
          <div class="search-input-box">
            <span class="material-symbols-rounded">search</span>
            <input 
              type="text" 
              placeholder="Rechercher une rue, un quartier ou une référence..." 
              (input)="onSearchChange($event)"
            />
          </div>

          <div class="status-pills">
            <button 
              class="pill-btn" 
              [class.active]="selectedStatus() === 'ALL'" 
              (click)="selectedStatus.set('ALL')"
            >
              Tous ({{ outageService.outages().length }})
            </button>
            <button 
              class="pill-btn coral" 
              [class.active]="selectedStatus() === 'ACTIVE'" 
              (click)="selectedStatus.set('ACTIVE')"
            >
              Coupures Actives ({{ outageService.stats().active }})
            </button>
            <button 
              class="pill-btn nature" 
              [class.active]="selectedStatus() === 'RESOLU'" 
              (click)="selectedStatus.set('RESOLU')"
            >
              Rétablis Aujourd'hui ({{ outageService.stats().resolved }})
            </button>
          </div>
        </div>
      </div>

      <!-- Disposition : Carte interactive visuelle + Liste des Incidents -->
      <div class="outages-layout">
        
        <!-- Cartographie stylisée des points d'intervention -->
        <div class="map-view-card glass-card">
          <div class="map-interactive-mock">
            
            <div class="map-badge-overlay">
              <span class="material-symbols-rounded">public</span>
              <span>Vue Réseau Tunisie</span>
            </div>

            <!-- Points d'intervention sur la carte de Tunisie -->
            @for (item of filteredOutages(); track item.id; let i = $index) {
              <div 
                class="map-pin-marker animate-float"
                [style.top.%]="getMapTopPct(item.lat)"
                [style.left.%]="getMapLeftPct(item.lng)"
                [class.pin-active]="item.status !== 'RESOLU'"
                [class.pin-resolved]="item.status === 'RESOLU'"
                (click)="selectedItem.set(item)"
                [title]="item.reference + ' - ' + item.address"
              >
                <span class="material-symbols-rounded pin-symbol">
                  {{ item.status === 'RESOLU' ? 'check' : 'bolt' }}
                </span>
                <span class="pin-tag">{{ item.governorate }}</span>
              </div>
            }

            <div class="map-tip">
              Cliquez sur un marqueur pour inspecter l'intervention
            </div>
          </div>
        </div>

        <!-- Fiche de détail ou liste -->
        <div class="list-column">
          
          @if (selectedItem(); as current) {
            <div class="detail-card glass-card animate-float">
              <div class="detail-header">
                <div>
                  <span class="detail-ref">{{ current.reference }}</span>
                  <h3 class="detail-addr">{{ current.address }}</h3>
                  <span class="detail-gov">{{ current.district }}, {{ current.governorate }}</span>
                </div>
                <span class="glass-badge" [ngClass]="current.status === 'RESOLU' ? 'badge-nature' : 'badge-coral'">
                  {{ current.status }}
                </span>
              </div>

              <div class="detail-body">
                <div class="d-item">
                  <span class="d-lbl">Abonnés touchés :</span>
                  <strong class="d-val text-coral">{{ current.affectedCustomers }}</strong>
                </div>
                <div class="d-item">
                  <span class="d-lbl">Type de panne :</span>
                  <span class="d-val">{{ current.type }}</span>
                </div>
                <div class="d-item">
                  <span class="d-lbl">Signalement :</span>
                  <span class="d-val">{{ current.reportedAt }}</span>
                </div>
                <div class="d-item">
                  <span class="d-lbl">Rétablissement estimé :</span>
                  <strong class="d-val highlight">{{ current.estimatedResolution }}</strong>
                </div>
                <div class="d-item">
                  <span class="d-lbl">Équipe mandatée :</span>
                  <span class="d-val">{{ current.assignedTechnician || 'Équipe de garde' }}</span>
                </div>
              </div>

              <p class="detail-notes">{{ current.notes }}</p>

              <button class="btn-secondary btn-full" (click)="selectedItem.set(null)">
                Fermer le détail
              </button>
            </div>
          }

          <div class="cards-scroll-list">
            @for (outage of filteredOutages(); track outage.id) {
              <div 
                class="outage-list-item glass-panel"
                [class.selected]="selectedItem()?.id === outage.id"
                (click)="selectedItem.set(outage)"
              >
                <div class="item-dot" [class.resolved]="outage.status === 'RESOLU'"></div>
                <div class="item-main">
                  <div class="item-top">
                    <span class="item-ref">{{ outage.reference }}</span>
                    <span class="item-gov">{{ outage.governorate }}</span>
                  </div>
                  <div class="item-address">{{ outage.address }}</div>
                  <div class="item-bottom">
                    <span class="item-affected">{{ outage.affectedCustomers }} abonnés</span>
                    <span class="item-time">Rétablissement : {{ outage.estimatedResolution }}</span>
                  </div>
                </div>
              </div>
            }
          </div>

        </div>

      </div>

    </div>
  `,
  styles: [`
    .outages-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 50px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 26px 32px;
      border-radius: var(--radius-xl);
      gap: 20px;
      flex-wrap: wrap;
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
      max-width: 650px;
    }

    .filter-card {
      padding: 16px 20px;
      border-radius: var(--radius-lg);
    }

    .filter-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .search-input-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.9);
      border: 1.5px solid rgba(29, 53, 87, 0.1);
      border-radius: var(--radius-full);
      width: 320px;
      max-width: 100%;

      .material-symbols-rounded { color: var(--text-light); }
      input {
        border: none;
        outline: none;
        background: transparent;
        font-size: 13.5px;
        width: 100%;
      }
    }

    .status-pills {
      display: flex;
      gap: 8px;
    }

    .pill-btn {
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
      }
      &.coral.active { background: linear-gradient(135deg, #FF6B6B 0%, #D90429 100%); }
      &.nature.active { background: var(--nature-gradient); }
    }

    /* Layout */
    .outages-layout {
      display: grid;
      grid-template-columns: 1fr 420px;
      gap: 24px;
    }

    .map-view-card {
      position: relative;
      height: 520px;
      border-radius: var(--radius-xl);
      overflow: hidden;
      background: radial-gradient(circle at 50% 30%, #FFFFFF 0%, #EBF6FA 100%);
      box-shadow: var(--shadow-md);
    }

    .map-interactive-mock {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(rgba(76, 201, 240, 0.15) 1px, transparent 1px);
      background-size: 24px 24px;
    }

    .map-badge-overlay {
      position: absolute;
      top: 18px;
      left: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(8px);
      border-radius: var(--radius-full);
      font-weight: 800;
      font-size: 13px;
      color: var(--text-main);
      box-shadow: var(--shadow-sm);
    }

    .map-tip {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      padding: 6px 14px;
      background: rgba(255, 255, 255, 0.88);
      border-radius: var(--radius-full);
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
      pointer-events: none;
    }

    .map-pin-marker {
      position: absolute;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transform: translate(-50%, -50%);
      transition: transform var(--transition-bounce);

      &:hover {
        transform: translate(-50%, -50%) scale(1.2);
        z-index: 10;
      }
    }

    .pin-symbol {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--alert-coral);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.45);
    }

    .pin-resolved .pin-symbol {
      background: var(--nature-green);
      box-shadow: 0 4px 12px rgba(82, 183, 136, 0.45);
    }

    .pin-tag {
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.92);
      color: var(--text-main);
      box-shadow: var(--shadow-sm);
      white-space: nowrap;
    }

    /* List Column */
    .list-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 520px;
    }

    .detail-card {
      padding: 20px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: rgba(255, 255, 255, 0.98);
      border: 1.5px solid var(--sun-gold);
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .detail-ref {
      font-size: 12px;
      font-weight: 800;
      color: var(--sun-amber);
    }

    .detail-addr {
      font-size: 16px;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.25;
    }

    .detail-gov {
      font-size: 12px;
      color: var(--text-light);
    }

    .detail-body {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 13px;
    }

    .d-item {
      display: flex;
      justify-content: space-between;
      .d-lbl { color: var(--text-muted); }
      .d-val {
        color: var(--text-main);
        &.highlight { color: var(--sun-amber); }
      }
    }

    .detail-notes {
      font-size: 12px;
      color: var(--text-muted);
      background: rgba(255, 251, 242, 0.8);
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      border-left: 3px solid var(--sun-gold);
    }

    .btn-full { width: 100%; }

    .cards-scroll-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .outage-list-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        background: #FFFFFF;
        transform: translateX(4px);
      }
      &.selected {
        border-color: var(--sun-gold);
        background: #FFFFFF;
        box-shadow: var(--shadow-md);
      }
    }

    .item-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--alert-coral);
      flex-shrink: 0;

      &.resolved { background: var(--nature-green); }
    }

    .item-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .item-top {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }

    .item-ref { font-weight: 800; color: var(--text-main); }
    .item-gov { color: var(--sun-amber); font-weight: 700; }
    .item-address { font-size: 13.5px; font-weight: 700; color: var(--text-main); }

    .item-bottom {
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      color: var(--text-light);
      margin-top: 4px;
    }

    @media (max-width: 992px) {
      .outages-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class OutageMapComponent {
  outageService = inject(OutageService);
  eleService = inject(ElectricityService);

  selectedStatus = signal<'ALL' | 'ACTIVE' | 'RESOLU'>('ALL');
  searchQuery = signal<string>('');
  selectedItem = signal<OutageReport | null>(null);

  onSearchChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val.trim().toLowerCase());
  }

  filteredOutages(): OutageReport[] {
    const status = this.selectedStatus();
    const query = this.searchQuery();
    let list = this.outageService.outages();

    if (status === 'ACTIVE') {
      list = list.filter(o => o.status !== 'RESOLU');
    } else if (status === 'RESOLU') {
      list = list.filter(o => o.status === 'RESOLU');
    }

    if (query) {
      list = list.filter(o =>
        o.reference.toLowerCase().includes(query) ||
        o.address.toLowerCase().includes(query) ||
        o.governorate.toLowerCase().includes(query) ||
        o.district.toLowerCase().includes(query)
      );
    }

    return list;
  }

  // Projection cartographique normalisée pour la Tunisie
  getMapTopPct(lat: number): number {
    // 37.3°N (Bizerte) à 32.8°N (Tataouine)
    const minLat = 32.5;
    const maxLat = 37.5;
    const norm = (maxLat - lat) / (maxLat - minLat);
    return Math.max(8, Math.min(90, Math.round(norm * 85 + 6)));
  }

  getMapLeftPct(lng: number): number {
    // 8.1°E (Tozeur) à 11.2°E (Mahdia)
    const minLng = 8.0;
    const maxLng = 11.5;
    const norm = (lng - minLng) / (maxLng - minLng);
    return Math.max(12, Math.min(88, Math.round(norm * 75 + 12)));
  }
}
