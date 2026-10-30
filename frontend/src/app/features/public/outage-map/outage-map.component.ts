import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OutageService } from '../../../core/services/outage.service';
import { ElectricityService } from '../../../core/services/electricity.service';
import { OutageReport } from '../../../models/outage.model';
import { TunisiaLeafletMapComponent, RegionalOutageCluster } from '../../../shared/components/tunisia-leaflet-map/tunisia-leaflet-map.component';
import { WeatherService } from '../../../core/services/weather.service';

@Component({
  selector: 'app-outage-map',
  standalone: true,
  imports: [CommonModule, RouterModule, TunisiaLeafletMapComponent],
  template: `
    <div class="outages-page">
      
      <!-- En-tête Observatoire Réseau STEG -->
      <div class="page-header glass-card animate-float">
        <div class="header-left">
          <div class="badge-row">
            <span class="glass-badge badge-coral">
              <span class="material-symbols-rounded">power_off</span>
              Observatoire Cartographique des Pannes
            </span>
            <span class="glass-badge badge-sky">SIG Temps Réel Tunisie</span>
            <span class="glass-badge badge-nature">Fréquence Réseau : 50.02 Hz</span>
          </div>
          <h1 class="header-title">Carte des Coupures & Interventions Réseau en Tunisie</h1>
          <p class="header-desc">
            Visualisation interactive style Google Maps des incidents moyenne et basse tension, temps moyen de rétablissement (MTTR) calculé par IA et mobilisation des équipes STEG.
          </p>
        </div>
        <div class="header-actions">
          <a routerLink="/citoyen/report-outage" class="btn-primary">
            <span class="material-symbols-rounded">add_alert</span>
            <span>Signaler une Panne dans mon Quartier</span>
          </a>
        </div>
      </div>

      <!-- Métriques Clés en Direct -->
      <div class="metrics-row">
        <div class="kpi-card glass-card">
          <div class="kpi-icon coral">
            <span class="material-symbols-rounded">error</span>
          </div>
          <div class="kpi-meta">
            <span class="kpi-val text-coral">{{ outageService.stats().active }}</span>
            <span class="kpi-lbl">Coupures Actives en Cours</span>
          </div>
        </div>

        <div class="kpi-card glass-card">
          <div class="kpi-icon nature">
            <span class="material-symbols-rounded">check_circle</span>
          </div>
          <div class="kpi-meta">
            <span class="kpi-val text-nature">{{ outageService.stats().resolved }}</span>
            <span class="kpi-lbl">Incidents Rétablis Aujourd'hui</span>
          </div>
        </div>

        <div class="kpi-card glass-card">
          <div class="kpi-icon sun">
            <span class="material-symbols-rounded">people</span>
          </div>
          <div class="kpi-meta">
            <span class="kpi-val text-sun">{{ outageService.stats().totalAffected | number }}</span>
            <span class="kpi-lbl">Abonnés Touchés Actuellement</span>
          </div>
        </div>

        <div class="kpi-card glass-card">
          <div class="kpi-icon sky">
            <span class="material-symbols-rounded">avg_pace</span>
          </div>
          <div class="kpi-meta">
            <span class="kpi-val text-sky">2h 15m</span>
            <span class="kpi-lbl">Délai Moyen de Réparation (MTTR)</span>
          </div>
        </div>
      </div>

      <!-- Disposition : Carte Leaflet Google Maps + Liste Latérale -->
      <div class="outages-layout">
        
        <!-- Carte Réelle Leaflet Haute Performance avec Clusters Tunisie -->
        <div class="map-view-column">
          <app-tunisia-leaflet-map
            [outages]="outageService.outages()"
            (outageSelected)="onSelectFromMap($event)"
            (clusterSelected)="onClusterSelected($event)"
          ></app-tunisia-leaflet-map>
        </div>

        <!-- Fiche de détail ou Liste des signalements -->
        <div class="list-column">
          
          @if (selectedCluster(); as cluster) {
            <div class="region-filter-banner glass-card animate-float">
              <div class="rf-info">
                <span class="rf-badge">{{ cluster.count }}</span>
                <div>
                  <strong class="rf-title">{{ cluster.name }} ({{ cluster.nameAr }})</strong>
                  <span class="rf-sub">{{ cluster.activeCount }} en cours • {{ cluster.resolvedCount }} résolus</span>
                </div>
              </div>
              <button class="btn-mini-close" (click)="clearClusterFilter()" title="Voir toute la Tunisie">
                <span class="material-symbols-rounded">close</span>
              </button>
            </div>
          }

          @if (selectedItem(); as current) {
            <div class="detail-card glass-card animate-float">
              <div class="detail-header">
                <div>
                  <span class="detail-ref">{{ current.reference }}</span>
                  <h3 class="detail-addr">{{ current.address }}</h3>
                  <span class="detail-gov">{{ current.district }}, {{ current.governorate }}</span>
                </div>
                <span class="glass-badge" [ngClass]="current.status === 'RESOLU' ? 'badge-nature' : (current.status === 'EN_COURS' ? 'badge-sun' : 'badge-coral')">
                  {{ current.status === 'RESOLU' ? 'Rétabli' : (current.status === 'EN_COURS' ? 'En réparation' : 'Signalé') }}
                </span>
              </div>

              <div class="detail-body">
                <div class="d-item">
                  <span class="d-lbl">Abonnés touchés :</span>
                  <strong class="d-val text-coral">{{ current.affectedCustomers | number }}</strong>
                </div>
                <div class="d-item">
                  <span class="d-lbl">Type d'incident :</span>
                  <span class="d-val">{{ current.type }}</span>
                </div>
                <div class="d-item">
                  <span class="d-lbl">Heure de signalement :</span>
                  <span class="d-val">{{ current.reportedAt }}</span>
                </div>
                <div class="d-item">
                  <span class="d-lbl">Rétablissement estimé :</span>
                  <strong class="d-val highlight">{{ current.estimatedResolution }}</strong>
                </div>
                <div class="d-item">
                  <span class="d-lbl">Équipe technique STEG :</span>
                  <span class="d-val">{{ current.assignedTechnician || 'Équipe d\\'intervention rapide' }}</span>
                </div>
              </div>

              <p class="detail-notes">{{ current.notes }}</p>

              <div class="detail-actions">
                <button class="btn-secondary btn-full" (click)="selectedItem.set(null)">
                  Fermer la fiche
                </button>
              </div>
            </div>
          }

          <div class="cards-scroll-list">
            <div class="list-title-row">
              <span class="l-title">{{ selectedCluster() ? 'Incidents dans la zone sélectionnée' : 'Tous les Incidents Signalés' }}</span>
              <span class="l-count">{{ displayedOutages().length }} incidents</span>
            </div>

            @for (outage of displayedOutages(); track outage.id) {
              <div 
                class="outage-list-item glass-panel"
                [class.selected]="selectedItem()?.id === outage.id"
                (click)="selectedItem.set(outage)"
              >
                <div class="item-dot" [class.resolved]="outage.status === 'RESOLU'" [class.in-progress]="outage.status === 'EN_COURS'"></div>
                <div class="item-main">
                  <div class="item-top">
                    <span class="item-ref">{{ outage.reference }}</span>
                    <span class="item-gov">{{ outage.governorate }}</span>
                  </div>
                  <div class="item-address">{{ outage.address }}</div>
                  <div class="item-bottom">
                    <span class="item-affected">{{ outage.affectedCustomers | number }} abonnés</span>
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
      gap: 22px;
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
      gap: 8px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }

    .header-title {
      font-size: 26px;
      font-weight: 900;
      color: var(--text-main);
      margin-bottom: 6px;
    }

    .header-desc {
      font-size: 14.5px;
      color: var(--text-muted);
      max-width: 680px;
    }

    /* KPI Row */
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .kpi-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 20px;
      border-radius: var(--radius-lg);
    }

    .kpi-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-size: 22px;
      &.coral { background: var(--alert-coral); }
      &.nature { background: var(--nature-green); }
      &.sun { background: var(--sun-gold); }
      &.sky { background: var(--sky-blue); }
    }

    .kpi-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .kpi-val {
      font-size: 20px;
      font-weight: 900;
      color: var(--text-main);
    }

    .kpi-lbl {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
    }

    /* Layout */
    .outages-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 22px;
    }

    .map-view-column {
      width: 100%;
    }

    /* List Column */
    .list-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 680px;
    }

    .list-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 4px;
      .l-title { font-size: 13.5px; font-weight: 800; color: var(--text-main); }
      .l-count { font-size: 12px; color: var(--text-light); }
    }

    .detail-card {
      padding: 18px;
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
      font-size: 15px;
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
      gap: 5px;
      font-size: 12.5px;
    }

    .d-item {
      display: flex;
      justify-content: space-between;
      .d-lbl { color: var(--text-muted); }
      .d-val {
        color: var(--text-main);
        font-weight: 600;
        &.highlight { color: var(--sun-amber); font-weight: 800; }
      }
    }

    .detail-notes {
      font-size: 12px;
      color: var(--text-muted);
      background: rgba(255, 251, 242, 0.8);
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      border-left: 3px solid var(--sun-gold);
      line-height: 1.35;
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

      &.in-progress { background: var(--sun-gold); }
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

    .region-filter-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      background: rgba(255, 248, 235, 0.95);
      border: 1.5px solid var(--sun-gold);
      box-shadow: var(--shadow-sm);
      margin-bottom: 12px;

      .rf-info {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .rf-badge {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--sun-gold);
        color: #3d2b05;
        font-weight: 800;
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .rf-title {
        font-size: 13.5px;
        color: var(--text-main);
        display: block;
      }
      .rf-sub {
        font-size: 11px;
        color: var(--text-muted);
      }
      .btn-mini-close {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        padding: 4px;
        border-radius: 50%;
        &:hover {
          background: rgba(255, 107, 107, 0.15);
          color: var(--alert-coral);
        }
      }
    }

    @media (max-width: 992px) {
      .outages-layout { grid-template-columns: 1fr; }
      .list-column { max-height: 400px; }
    }
  `]
})
export class OutageMapComponent {
  outageService = inject(OutageService);
  eleService = inject(ElectricityService);
  weatherService = inject(WeatherService);

  selectedItem = signal<OutageReport | null>(null);
  selectedCluster = signal<RegionalOutageCluster | null>(null);

  onSelectFromMap(outage: OutageReport): void {
    this.selectedItem.set(outage);
  }

  onClusterSelected(cluster: RegionalOutageCluster): void {
    this.selectedCluster.set(cluster);
    this.selectedItem.set(null);
  }

  clearClusterFilter(): void {
    this.selectedCluster.set(null);
  }

  displayedOutages(): OutageReport[] {
    const cluster = this.selectedCluster();
    const all = this.outageService.outages();
    if (!cluster) return all;

    const query = cluster.name.toLowerCase();
    const filtered = all.filter(o => 
      query.includes(o.governorate.toLowerCase()) || 
      o.governorate.toLowerCase().includes(query) ||
      cluster.districts.some(d => o.district.toLowerCase().includes(d.toLowerCase()) || o.address.toLowerCase().includes(d.toLowerCase()))
    );

    return filtered.length > 0 ? filtered : all.slice(0, cluster.count);
  }
}
