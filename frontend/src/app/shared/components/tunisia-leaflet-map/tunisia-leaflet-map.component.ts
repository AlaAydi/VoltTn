import { 
  Component, 
  ElementRef, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit, 
  OnDestroy, 
  ViewChild, 
  signal, 
  ChangeDetectionStrategy,
  ViewEncapsulation,
  AfterViewInit,
  inject,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { OutageReport } from '../../../models/outage.model';
import { AuthService } from '../../../core/services/auth.service';

export interface GridInfrastructure {
  id: string;
  name: string;
  type: 'CENTRALE_SOLAIRE' | 'CENTRALE_GAZ' | 'POSTE_HT' | 'EOLIEN';
  capacityMw: number;
  lat: number;
  lng: number;
  governorate: string;
  status: 'OPTIMAL' | 'SURVEILLANCE';
}

export interface RegionalOutageCluster {
  id: string;
  name: string;
  nameAr: string;
  lat: number;
  lng: number;
  count: number;
  type: 'yellow' | 'green' | 'pin';
  activeCount: number;
  resolvedCount: number;
  districts: string[];
}

export const TUNISIA_INFRASTRUCTURES: GridInfrastructure[] = [
  { id: 'inf-01', name: 'Centrale Cycle Combiné Radès', type: 'CENTRALE_GAZ', capacityMw: 450, lat: 36.7997, lng: 10.2789, governorate: 'Ben Arous', status: 'OPTIMAL' },
  { id: 'inf-02', name: 'Centrale Électrique Ghannouch', type: 'CENTRALE_GAZ', capacityMw: 400, lat: 33.9312, lng: 10.0645, governorate: 'Gabès', status: 'OPTIMAL' },
  { id: 'inf-03', name: 'Centrale Thermique Sousse', type: 'CENTRALE_GAZ', capacityMw: 400, lat: 35.8123, lng: 10.6456, governorate: 'Sousse', status: 'OPTIMAL' },
  { id: 'inf-04', name: 'Centrale Solaire Photovoltaïque Tozeur', type: 'CENTRALE_SOLAIRE', capacityMw: 20, lat: 33.9197, lng: 8.1335, governorate: 'Tozeur', status: 'OPTIMAL' },
  { id: 'inf-05', name: 'Parc Éolien Sidi Daoud & Métline', type: 'EOLIEN', capacityMw: 54, lat: 37.0189, lng: 10.9012, governorate: 'Nabeul', status: 'OPTIMAL' },
  { id: 'inf-06', name: 'Poste Interconnexion Dispatching Mornaguia', type: 'POSTE_HT', capacityMw: 700, lat: 36.7512, lng: 10.0245, governorate: 'Manouba', status: 'OPTIMAL' },
  { id: 'inf-07', name: 'Poste Haute Tension Sfax-Sud 225 kV', type: 'POSTE_HT', capacityMw: 600, lat: 34.7212, lng: 10.7245, governorate: 'Sfax', status: 'OPTIMAL' }
];

// Clusters régionaux correspondant fidèlement à la carte de Tunisie fournie par l'utilisateur
export const TUNISIA_REGIONAL_CLUSTERS: RegionalOutageCluster[] = [
  { id: 'reg-tunis', name: 'Tunis & Grand Tunis', nameAr: 'تونس الكبرى', lat: 36.8065, lng: 10.1815, count: 20, type: 'yellow', activeCount: 14, resolvedCount: 6, districts: ['Mutuelleville', 'Ennasr 2', 'Menzah 6', 'La Goulette', 'Mégrine Riadh', 'Le Bardo'] },
  { id: 'reg-beja', name: 'Béja & Nord-Ouest', nameAr: 'باجة والشمال الغربي', lat: 36.7256, lng: 9.1817, count: 20, type: 'yellow', activeCount: 12, resolvedCount: 8, districts: ['Béja Ville', 'Medjez El Bab', 'Téboursouk', 'Tabarka', 'Jendouba'] },
  { id: 'reg-nabeul', name: 'Nabeul & Hammamet', nameAr: 'نابل والحمامات', lat: 36.4561, lng: 10.6500, count: 8, type: 'green', activeCount: 3, resolvedCount: 5, districts: ['Hammamet Nord', 'Nabeul Centre', 'Korba', 'Kélibia'] },
  { id: 'reg-sousse', name: 'Sousse', nameAr: 'سوسة', lat: 35.8256, lng: 10.6369, count: 5, type: 'green', activeCount: 2, resolvedCount: 3, districts: ['Khezama Est', 'Sahloul', 'Hammam Sousse', 'Port El Kantaoui'] },
  { id: 'reg-monastir', name: 'Monastir & Mahdia', nameAr: 'المنستير والمهدية', lat: 35.6000, lng: 10.8500, count: 8, type: 'green', activeCount: 4, resolvedCount: 4, districts: ['Monastir Skanes', 'Ksar Hellal', 'Mahdia Ville', 'El Jem'] },
  { id: 'reg-kairouan', name: 'Kairouan & Sidi Bouzid', nameAr: 'القيروان وسيدي بوزيد', lat: 35.3500, lng: 9.7500, count: 7, type: 'green', activeCount: 4, resolvedCount: 3, districts: ['Bab El Jalladine', 'Sbikha', 'Sidi Bouzid Centre', 'Regueb'] },
  { id: 'reg-sfax', name: 'Sfax', nameAr: 'صفاقس', lat: 34.7406, lng: 10.7603, count: 10, type: 'yellow', activeCount: 6, resolvedCount: 4, districts: ['Route de Téniour', 'Route de Gremda', 'Ceinture Bourguiba', 'Sfax Médina', 'Sakiet Ezzit'] },
  { id: 'reg-gafsa', name: 'Gafsa & Kasserine', nameAr: 'قفصة والقصرين', lat: 34.4250, lng: 8.7842, count: 6, type: 'green', activeCount: 2, resolvedCount: 4, districts: ['Gafsa Centre', 'Métlaoui', 'Kasserine Cité Ezzouhour', 'Sbeïtla'] },
  { id: 'reg-douz', name: 'Tozeur & Kébili (Douz)', nameAr: 'توزر وقبلي ودوز', lat: 33.5500, lng: 8.9500, count: 2, type: 'green', activeCount: 1, resolvedCount: 1, districts: ['Douz Centre', 'Kébili Nord', 'Tozeur Palmeraie'] },
  { id: 'reg-medenine', name: 'Médenine & Zarzis', nameAr: 'مدنين وجرجيس', lat: 33.3549, lng: 10.5055, count: 10, type: 'yellow', activeCount: 5, resolvedCount: 5, districts: ['Zarzis Ville', 'Médenine Sud', 'Djerba Houmt Souk', 'Ben Guerdane'] },
  { id: 'reg-tataouine', name: 'Tataouine & Remada', nameAr: 'تطاوين ورمادة', lat: 32.7500, lng: 10.3500, count: 1, type: 'pin', activeCount: 1, resolvedCount: 0, districts: ['Tataouine Centre', 'Ghomrassen', 'Remada'] }
];

@Component({
  selector: 'app-tunisia-leaflet-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="google-map-container" [class.is-fullscreen]="isFullscreen()">
      
      <!-- Bouton flottant "Mon Espace" (Conforme exactement à la capture d'écran) -->
      @if (showMonEspaceButton) {
        <a class="mon-espace-floating-btn" (click)="goToMySpace()" title="Accéder à Mon Espace VoltTN">
          <span class="btn-line-1">Mon</span>
          <span class="btn-line-2">Espace</span>
        </a>
      }

      <!-- Barre d'outils Google Maps flottante : Recherche & Filtres -->
      <div class="map-top-bar glass-card animate-float">
        
        <div class="search-box">
          <span class="material-symbols-rounded search-icon">search</span>
          <input 
            type="text" 
            class="search-input" 
            placeholder="Rechercher une ville, région ou gouvernorat (ex: Tunis, Sfax, Sousse, Béja)..." 
            [(ngModel)]="searchQuery" 
            (input)="onSearchChange()"
          />
          @if (searchQuery) {
            <button class="clear-btn" (click)="clearSearch()">
              <span class="material-symbols-rounded">close</span>
            </button>
          }
        </div>

        <!-- Filtres rapides sous forme de pilules -->
        <div class="filter-pills">
          <button 
            class="pill" 
            [class.active]="viewMode() === 'clusters'" 
            (click)="setViewMode('clusters')"
            title="Vue d'ensemble par région (Capture d'écran)"
          >
            <span class="material-symbols-rounded icon-mini">bubble_chart</span>
            Vue Régions
          </button>

          <button 
            class="pill" 
            [class.active]="viewMode() === 'incidents'" 
            (click)="setViewMode('incidents')"
            title="Vue détaillée au niveau des rues"
          >
            <span class="material-symbols-rounded icon-mini">pin_drop</span>
            Vue Rues
          </button>

          <div class="pill-divider"></div>

          <button 
            class="pill coral" 
            [class.active]="activeFilter() === 'ACTIVE'" 
            (click)="setFilter('ACTIVE')"
          >
            <span class="dot-indicator bg-coral"></span>
            Coupures Actives ({{ countActive() }})
          </button>
          
          <button 
            class="pill nature" 
            [class.active]="activeFilter() === 'RESOLU'" 
            (click)="setFilter('RESOLU')"
          >
            <span class="dot-indicator bg-nature"></span>
            Rétablis
          </button>

          <button 
            class="pill sky" 
            [class.active]="showInfrastructures()" 
            (click)="toggleInfrastructures()"
          >
            <span class="material-symbols-rounded icon-mini">bolt</span>
            Centrales STEG
          </button>
        </div>

      </div>

      <!-- Contrôles Google Maps style (Calques & Navigation) -->
      <div class="map-controls-group">
        
        <!-- Sélecteur de Calques Plan / Satellite / Topo -->
        <div class="layer-selector glass-panel">
          <button 
            class="layer-btn" 
            [class.active]="currentLayer() === 'voyager'" 
            (click)="switchLayer('voyager')"
            title="Carte Officielle Tunisie (OSM)"
          >
            <span class="material-symbols-rounded">map</span>
            <span>Plan</span>
          </button>
          <button 
            class="layer-btn" 
            [class.active]="currentLayer() === 'satellite'" 
            (click)="switchLayer('satellite')"
            title="Vue Satellite Haute Résolution"
          >
            <span class="material-symbols-rounded">satellite_alt</span>
            <span>Satellite</span>
          </button>
          <button 
            class="layer-btn" 
            [class.active]="currentLayer() === 'dark'" 
            (click)="switchLayer('dark')"
            title="Vue Relief & Topographie"
          >
            <span class="material-symbols-rounded">terrain</span>
            <span>Relief</span>
          </button>
        </div>

        <!-- Boutons Zoom & Actions rapides -->
        <div class="zoom-controls glass-panel">
          <button class="ctrl-btn" (click)="zoomIn()" title="Zoom avant">
            <span class="material-symbols-rounded">add</span>
          </button>
          <button class="ctrl-btn" (click)="zoomOut()" title="Zoom arrière">
            <span class="material-symbols-rounded">remove</span>
          </button>
          <div class="sep-line"></div>
          <button class="ctrl-btn" (click)="recenterTunisia()" title="Recentrer sur la Tunisie entière">
            <span class="material-symbols-rounded">center_focus_strong</span>
          </button>
          <button class="ctrl-btn" (click)="locateUser()" title="Zoomer sur Tunis">
            <span class="material-symbols-rounded">my_location</span>
          </button>
          <button class="ctrl-btn" (click)="toggleFullscreen()" title="Plein écran">
            <span class="material-symbols-rounded">{{ isFullscreen() ? 'fullscreen_exit' : 'fullscreen' }}</span>
          </button>
        </div>

      </div>

      <!-- Légende Google Maps en bas à gauche -->
      <div class="map-legend-card glass-panel">
        <div class="legend-title">Observatoire Réseau Tunisie</div>
        <div class="legend-row">
          <span class="cluster-legend-dot yellow">20</span>
          <span>Foyer de coupures élevé (&gt; 10)</span>
        </div>
        <div class="legend-row">
          <span class="cluster-legend-dot green">8</span>
          <span>Incidents modérés (1-9)</span>
        </div>
        <div class="legend-row">
          <span class="cluster-legend-pin teal"></span>
          <span>Intervention ponctuelle</span>
        </div>
      </div>

      <!-- Conteneur Carte Leaflet avec tuiles réelles -->
      <div #mapContainer class="leaflet-map-canvas"></div>

      <!-- Fiche d'information sur un cluster régional sélectionné -->
      @if (selectedCluster(); as cluster) {
        <div class="cluster-popup-card glass-card animate-float">
          <div class="cluster-popup-header">
            <div class="cluster-title-box">
              <span class="cluster-bubble-mini" [ngClass]="cluster.type">{{ cluster.count }}</span>
              <div>
                <h3 class="c-title">{{ cluster.name }}</h3>
                <span class="c-arabic">{{ cluster.nameAr }}</span>
              </div>
            </div>
            <button class="close-card-btn" (click)="selectedCluster.set(null)">
              <span class="material-symbols-rounded">close</span>
            </button>
          </div>

          <div class="cluster-stats-grid">
            <div class="cs-item">
              <span class="cs-lbl">Coupures en cours :</span>
              <strong class="cs-val text-coral">{{ cluster.activeCount }} pannes</strong>
            </div>
            <div class="cs-item">
              <span class="cs-lbl">Courant rétabli :</span>
              <strong class="cs-val text-nature">{{ cluster.resolvedCount }} résolus</strong>
            </div>
          </div>

          <div class="cluster-districts-list">
            <span class="cd-title">Secteurs & Quartiers concernés :</span>
            <div class="districts-tags">
              @for (d of cluster.districts; track d) {
                <span class="d-tag">{{ d }}</span>
              }
            </div>
          </div>

          <div class="cluster-actions">
            <button class="btn-primary" (click)="exploreCluster(cluster)">
              <span class="material-symbols-rounded">zoom_in</span>
              <span>Explorer les rues de cette zone</span>
            </button>
            <button class="btn-secondary" (click)="recenterTunisia()">
              <span class="material-symbols-rounded">restart_alt</span>
              <span>Vue Tunisie</span>
            </button>
          </div>
        </div>
      }

      <!-- Carte d'aperçu d'incident survolé ou sélectionné (Fiche Google Maps) -->
      @if (selectedOutage(); as item) {
        <div class="incident-popup-card glass-card animate-float">
          <div class="card-header">
            <div class="ref-badge-row">
              <span class="ref-text">{{ item.reference }}</span>
              <span class="badge" [ngClass]="item.status === 'RESOLU' ? 'badge-nature' : (item.status === 'EN_COURS' ? 'badge-sun' : 'badge-coral')">
                {{ item.status === 'RESOLU' ? 'Rétabli' : (item.status === 'EN_COURS' ? 'En cours' : 'Signalé') }}
              </span>
            </div>
            <button class="close-card-btn" (click)="selectedOutage.set(null)">
              <span class="material-symbols-rounded">close</span>
            </button>
          </div>

          <h3 class="incident-title">{{ item.address }}</h3>
          <p class="incident-loc">{{ item.district }}, <strong>{{ item.governorate }}</strong></p>

          <div class="incident-meta-grid">
            <div class="meta-item">
              <span class="lbl">Abonnés touchés</span>
              <strong class="val text-coral">{{ item.affectedCustomers | number }}</strong>
            </div>
            <div class="meta-item">
              <span class="lbl">Rétablissement estimé</span>
              <strong class="val highlight">{{ item.estimatedResolution }}</strong>
            </div>
            <div class="meta-item">
              <span class="lbl">Type de panne</span>
              <span class="val">{{ item.type }}</span>
            </div>
            <div class="meta-item">
              <span class="lbl">Technicien STEG</span>
              <span class="val">{{ item.assignedTechnician || 'Équipe de garde régionale' }}</span>
            </div>
          </div>

          <p class="incident-notes">{{ item.notes }}</p>

          <div class="card-action-buttons">
            <button class="btn-primary" (click)="flyToIncident(item)">
              <span class="material-symbols-rounded">near_me</span>
              <span>Itinéraire & Localiser</span>
            </button>
            <button class="btn-secondary" (click)="onInspectClick(item)">
              <span class="material-symbols-rounded">info</span>
              <span>Fiche Complète</span>
            </button>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .google-map-container {
      position: relative;
      width: 100%;
      height: 680px;
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-lg);
      border: 1.5px solid var(--border-glass);
      background: #73C2FB;

      &.is-fullscreen {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        z-index: 9999;
        border-radius: 0;
      }
    }

    .leaflet-map-canvas {
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    /* Bouton "Mon Espace" flottant (Conforme à la capture d'écran) */
    .mon-espace-floating-btn {
      position: absolute;
      top: 16px;
      right: 18px;
      z-index: 1002;
      background: linear-gradient(135deg, #A81D24 0%, #831117 100%);
      color: #FFFFFF !important;
      padding: 9px 18px;
      border-radius: 12px;
      box-shadow: 0 6px 18px rgba(168, 29, 36, 0.45), 0 2px 6px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      line-height: 1.15;
      text-decoration: none;
      cursor: pointer;
      border: 1.5px solid rgba(255, 255, 255, 0.35);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;

      .btn-line-1 {
        font-size: 13.5px;
        font-weight: 700;
        letter-spacing: 0.3px;
        color: #FFFFFF;
      }
      .btn-line-2 {
        font-size: 14.5px;
        font-weight: 900;
        letter-spacing: 0.5px;
        color: #FFFFFF;
      }

      &:hover {
        transform: translateY(-2px) scale(1.04);
        box-shadow: 0 8px 24px rgba(168, 29, 36, 0.55), 0 3px 8px rgba(0, 0, 0, 0.3);
        background: linear-gradient(135deg, #B91C24 0%, #90141A 100%);
      }
    }

    /* Barre de recherche Google Maps */
    .map-top-bar {
      position: absolute;
      top: 18px;
      left: 18px;
      right: 125px; /* Laisse l'espace pour le bouton Mon Espace */
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(16px);
      box-shadow: 0 8px 32px rgba(29, 53, 87, 0.12);
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 220px;

      .search-icon { color: var(--sun-amber); font-size: 22px; }
      .search-input {
        border: none;
        outline: none;
        background: transparent;
        font-size: 13.5px;
        font-weight: 600;
        color: var(--text-main);
        width: 100%;
        &::placeholder { color: var(--text-light); font-weight: 500; }
      }
      .clear-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-muted);
        display: flex;
        align-items: center;
      }
    }

    .filter-pills {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-x: auto;
      padding: 2px 0;
    }

    .pill-divider {
      width: 1px;
      height: 20px;
      background: rgba(29, 53, 87, 0.15);
      margin: 0 4px;
    }

    .pill {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(29, 53, 87, 0.08);
      background: rgba(255, 255, 255, 0.85);
      color: var(--text-main);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--transition-fast);

      &:hover {
        background: #FFFFFF;
        transform: translateY(-1px);
      }

      &.active {
        background: var(--text-main);
        color: #FFFFFF;
        border-color: transparent;
      }
      &.coral.active { background: linear-gradient(135deg, #FF6B6B 0%, #D90429 100%); }
      &.nature.active { background: var(--nature-gradient); }
      &.sky.active { background: var(--sky-gradient); }
    }

    .dot-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      &.bg-coral { background: var(--alert-coral); }
      &.bg-sun { background: var(--sun-gold); }
      &.bg-nature { background: var(--nature-green); }
    }

    .icon-mini { font-size: 16px; }

    /* Contrôles Google Maps */
    .map-controls-group {
      position: absolute;
      top: 86px;
      right: 18px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-end;
    }

    .layer-selector {
      display: flex;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(12px);
      border-radius: var(--radius-full);
      padding: 4px;
      box-shadow: var(--shadow-md);
      gap: 2px;
    }

    .layer-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: var(--radius-full);
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all var(--transition-fast);

      .material-symbols-rounded { font-size: 16px; }

      &:hover { color: var(--text-main); }
      &.active {
        background: var(--sun-gradient);
        color: #FFFFFF;
        box-shadow: 0 2px 8px rgba(255, 183, 3, 0.35);
      }
    }

    .zoom-controls {
      display: flex;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(12px);
      border-radius: var(--radius-md);
      padding: 4px;
      box-shadow: var(--shadow-md);
    }

    .ctrl-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: var(--text-main);
      cursor: pointer;
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);

      &:hover {
        background: rgba(255, 183, 3, 0.15);
        color: var(--sun-amber);
      }
    }

    .sep-line {
      height: 1px;
      background: rgba(29, 53, 87, 0.08);
      margin: 4px 6px;
    }

    /* Légende */
    .map-legend-card {
      position: absolute;
      bottom: 20px;
      left: 18px;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(10px);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      box-shadow: var(--shadow-md);
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 11.5px;
      color: var(--text-main);
      font-weight: 600;
    }

    .legend-title {
      font-size: 12px;
      font-weight: 800;
      color: var(--text-muted);
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .legend-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cluster-legend-dot {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11.5px;
      font-weight: 800;
      &.yellow { background: rgba(246, 201, 74, 0.95); border: 2px solid #d49817; color: #3b2802; }
      &.green { background: rgba(138, 224, 126, 0.95); border: 2px solid #439e36; color: #123b0f; }
    }

    .cluster-legend-pin {
      width: 14px;
      height: 18px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      background: #007A87;
      border: 1.5px solid #FFFFFF;
    }

    /* Badges Circulaires Tunisie (Fidèles à la capture d'écran) */
    .custom-cluster-badge-icon,
    .leaflet-custom-cluster {
      background: transparent !important;
      border: none !important;
      width: 48px !important;
      height: 48px !important;
      min-width: 48px !important;
      min-height: 48px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      overflow: visible !important;
    }

    .cluster-circle-yellow,
    .cluster-badge-yellow {
      width: 46px !important;
      min-width: 46px !important;
      max-width: 46px !important;
      height: 46px !important;
      min-height: 46px !important;
      max-height: 46px !important;
      border-radius: 50% !important;
      background: rgba(246, 201, 74, 0.88) !important;
      border: 2.5px solid #d49817 !important;
      box-shadow: 0 0 16px rgba(246, 201, 74, 0.65), 0 3px 8px rgba(0, 0, 0, 0.22) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
      font-family: 'Inter', 'Nunito', sans-serif !important;
      font-size: 16px !important;
      font-weight: 800 !important;
      color: #3b2802 !important;
      cursor: pointer !important;
      user-select: none !important;
      box-sizing: border-box !important;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease !important;

      &:hover {
        transform: scale(1.18) !important;
        background: rgba(246, 201, 74, 0.98) !important;
        box-shadow: 0 0 22px rgba(246, 201, 74, 0.85), 0 5px 12px rgba(0, 0, 0, 0.3) !important;
      }
    }

    .cluster-circle-green,
    .cluster-badge-green {
      width: 46px !important;
      min-width: 46px !important;
      max-width: 46px !important;
      height: 46px !important;
      min-height: 46px !important;
      max-height: 46px !important;
      border-radius: 50% !important;
      background: rgba(138, 224, 126, 0.88) !important;
      border: 2.5px solid #439e36 !important;
      box-shadow: 0 0 16px rgba(138, 224, 126, 0.65), 0 3px 8px rgba(0, 0, 0, 0.22) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
      font-family: 'Inter', 'Nunito', sans-serif !important;
      font-size: 16px !important;
      font-weight: 800 !important;
      color: #123b0f !important;
      cursor: pointer !important;
      user-select: none !important;
      box-sizing: border-box !important;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease !important;

      &:hover {
        transform: scale(1.18) !important;
        background: rgba(138, 224, 126, 0.98) !important;
        box-shadow: 0 0 22px rgba(138, 224, 126, 0.85), 0 5px 12px rgba(0, 0, 0, 0.3) !important;
      }
    }

    .cluster-pin-teal,
    .cluster-badge-teal-pin {
      width: 36px !important;
      min-width: 36px !important;
      height: 46px !important;
      min-height: 46px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
      cursor: pointer !important;
      filter: drop-shadow(0 4px 10px rgba(0, 122, 135, 0.45)) !important;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;

      &:hover {
        transform: scale(1.2) translateY(-4px) !important;
      }
    }

    /* Fiche Cluster Régional */
    .cluster-popup-card {
      position: absolute;
      bottom: 20px;
      right: 18px;
      width: 380px;
      max-width: calc(100% - 36px);
      z-index: 1000;
      padding: 20px;
      border-radius: var(--radius-lg);
      background: rgba(255, 255, 255, 0.98);
      border: 1.5px solid var(--sun-gold);
      box-shadow: 0 16px 36px rgba(29, 53, 87, 0.16);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .cluster-popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cluster-title-box {
      display: flex;
      align-items: center;
      gap: 12px;
      .c-title { font-size: 17px; font-weight: 900; color: var(--text-main); margin: 0; line-height: 1.2; }
      .c-arabic { font-size: 13.5px; font-weight: 700; color: var(--sun-amber); font-family: var(--font-arabic); }
    }

    .cluster-bubble-mini {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      font-weight: 900;
      &.yellow { background: #FFD166; border: 2px solid #E09F3E; color: #2B1D00; }
      &.green { background: #80ED99; border: 2px solid #38B000; color: #003B00; }
      &.pin { background: #0284C7; color: #FFFFFF; }
    }

    .cluster-stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      background: rgba(255, 251, 242, 0.85);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      .cs-item {
        display: flex;
        flex-direction: column;
        .cs-lbl { font-size: 11px; color: var(--text-muted); font-weight: 600; }
        .cs-val { font-size: 14px; font-weight: 800; }
      }
    }

    .cluster-districts-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      .cd-title { font-size: 11.5px; font-weight: 700; color: var(--text-muted); }
      .districts-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .d-tag {
        font-size: 11px;
        font-weight: 600;
        padding: 4px 8px;
        background: rgba(29, 53, 87, 0.05);
        border-radius: var(--radius-xs);
        color: var(--text-main);
      }
    }

    .cluster-actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;
      button { flex: 1; padding: 9px 12px; font-size: 12.5px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
    }

    /* Fiche Incident Détaillé */
    .incident-popup-card {
      position: absolute;
      bottom: 20px;
      right: 18px;
      width: 360px;
      max-width: calc(100% - 36px);
      z-index: 1000;
      padding: 18px;
      border-radius: var(--radius-lg);
      background: rgba(255, 255, 255, 0.98);
      border: 1.5px solid var(--sun-gold);
      box-shadow: 0 16px 36px rgba(29, 53, 87, 0.16);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .ref-badge-row {
      display: flex;
      align-items: center;
      gap: 8px;
      .ref-text { font-size: 12px; font-weight: 800; color: var(--sun-amber); }
    }

    .close-card-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-light);
      display: flex;
      align-items: center;
      &:hover { color: var(--alert-coral); }
    }

    .incident-title {
      font-size: 15px;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.25;
    }

    .incident-loc {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: -4px;
    }

    .incident-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      background: rgba(255, 251, 242, 0.8);
      padding: 10px;
      border-radius: var(--radius-sm);
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      font-size: 11.5px;
      .lbl { color: var(--text-muted); font-size: 10.5px; }
      .val {
        color: var(--text-main);
        font-weight: 700;
        &.highlight { color: var(--sun-amber); }
      }
    }

    .incident-notes {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.35;
    }

    .card-action-buttons {
      display: flex;
      gap: 8px;
      margin-top: 4px;
      button { flex: 1; padding: 8px 12px; font-size: 12px; }
    }

    @media (max-width: 768px) {
      .google-map-container { height: 500px; }
      .map-top-bar { right: 18px; top: 72px; padding: 8px 12px; }
      .mon-espace-floating-btn { top: 12px; right: 18px; }
      .map-controls-group { top: 160px; }
      .map-legend-card { display: none; }
      .cluster-popup-card, .incident-popup-card { width: calc(100% - 36px); bottom: 12px; right: 18px; }
    }
  `]
})
export class TunisiaLeafletMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() outages: OutageReport[] = [];
  @Input() interactivePicking = false;
  @Input() showMonEspaceButton = true;
  @Output() outageSelected = new EventEmitter<OutageReport>();
  @Output() clusterSelected = new EventEmitter<RegionalOutageCluster>();
  @Output() coordinatePicked = new EventEmitter<{ lat: number; lng: number }>();

  @ViewChild('mapContainer', { static: true }) mapContainerRef!: ElementRef<HTMLDivElement>;

  private router = inject(Router);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  selectedOutage = signal<OutageReport | null>(null);
  selectedCluster = signal<RegionalOutageCluster | null>(null);
  activeFilter = signal<'ALL' | 'ACTIVE' | 'RESOLU'>('ALL');
  viewMode = signal<'clusters' | 'incidents'>('clusters');
  currentLayer = signal<'voyager' | 'satellite' | 'dark'>('voyager');
  showInfrastructures = signal<boolean>(false);
  isFullscreen = signal<boolean>(false);
  searchQuery = '';

  private map!: L.Map;
  private clustersLayer = L.layerGroup();
  private markersLayer = L.layerGroup();
  private infraLayer = L.layerGroup();
  private baseTileLayer!: L.TileLayer;

  private readonly TILES = {
    voyager: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
  };

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initLeafletMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  goToMySpace(): void {
    const user = this.authService.currentUser();
    if (user) {
      switch (user.role) {
        case 'CITOYEN':
          this.router.navigate(['/citoyen/dashboard']);
          break;
        case 'OPERATEUR':
          this.router.navigate(['/operateur/dashboard']);
          break;
        case 'TECHNICIEN':
          this.router.navigate(['/technicien/interventions']);
          break;
        case 'ADMIN':
          this.router.navigate(['/admin/users']);
          break;
        default:
          this.router.navigate(['/']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  countActive(): number {
    return this.outages.filter(o => o.status !== 'RESOLU').length;
  }

  setViewMode(mode: 'clusters' | 'incidents'): void {
    this.viewMode.set(mode);
    this.refreshDisplay();
  }

  setFilter(filter: 'ALL' | 'ACTIVE' | 'RESOLU'): void {
    this.activeFilter.set(filter);
    this.refreshDisplay();
  }

  toggleInfrastructures(): void {
    this.showInfrastructures.update(v => !v);
    if (this.showInfrastructures()) {
      this.infraLayer.addTo(this.map);
    } else {
      this.infraLayer.remove();
    }
  }

  switchLayer(layer: 'voyager' | 'satellite' | 'dark'): void {
    this.currentLayer.set(layer);
    if (this.baseTileLayer) {
      if (layer === 'voyager') {
        this.baseTileLayer.setUrl(this.TILES.voyager);
      } else {
        this.baseTileLayer.setUrl(this.TILES[layer]);
      }
    }
  }

  zoomIn(): void {
    this.map.zoomIn();
  }

  zoomOut(): void {
    this.map.zoomOut();
  }

  recenterTunisia(): void {
    this.selectedCluster.set(null);
    this.selectedOutage.set(null);
    this.viewMode.set('clusters');
    this.fitWholeTunisia();
    this.refreshDisplay();
  }

  locateUser(): void {
    this.viewMode.set('incidents');
    this.map.flyTo([36.8065, 10.1815], 13, { duration: 1.5 });
    this.refreshDisplay();
  }

  exploreCluster(cluster: RegionalOutageCluster): void {
    this.map.flyTo([cluster.lat, cluster.lng], 12, { duration: 1.2 });
    this.viewMode.set('incidents');
    this.selectedCluster.set(cluster);
    this.clusterSelected.emit(cluster);
    this.refreshDisplay();
  }

  toggleFullscreen(): void {
    this.isFullscreen.update(v => !v);
    setTimeout(() => {
      this.map.invalidateSize();
    }, 250);
  }

  onSearchChange(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.refreshDisplay();
      return;
    }

    const clusterMatch = TUNISIA_REGIONAL_CLUSTERS.find(c =>
      c.name.toLowerCase().includes(q) ||
      c.nameAr.includes(q) ||
      c.districts.some(d => d.toLowerCase().includes(q))
    );

    if (clusterMatch) {
      this.exploreCluster(clusterMatch);
      return;
    }

    const outageMatch = this.outages.find(o =>
      o.governorate.toLowerCase().includes(q) ||
      o.district.toLowerCase().includes(q) ||
      o.address.toLowerCase().includes(q) ||
      o.reference.toLowerCase().includes(q)
    );

    if (outageMatch) {
      this.flyToIncident(outageMatch);
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.refreshDisplay();
  }

  flyToIncident(item: OutageReport): void {
    this.map.flyTo([item.lat, item.lng], 14, { duration: 1.2 });
    this.selectedOutage.set(item);
  }

  onInspectClick(item: OutageReport): void {
    this.outageSelected.emit(item);
  }

  fitWholeTunisia(): void {
    if (!this.map) return;
    this.map.fitBounds([
      [30.2, 7.5],
      [37.4, 11.8]
    ], {
      paddingTopLeft: [75, 20],
      paddingBottomRight: [20, 20]
    });
  }

  private initLeafletMap(): void {
    const container = this.mapContainerRef.nativeElement;

    // Centrage initial couvrant la Tunisie
    this.map = L.map(container, {
      center: [34.0, 9.5],
      zoom: 6.5,
      zoomControl: false,
      attributionControl: false,
      minZoom: 5.5,
      maxZoom: 18,
      maxBounds: [
        [29.0, 6.0],
        [38.5, 13.5]
      ]
    });

    // Tuile OpenStreetMap France (labels bilingues exacts Tunisie/Arabe/Français de la capture d'écran)
    this.baseTileLayer = L.tileLayer(this.TILES.voyager, {
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19
    }).addTo(this.map);

    this.clustersLayer.addTo(this.map);
    this.markersLayer.addTo(this.map);

    this.fitWholeTunisia();

    // Écouter le zoom de l'utilisateur pour adapter l'affichage
    this.map.on('zoomend', () => {
      this.ngZone.run(() => {
        const currentZoom = this.map.getZoom();
        if (currentZoom >= 10 && this.viewMode() === 'clusters') {
          this.viewMode.set('incidents');
          this.refreshDisplay();
          this.cdr.markForCheck();
        } else if (currentZoom < 9 && this.viewMode() === 'incidents') {
          this.viewMode.set('clusters');
          this.refreshDisplay();
          this.cdr.markForCheck();
        }
      });
    });

    this.refreshDisplay();
    this.renderInfrastructures();

    if (this.interactivePicking) {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.ngZone.run(() => {
          this.coordinatePicked.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
          this.cdr.markForCheck();
        });
      });
    }

    setTimeout(() => {
      this.map.invalidateSize();
      this.fitWholeTunisia();
    }, 250);
  }

  private refreshDisplay(): void {
    if (this.viewMode() === 'clusters') {
      this.markersLayer.clearLayers();
      this.renderClusters();
    } else {
      this.clustersLayer.clearLayers();
      this.renderMarkers();
    }
  }

  // Rendu des badges clusters circulaires (20, 8, 5, etc.) identiques à la capture d'écran
  private renderClusters(): void {
    this.clustersLayer.clearLayers();

    TUNISIA_REGIONAL_CLUSTERS.forEach(cluster => {
      let icon: L.DivIcon;

      if (cluster.type === 'pin') {
        // Pin bleu/turquoise à Tataouine / Remada
        const html = `
          <div class="cluster-pin-teal" title="${cluster.name} (${cluster.nameAr})">
            <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 0C7.61 0 0 7.61 0 17C0 29.75 17 44 17 44C17 44 34 29.75 34 17C34 7.61 26.39 0 17 0Z" fill="#007A87"/>
              <circle cx="17" cy="17" r="6" fill="#FFFFFF"/>
            </svg>
          </div>
        `;
        icon = L.divIcon({
          className: 'custom-cluster-badge-icon',
          html,
          iconSize: [36, 46],
          iconAnchor: [18, 44]
        });
      } else {
        const circleClass = cluster.type === 'yellow' ? 'cluster-circle-yellow' : 'cluster-circle-green';
        const html = `
          <div class="${circleClass}" title="${cluster.name} (${cluster.nameAr}) : ${cluster.count} incidents">
            <span>${cluster.count}</span>
          </div>
        `;
        icon = L.divIcon({
          className: 'custom-cluster-badge-icon',
          html,
          iconSize: [46, 46],
          iconAnchor: [23, 23]
        });
      }

      const marker = L.marker([cluster.lat, cluster.lng], { icon });

      marker.on('click', () => {
        this.ngZone.run(() => {
          this.selectedCluster.set(cluster);
          this.clusterSelected.emit(cluster);
          this.cdr.markForCheck();
        });
      });

      this.clustersLayer.addLayer(marker);
    });
  }

  private renderMarkers(): void {
    this.markersLayer.clearLayers();
    const filter = this.activeFilter();
    const query = this.searchQuery.trim().toLowerCase();

    let list = this.outages;

    if (filter === 'ACTIVE') {
      list = list.filter(o => o.status !== 'RESOLU');
    } else if (filter === 'RESOLU') {
      list = list.filter(o => o.status === 'RESOLU');
    }

    if (query) {
      list = list.filter(o =>
        o.governorate.toLowerCase().includes(query) ||
        o.district.toLowerCase().includes(query) ||
        o.address.toLowerCase().includes(query) ||
        o.reference.toLowerCase().includes(query)
      );
    }

    list.forEach(outage => {
      const icon = this.createGoogleMapsMarkerIcon(outage);
      const marker = L.marker([outage.lat, outage.lng], { icon });

      marker.on('click', () => {
        this.ngZone.run(() => {
          this.selectedOutage.set(outage);
          this.outageSelected.emit(outage);
          this.cdr.markForCheck();
        });
      });

      this.markersLayer.addLayer(marker);
    });
  }

  private renderInfrastructures(): void {
    this.infraLayer.clearLayers();

    TUNISIA_INFRASTRUCTURES.forEach(infra => {
      const html = `
        <div class="google-pin-infra">
          <div class="infra-dot">
            <span class="material-symbols-rounded">bolt</span>
          </div>
          <span class="infra-name">${infra.name.split(' ')[0]} ${infra.capacityMw}MW</span>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-infra-pin',
        html,
        iconSize: [80, 36],
        iconAnchor: [40, 18]
      });

      const marker = L.marker([infra.lat, infra.lng], { icon });
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
          <strong style="color: #1D3557; font-size: 14px;">${infra.name}</strong><br>
          <span style="color: #FB8500; font-weight: bold;">Capacité : ${infra.capacityMw} MW</span><br>
          <span style="color: #5C708A;">Gouvernorat : ${infra.governorate}</span><br>
          <span style="color: #52B788; font-weight: 600;">Statut : ${infra.status}</span>
        </div>
      `);

      this.infraLayer.addLayer(marker);
    });
  }

  private createGoogleMapsMarkerIcon(outage: OutageReport): L.DivIcon {
    let pinClass = 'pin-coral-pulse';
    let iconSymbol = 'power_off';

    if (outage.status === 'EN_COURS') {
      pinClass = 'pin-sun-pulse';
      iconSymbol = 'build';
    } else if (outage.status === 'RESOLU') {
      pinClass = 'pin-nature-pulse';
      iconSymbol = 'check';
    }

    const html = `
      <div class="google-maps-pin ${pinClass}">
        <div class="pin-head">
          <span class="material-symbols-rounded pin-icon">${iconSymbol}</span>
        </div>
        <div class="pin-tip"></div>
        <div class="pin-pulse"></div>
        <div class="pin-label">${outage.governorate}</div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-google-pin',
      html,
      iconSize: [40, 48],
      iconAnchor: [20, 44]
    });
  }
}
