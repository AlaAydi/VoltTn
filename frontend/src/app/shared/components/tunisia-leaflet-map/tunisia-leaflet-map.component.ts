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
  computed, 
  ChangeDetectionStrategy,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { OutageReport } from '../../../models/outage.model';

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

export const TUNISIA_INFRASTRUCTURES: GridInfrastructure[] = [
  { id: 'inf-01', name: 'Centrale Cycle Combiné Radès', type: 'CENTRALE_GAZ', capacityMw: 450, lat: 36.7997, lng: 10.2789, governorate: 'Ben Arous', status: 'OPTIMAL' },
  { id: 'inf-02', name: 'Centrale Électrique Ghannouch', type: 'CENTRALE_GAZ', capacityMw: 400, lat: 33.9312, lng: 10.0645, governorate: 'Gabès', status: 'OPTIMAL' },
  { id: 'inf-03', name: 'Centrale Thermique Sousse', type: 'CENTRALE_GAZ', capacityMw: 400, lat: 35.8123, lng: 10.6456, governorate: 'Sousse', status: 'OPTIMAL' },
  { id: 'inf-04', name: 'Centrale Solaire Photovoltaïque Tozeur', type: 'CENTRALE_SOLAIRE', capacityMw: 20, lat: 33.9197, lng: 8.1335, governorate: 'Tozeur', status: 'OPTIMAL' },
  { id: 'inf-05', name: 'Parc Éolien Sidi Daoud & Métline', type: 'EOLIEN', capacityMw: 54, lat: 37.0189, lng: 10.9012, governorate: 'Nabeul', status: 'OPTIMAL' },
  { id: 'inf-06', name: 'Poste Interconnexion Dispatching Mornaguia', type: 'POSTE_HT', capacityMw: 700, lat: 36.7512, lng: 10.0245, governorate: 'Manouba', status: 'OPTIMAL' },
  { id: 'inf-07', name: 'Poste Haute Tension Sfax-Sud 225 kV', type: 'POSTE_HT', capacityMw: 600, lat: 34.7212, lng: 10.7245, governorate: 'Sfax', status: 'OPTIMAL' }
];

@Component({
  selector: 'app-tunisia-leaflet-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="google-map-container" [class.is-fullscreen]="isFullscreen()">
      
      <!-- Barre d'outils Google Maps flottante : Recherche & Filtres -->
      <div class="map-top-bar glass-card animate-float">
        
        <div class="search-box">
          <span class="material-symbols-rounded search-icon">search</span>
          <input 
            type="text" 
            class="search-input" 
            placeholder="Rechercher une ville, rue ou incident (ex: Tunis, Sfax, INC-2025)..." 
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
            [class.active]="activeFilter() === 'ALL'" 
            (click)="setFilter('ALL')"
          >
            Tous ({{ outages.length }})
          </button>
          <button 
            class="pill coral" 
            [class.active]="activeFilter() === 'ACTIVE'" 
            (click)="setFilter('ACTIVE')"
          >
            <span class="dot-indicator bg-coral"></span>
            Coupures Actives ({{ countActive() }})
          </button>
          <button 
            class="pill sun" 
            [class.active]="activeFilter() === 'EN_COURS'" 
            (click)="setFilter('EN_COURS')"
          >
            <span class="dot-indicator bg-sun"></span>
            En Réparation
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
            Centrales & Réseau HT
          </button>
        </div>

      </div>

      <!-- Contrôles Google Maps style (Calques & Navigation) -->
      <div class="map-controls-group">
        
        <!-- Sélecteur de Calques Plan / Satellite / SCADA Nuit -->
        <div class="layer-selector glass-panel">
          <button 
            class="layer-btn" 
            [class.active]="currentLayer() === 'voyager'" 
            (click)="switchLayer('voyager')"
            title="Vue Plan Google Maps"
          >
            <span class="material-symbols-rounded">map</span>
            <span>Plan</span>
          </button>
          <button 
            class="layer-btn" 
            [class.active]="currentLayer() === 'satellite'" 
            (click)="switchLayer('satellite')"
            title="Vue Satellite"
          >
            <span class="material-symbols-rounded">satellite_alt</span>
            <span>Satellite</span>
          </button>
          <button 
            class="layer-btn" 
            [class.active]="currentLayer() === 'dark'" 
            (click)="switchLayer('dark')"
            title="Vue SCADA Nocturne"
          >
            <span class="material-symbols-rounded">dark_mode</span>
            <span>SCADA</span>
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
          <button class="ctrl-btn" (click)="recenterTunisia()" title="Recentrer sur la Tunisie">
            <span class="material-symbols-rounded">center_focus_strong</span>
          </button>
          <button class="ctrl-btn" (click)="locateUser()" title="Ma position en Tunisie">
            <span class="material-symbols-rounded">my_location</span>
          </button>
          <button class="ctrl-btn" (click)="toggleFullscreen()" title="Plein écran">
            <span class="material-symbols-rounded">{{ isFullscreen() ? 'fullscreen_exit' : 'fullscreen' }}</span>
          </button>
        </div>

      </div>

      <!-- Légende Google Maps en bas à gauche -->
      <div class="map-legend-card glass-panel">
        <div class="legend-title">Réseau Électrique Tunisie</div>
        <div class="legend-row">
          <span class="pin-symbol pin-coral"><span class="material-symbols-rounded">power_off</span></span>
          <span>Coupure critique</span>
        </div>
        <div class="legend-row">
          <span class="pin-symbol pin-sun"><span class="material-symbols-rounded">build</span></span>
          <span>Équipe en intervention</span>
        </div>
        <div class="legend-row">
          <span class="pin-symbol pin-nature"><span class="material-symbols-rounded">check</span></span>
          <span>Courant rétabli</span>
        </div>
        <div class="legend-row">
          <span class="pin-symbol pin-sky"><span class="material-symbols-rounded">bolt</span></span>
          <span>Centrale / Poste 225kV</span>
        </div>
      </div>

      <!-- Conteneur Carte Leaflet avec tuiles réelles -->
      <div #mapContainer class="leaflet-map-canvas"></div>

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
              <span class="lbl">Technicien</span>
              <span class="val">{{ item.assignedTechnician || 'Équipe de garde' }}</span>
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
      height: 580px;
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-lg);
      border: 1.5px solid var(--border-glass);
      background: #E8EEF5;

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

    /* Barre de recherche Google Maps */
    .map-top-bar {
      position: absolute;
      top: 18px;
      left: 18px;
      right: 18px;
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
      min-width: 240px;

      .search-icon { color: var(--sun-amber); font-size: 22px; }
      .search-input {
        border: none;
        outline: none;
        background: transparent;
        font-size: 14px;
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

    .pill {
      display: flex;
      align-items: center;
      gap: 6px;
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
      &.sun.active { background: var(--sun-gradient); }
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

    .icon-mini { font-size: 15px; }

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
      padding: 12px 16px;
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(12px);
      box-shadow: var(--shadow-md);
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 11.5px;
      font-weight: 700;
      color: var(--text-main);
    }

    .legend-title {
      font-size: 12px;
      font-weight: 800;
      color: var(--sun-amber);
      margin-bottom: 2px;
    }

    .legend-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .pin-symbol {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      .material-symbols-rounded { font-size: 13px; }
      &.pin-coral { background: var(--alert-coral); }
      &.pin-sun { background: var(--sun-gold); }
      &.pin-nature { background: var(--nature-green); }
      &.pin-sky { background: var(--sky-blue); }
    }

    /* Fiche Incident Google Maps Popup */
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
      .google-map-container { height: 460px; }
      .map-top-bar { padding: 8px 12px; }
      .map-controls-group { top: 120px; }
      .map-legend-card { display: none; }
      .incident-popup-card { width: calc(100% - 36px); bottom: 12px; right: 18px; }
    }
  `]
})
export class TunisiaLeafletMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() outages: OutageReport[] = [];
  @Input() interactivePicking = false; // Mode sélection de coordonnées (signalement)
  @Output() outageSelected = new EventEmitter<OutageReport>();
  @Output() coordinatePicked = new EventEmitter<{ lat: number; lng: number }>();

  @ViewChild('mapContainer', { static: true }) mapContainerRef!: ElementRef<HTMLDivElement>;

  selectedOutage = signal<OutageReport | null>(null);
  activeFilter = signal<'ALL' | 'ACTIVE' | 'EN_COURS' | 'RESOLU'>('ALL');
  currentLayer = signal<'voyager' | 'satellite' | 'dark'>('voyager');
  showInfrastructures = signal<boolean>(true);
  isFullscreen = signal<boolean>(false);
  searchQuery = '';

  private map!: L.Map;
  private markersLayer = L.layerGroup();
  private infraLayer = L.layerGroup();
  private baseTileLayer!: L.TileLayer;

  // Tuiles Google Maps-like
  private readonly TILES = {
    voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
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

  countActive(): number {
    return this.outages.filter(o => o.status !== 'RESOLU').length;
  }

  setFilter(filter: 'ALL' | 'ACTIVE' | 'EN_COURS' | 'RESOLU'): void {
    this.activeFilter.set(filter);
    this.renderMarkers();
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
      this.baseTileLayer.setUrl(this.TILES[layer]);
    }
  }

  zoomIn(): void {
    this.map.zoomIn();
  }

  zoomOut(): void {
    this.map.zoomOut();
  }

  recenterTunisia(): void {
    this.map.flyTo([34.5, 9.8], 7, { duration: 1.2 });
  }

  locateUser(): void {
    // Zoom direct sur Tunis avec animation fluide
    this.map.flyTo([36.8065, 10.1815], 13, { duration: 1.5 });
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
      this.renderMarkers();
      return;
    }

    const match = this.outages.find(o =>
      o.governorate.toLowerCase().includes(q) ||
      o.district.toLowerCase().includes(q) ||
      o.address.toLowerCase().includes(q) ||
      o.reference.toLowerCase().includes(q)
    );

    if (match) {
      this.flyToIncident(match);
      this.selectedOutage.set(match);
    }
    this.renderMarkers();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.renderMarkers();
  }

  flyToIncident(item: OutageReport): void {
    this.map.flyTo([item.lat, item.lng], 14, { duration: 1.2 });
    this.selectedOutage.set(item);
  }

  onInspectClick(item: OutageReport): void {
    this.outageSelected.emit(item);
  }

  private initLeafletMap(): void {
    const container = this.mapContainerRef.nativeElement;

    // Coordonnées géographiques de la Tunisie
    this.map = L.map(container, {
      center: [34.5, 9.8],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
      minZoom: 6,
      maxZoom: 18
    });

    // Tuile de base CartoDB Voyager (Google Maps aesthetic)
    this.baseTileLayer = L.tileLayer(this.TILES.voyager, {
      maxZoom: 19
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);
    this.infraLayer.addTo(this.map);

    this.renderMarkers();
    this.renderInfrastructures();

    if (this.interactivePicking) {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.coordinatePicked.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    // Gestion du redimensionnement
    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  }

  private renderMarkers(): void {
    this.markersLayer.clearLayers();
    const filter = this.activeFilter();
    const query = this.searchQuery.trim().toLowerCase();

    let list = this.outages;

    if (filter === 'ACTIVE') {
      list = list.filter(o => o.status !== 'RESOLU');
    } else if (filter === 'EN_COURS') {
      list = list.filter(o => o.status === 'EN_COURS');
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
        this.selectedOutage.set(outage);
        this.outageSelected.emit(outage);
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
