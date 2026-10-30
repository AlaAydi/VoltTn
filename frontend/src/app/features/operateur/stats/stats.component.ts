import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectricityService } from '../../../core/services/electricity.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EnergySankeyComponent } from '../../../shared/components/energy-sankey/energy-sankey.component';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, EnergySankeyComponent],
  template: `
    <div class="stats-page">
      
      <!-- En-tête Statistiques & Export -->
      <div class="stats-header glass-card">
        <div class="header-left">
          <div class="badge-row">
            <span class="glass-badge badge-sun">
              <span class="material-symbols-rounded">analytics</span>
              Rapports Officiels Dispatching STEG
            </span>
            <span class="glass-badge badge-nature">Données Certifiées</span>
          </div>
          <h1 class="header-title">Statistiques Régionales & Exports de Données</h1>
          <p class="header-desc">
            Exportez les séries temporelles de charge, les indicateurs de performance et les bilans par gouvernorat aux formats Excel (CSV), JSON et PDF d'impression.
          </p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="exportCSV()">
            <span class="material-symbols-rounded">table_view</span>
            <span>Télécharger Excel (CSV)</span>
          </button>
          <button class="btn-secondary" (click)="exportJSON()">
            <span class="material-symbols-rounded">data_object</span>
            <span>Télécharger JSON</span>
          </button>
          <button class="btn-sky" (click)="printReport()">
            <span class="material-symbols-rounded">print</span>
            <span>Imprimer / PDF</span>
          </button>
        </div>
      </div>

      <!-- Diagramme de Flux Énergétique National (Sankey ECharts) -->
      <app-energy-sankey></app-energy-sankey>

      <!-- Synthèse par région -->
      <div class="table-card glass-card">
        <div class="table-title-row">
          <h2 class="card-title">Bilan Énergétique des 24 Gouvernorats</h2>
          <span class="total-badge">Total Réseau : {{ eleService.totalCurrentLoadMw() | number }} MW / {{ eleService.totalCapacityMw() | number }} MW</span>
        </div>

        <div class="table-responsive">
          <table class="volttn-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Gouvernorat</th>
                <th>Capacité Max</th>
                <th>Charge Actuelle</th>
                <th>Charge Pic</th>
                <th>Rayonnement Solaire</th>
                <th>Température</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              @for (gov of eleService.governorates(); track gov.id) {
                <tr>
                  <td><strong>{{ gov.code }}</strong></td>
                  <td>{{ gov.name }} ({{ gov.nameAr }})</td>
                  <td>{{ gov.capacityMw }} MW</td>
                  <td><strong>{{ gov.currentLoadMw }} MW</strong></td>
                  <td>{{ gov.peakLoadMw }} MW</td>
                  <td>{{ gov.solarRadiationKwhM2 }} kWh/m²/j</td>
                  <td>{{ gov.temperatureC }} °C</td>
                  <td>
                    <span class="glass-badge" [ngClass]="'badge-' + (gov.status === 'SURCHARGE' ? 'coral' : (gov.status === 'ELEVEE' ? 'sun' : 'nature'))">
                      {{ gov.status }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .stats-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 50px;
    }

    .stats-header {
      padding: 26px 30px;
      border-radius: var(--radius-xl);
      display: flex;
      justify-content: space-between;
      align-items: center;
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
      font-size: 14.5px;
      color: var(--text-muted);
      max-width: 650px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .table-card {
      padding: 24px;
      border-radius: var(--radius-xl);
    }

    .table-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }

    .total-badge {
      font-family: var(--font-title);
      font-weight: 800;
      font-size: 14px;
      color: var(--sun-amber);
      background: var(--sun-light);
      padding: 6px 14px;
      border-radius: var(--radius-full);
    }

    .volttn-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;

      th {
        text-align: left;
        padding: 12px 14px;
        color: var(--text-muted);
        font-weight: 800;
        border-bottom: 2px solid rgba(29, 53, 87, 0.08);
      }

      td {
        padding: 12px 14px;
        color: var(--text-main);
        border-bottom: 1px solid rgba(29, 53, 87, 0.05);
      }
    }
  `]
})
export class StatsComponent {
  eleService = inject(ElectricityService);
  notifService = inject(NotificationService);

  exportCSV(): void {
    const govs = this.eleService.governorates();
    const headers = 'Code,Gouvernorat,NomArabe,CapacitéMW,ChargeActuelleMW,PicMW,TempératureC,Statut\n';
    const rows = govs.map(g =>
      `"${g.code}","${g.name}","${g.nameAr}",${g.capacityMw},${g.currentLoadMw},${g.peakLoadMw},${g.temperatureC},"${g.status}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `volttn-steg-reseau-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notifService.showToast('Export Réussi', 'Le fichier CSV a été téléchargé.', 'SUCCESS');
  }

  exportJSON(): void {
    const data = JSON.stringify(this.eleService.governorates(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `volttn-reseau-tunisie-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notifService.showToast('Export JSON Réussi', 'Fichier structuré téléchargé.', 'SUCCESS');
  }

  printReport(): void {
    window.print();
  }
}
