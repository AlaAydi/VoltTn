import { 
  Component, 
  ElementRef, 
  ViewChild, 
  OnInit, 
  OnDestroy, 
  signal, 
  inject, 
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as echarts from 'echarts';
import { ElectricityService } from '../../../core/services/electricity.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-energy-sankey',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sankey-card glass-card">
      
      <!-- En-tête du diagramme de flux -->
      <div class="sankey-header">
        <div class="header-info">
          <div class="badge-row">
            <span class="glass-badge badge-sun">
              <span class="material-symbols-rounded">account_tree</span>
              Diagramme de Sankey STEG
            </span>
            <span class="glass-badge badge-nature">Flux Énergétique National</span>
            <span class="glass-badge badge-sky">Équilibre Production ➔ Usages</span>
          </div>
          <h2 class="sankey-title">
            {{ i18n.currentLang() === 'ar' ? 'مخطط تدفق الطاقة الكهربائية في تونس' : 'Cartographie des Flux Énergétiques Nationaux' }}
          </h2>
          <p class="sankey-sub">
            {{ i18n.currentLang() === 'ar' 
              ? 'تتبع مسار الكهرباء من محطات التوليد (الغاز، الشمس، الرياح) عبر شبكة النقل والتوزيع وصولاً إلى الاستهلاك النهائي'
              : 'Traçabilité temps réel de l\\'électricité : de la production primaire aux postes de dispatching jusqu\\'aux usages résidentiels et industriels.'
            }}
          </p>
        </div>

        <!-- Filtres & Modes d'affichage -->
        <div class="sankey-actions">
          <div class="toggle-pill-group">
            <button 
              class="pill-btn" 
              [class.active]="viewMode() === 'MW'"
              (click)="setViewMode('MW')"
            >
              <span>Puissance Instantanée (MW)</span>
            </button>
            <button 
              class="pill-btn" 
              [class.active]="viewMode() === 'GWH'"
              (click)="setViewMode('GWH')"
            >
              <span>Volume Annuel (GWh)</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Métriques clés en ruban -->
      <div class="sankey-stats-row">
        <div class="mini-stat-item">
          <span class="stat-dot orange"></span>
          <span class="stat-lbl">Thermique Gaz STEG :</span>
          <strong class="stat-val">{{ formatValue(3240) }}</strong>
        </div>
        <div class="mini-stat-item">
          <span class="stat-dot gold"></span>
          <span class="stat-lbl">Énergie Solaire :</span>
          <strong class="stat-val">{{ formatValue(480) }}</strong>
        </div>
        <div class="mini-stat-item">
          <span class="stat-dot green"></span>
          <span class="stat-lbl">Parcs Éoliens :</span>
          <strong class="stat-val">{{ formatValue(290) }}</strong>
        </div>
        <div class="mini-stat-item">
          <span class="stat-dot blue"></span>
          <span class="stat-lbl">Interconnexion :</span>
          <strong class="stat-val">{{ formatValue(120) }}</strong>
        </div>
        <div class="mini-stat-item">
          <span class="stat-dot coral"></span>
          <span class="stat-lbl">Pertes Techniques :</span>
          <strong class="stat-val">{{ formatValue(270) }}</strong>
        </div>
      </div>

      <!-- Conteneur ECharts -->
      <div class="sankey-chart-wrapper">
        <div #chartContainer class="echarts-container"></div>
      </div>

      <!-- Légende et Note technique -->
      <div class="sankey-footer">
        <div class="legend-note">
          <span class="material-symbols-rounded info-icon">info</span>
          <span>
            Survolez chaque nœud ou flux pour inspecter le volume transmis et le pourcentage de contribution au réseau national.
          </span>
        </div>
        <div class="update-badge">
          <span class="pulse-dot"></span>
          <span>Données SCADA Dispatching STEG</span>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .sankey-card {
      padding: 26px 30px;
      border-radius: var(--radius-xl);
      background: var(--bg-card);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      box-shadow: var(--shadow-lg);
      border: 1px solid rgba(255, 255, 255, 0.85);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .sankey-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      flex-wrap: wrap;
    }

    .header-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-width: 720px;
    }

    .badge-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .sankey-title {
      font-size: 22px;
      font-weight: 900;
      color: var(--text-main);
      margin: 4px 0 0 0;
    }

    .sankey-sub {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.5;
      margin: 0;
    }

    .sankey-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .toggle-pill-group {
      display: flex;
      background: rgba(29, 53, 87, 0.06);
      padding: 4px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(29, 53, 87, 0.08);
    }

    .pill-btn {
      border: none;
      background: transparent;
      padding: 7px 16px;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        color: var(--text-main);
      }

      &.active {
        background: #FFFFFF;
        color: var(--sun-amber);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
    }

    .sankey-stats-row {
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
      padding: 12px 18px;
      border-radius: var(--radius-lg);
      background: rgba(255, 255, 255, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.8);
    }

    .mini-stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
    }

    .stat-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;

      &.orange { background: #FB8500; box-shadow: 0 0 6px rgba(251, 133, 0, 0.5); }
      &.gold { background: #FFB703; box-shadow: 0 0 6px rgba(255, 183, 3, 0.5); }
      &.green { background: #52B788; box-shadow: 0 0 6px rgba(82, 183, 136, 0.5); }
      &.blue { background: #4CC9F0; box-shadow: 0 0 6px rgba(76, 201, 240, 0.5); }
      &.coral { background: #FF6B6B; box-shadow: 0 0 6px rgba(255, 107, 107, 0.5); }
    }

    .stat-lbl {
      color: var(--text-muted);
      font-weight: 600;
    }

    .stat-val {
      color: var(--text-main);
      font-weight: 800;
    }

    .sankey-chart-wrapper {
      position: relative;
      width: 100%;
      height: 480px;
      background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 251, 242, 0.4) 100%);
      border-radius: var(--radius-lg);
      border: 1px solid rgba(29, 53, 87, 0.05);
      overflow: hidden;
    }

    .echarts-container {
      width: 100%;
      height: 100%;
    }

    .sankey-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      font-size: 12px;
      color: var(--text-muted);
      flex-wrap: wrap;
    }

    .legend-note {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;

      .info-icon {
        font-size: 16px;
        color: var(--sky-ocean);
      }
    }

    .update-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      color: var(--nature-green);
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--nature-green);
      box-shadow: 0 0 8px var(--nature-green);
      animation: pulseGreen 2s infinite ease-in-out;
    }

    @keyframes pulseGreen {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.6; }
    }

    @media (max-width: 900px) {
      .sankey-card { padding: 18px 16px; }
      .sankey-chart-wrapper { height: 420px; }
      .sankey-header { flex-direction: column; align-items: stretch; }
    }
  `]
})
export class EnergySankeyComponent implements OnInit, OnDestroy {
  eleService = inject(ElectricityService);
  i18n = inject(I18nService);

  @ViewChild('chartContainer', { static: true }) chartContainerRef!: ElementRef<HTMLDivElement>;

  viewMode = signal<'MW' | 'GWH'>('MW');
  private chartInstance: echarts.ECharts | null = null;
  private resizeObserver: ResizeObserver | null = null;

  ngOnInit(): void {
    // Petit délai pour laisser le conteneur calculer ses dimensions
    setTimeout(() => {
      this.initChart();
    }, 50);
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.chartInstance) {
      this.chartInstance.dispose();
      this.chartInstance = null;
    }
  }

  setViewMode(mode: 'MW' | 'GWH'): void {
    this.viewMode.set(mode);
    this.updateChartOptions();
  }

  formatValue(valMw: number): string {
    if (this.viewMode() === 'MW') {
      return `${valMw.toLocaleString('fr-FR')} MW`;
    }
    const gwh = Math.round(valMw * 8.76 * 0.45);
    return `${gwh.toLocaleString('fr-FR')} GWh/an`;
  }

  private initChart(): void {
    if (!this.chartContainerRef?.nativeElement) return;

    this.chartInstance = echarts.init(this.chartContainerRef.nativeElement, undefined, {
      renderer: 'canvas'
    });

    this.updateChartOptions();

    // Redimensionnement automatique réactif
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.chartInstance?.resize();
      });
      this.resizeObserver.observe(this.chartContainerRef.nativeElement);
    }
  }

  private updateChartOptions(): void {
    if (!this.chartInstance) return;

    const isMw = this.viewMode() === 'MW';
    const mult = isMw ? 1 : 3.94; // Conversion pour GWh

    // Nœuds du réseau électrique tunisien
    const data = [
      // 1. Production
      { name: 'Gaz Naturel STEG (78%)', itemStyle: { color: '#FB8500' }, depth: 0 },
      { name: 'Solaire PV (12%)', itemStyle: { color: '#FFB703' }, depth: 0 },
      { name: 'Éolien Sidi Daoud & Bizerte (7%)', itemStyle: { color: '#52B788' }, depth: 0 },
      { name: 'Interconnexion Internationale (3%)', itemStyle: { color: '#4CC9F0' }, depth: 0 },

      // 2. Dispatching & Transport
      { name: 'Dispatching Haute Tension 225 kV', itemStyle: { color: '#1D3557' }, depth: 1 },
      { name: 'Postes Sources Régionaux 30 kV', itemStyle: { color: '#2A9DF4' }, depth: 1 },
      { name: 'Micro-réseaux & Stockage Hybride', itemStyle: { color: '#9B5DE5' }, depth: 1 },

      // 3. Consommation finale
      { name: 'Ménages & Résidentiel (41%)', itemStyle: { color: '#2A9DF4' }, depth: 2 },
      { name: 'Industries Lourdes & Cimenteries (27%)', itemStyle: { color: '#FB8500' }, depth: 2 },
      { name: 'Tertiaire, Hôtellerie & Commerces (16%)', itemStyle: { color: '#FFB703' }, depth: 2 },
      { name: 'Agriculture & Pompage Hydraulique (10%)', itemStyle: { color: '#52B788' }, depth: 2 },
      { name: 'Pertes en Ligne & Effet Joule (6%)', itemStyle: { color: '#FF6B6B' }, depth: 2 }
    ];

    // Flux d'énergie reliant les nœuds
    const links = [
      // De la production vers Dispatching & Postes
      { source: 'Gaz Naturel STEG (78%)', target: 'Dispatching Haute Tension 225 kV', value: Math.round(2750 * mult) },
      { source: 'Gaz Naturel STEG (78%)', target: 'Postes Sources Régionaux 30 kV', value: Math.round(490 * mult) },
      { source: 'Solaire PV (12%)', target: 'Dispatching Haute Tension 225 kV', value: Math.round(340 * mult) },
      { source: 'Solaire PV (12%)', target: 'Micro-réseaux & Stockage Hybride', value: Math.round(140 * mult) },
      { source: 'Éolien Sidi Daoud & Bizerte (7%)', target: 'Dispatching Haute Tension 225 kV', value: Math.round(290 * mult) },
      { source: 'Interconnexion Internationale (3%)', target: 'Dispatching Haute Tension 225 kV', value: Math.round(120 * mult) },

      // Du Dispatching vers Usages & Postes
      { source: 'Dispatching Haute Tension 225 kV', target: 'Postes Sources Régionaux 30 kV', value: Math.round(850 * mult) },
      { source: 'Dispatching Haute Tension 225 kV', target: 'Industries Lourdes & Cimenteries (27%)', value: Math.round(920 * mult) },
      { source: 'Dispatching Haute Tension 225 kV', target: 'Ménages & Résidentiel (41%)', value: Math.round(1260 * mult) },
      { source: 'Dispatching Haute Tension 225 kV', target: 'Pertes en Ligne & Effet Joule (6%)', value: Math.round(170 * mult) },

      // Des Postes Sources Régionaux vers Usages Locaux
      { source: 'Postes Sources Régionaux 30 kV', target: 'Ménages & Résidentiel (41%)', value: Math.round(420 * mult) },
      { source: 'Postes Sources Régionaux 30 kV', target: 'Tertiaire, Hôtellerie & Commerces (16%)', value: Math.round(640 * mult) },
      { source: 'Postes Sources Régionaux 30 kV', target: 'Agriculture & Pompage Hydraulique (10%)', value: Math.round(380 * mult) },
      { source: 'Postes Sources Régionaux 30 kV', target: 'Industries Lourdes & Cimenteries (27%)', value: Math.round(200 * mult) },
      { source: 'Postes Sources Régionaux 30 kV', target: 'Pertes en Ligne & Effet Joule (6%)', value: Math.round(100 * mult) },

      // Du Stockage Hybride vers Secteurs Locaux
      { source: 'Micro-réseaux & Stockage Hybride', target: 'Agriculture & Pompage Hydraulique (10%)', value: Math.round(40 * mult) },
      { source: 'Micro-réseaux & Stockage Hybride', target: 'Ménages & Résidentiel (41%)', value: Math.round(100 * mult) }
    ];

    const unit = isMw ? 'MW' : 'GWh';

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: 'rgba(251, 133, 0, 0.4)',
        borderWidth: 1,
        textStyle: {
          color: '#1D3557',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 12,
          fontWeight: 600
        },
        padding: [10, 14],
        formatter: (params: any) => {
          if (params.dataType === 'edge') {
            return `
              <div style="font-weight: 800; color: #FB8500; margin-bottom: 4px;">Flux Électrique Transmis</div>
              <div>De : <strong>${params.data.source}</strong></div>
              <div>Vers : <strong>${params.data.target}</strong></div>
              <div style="margin-top: 6px; font-size: 14px; font-weight: 800; color: #1D3557;">
                ${params.data.value.toLocaleString('fr-FR')} ${unit}
              </div>
            `;
          }
          return `
            <div style="font-weight: 800; color: #1D3557; margin-bottom: 4px;">${params.name}</div>
            <div>Volume total : <strong>${params.value.toLocaleString('fr-FR')} ${unit}</strong></div>
          `;
        }
      },
      series: [
        {
          type: 'sankey',
          emphasis: {
            focus: 'adjacency'
          },
          nodeAlign: 'justify',
          nodeWidth: 22,
          nodeGap: 18,
          draggable: true,
          levels: [
            {
              depth: 0,
              itemStyle: {
                borderRadius: 4
              },
              lineStyle: {
                color: 'source',
                opacity: 0.35,
                curveness: 0.5
              }
            },
            {
              depth: 1,
              itemStyle: {
                borderRadius: 4
              },
              lineStyle: {
                color: 'source',
                opacity: 0.35,
                curveness: 0.5
              }
            },
            {
              depth: 2,
              itemStyle: {
                borderRadius: 4
              }
            }
          ],
          label: {
            color: '#1D3557',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            formatter: '{b}'
          },
          lineStyle: {
            color: 'gradient',
            curveness: 0.5,
            opacity: 0.38
          },
          data,
          links
        }
      ]
    };

    this.chartInstance.setOption(option, true);
  }
}

