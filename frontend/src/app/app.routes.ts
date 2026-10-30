import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/public/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/public/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/public/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'outages',
    loadComponent: () => import('./features/public/outage-map/outage-map.component').then(m => m.OutageMapComponent)
  },
  {
    path: 'solar',
    loadComponent: () => import('./features/public/solar-simulator/solar-simulator.component').then(m => m.SolarSimulatorComponent)
  },

  {
    path: 'citoyen/dashboard',
    canActivate: [authGuard, roleGuard(['CITOYEN', 'ADMIN'])],
    loadComponent: () => import('./features/citoyen/dashboard/dashboard.component').then(m => m.CitoyenDashboardComponent)
  },
  {
    path: 'citoyen/consumption',
    canActivate: [authGuard, roleGuard(['CITOYEN', 'ADMIN'])],
    loadComponent: () => import('./features/citoyen/consumption/consumption.component').then(m => m.ConsumptionComponent)
  },
  {
    path: 'citoyen/report-outage',
    canActivate: [authGuard, roleGuard(['CITOYEN', 'ADMIN'])],
    loadComponent: () => import('./features/citoyen/report-outage/report-outage.component').then(m => m.ReportOutageComponent)
  },
  {
    path: 'citoyen/billing',
    canActivate: [authGuard, roleGuard(['CITOYEN', 'ADMIN'])],
    loadComponent: () => import('./features/citoyen/smart-billing/smart-billing.component').then(m => m.SmartBillingComponent)
  },
  {
    path: 'citoyen/coach',
    canActivate: [authGuard, roleGuard(['CITOYEN', 'ADMIN'])],
    loadComponent: () => import('./features/citoyen/eco-coach/eco-coach.component').then(m => m.EcoCoachComponent)
  },
  {
    path: 'citoyen/tips',
    canActivate: [authGuard, roleGuard(['CITOYEN', 'ADMIN'])],
    loadComponent: () => import('./features/citoyen/tips/tips.component').then(m => m.TipsComponent)
  },

  {
    path: 'operateur',
    redirectTo: 'operateur/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'operateur/dashboard',
    canActivate: [authGuard, roleGuard(['OPERATEUR', 'ADMIN'])],
    loadComponent: () => import('./features/operateur/dashboard/dashboard.component').then(m => m.OperateurDashboardComponent)
  },
  {
    path: 'operateur/load-forecast',
    canActivate: [authGuard, roleGuard(['OPERATEUR', 'ADMIN'])],
    loadComponent: () => import('./features/operateur/dashboard/dashboard.component').then(m => m.OperateurDashboardComponent)
  },
  {
    path: 'operateur/outages',
    canActivate: [authGuard, roleGuard(['OPERATEUR', 'ADMIN'])],
    loadComponent: () => import('./features/operateur/dashboard/dashboard.component').then(m => m.OperateurDashboardComponent)
  },
  {
    path: 'operateur/maintenance',
    canActivate: [authGuard, roleGuard(['OPERATEUR', 'ADMIN'])],
    loadComponent: () => import('./features/operateur/dashboard/dashboard.component').then(m => m.OperateurDashboardComponent)
  },
  {
    path: 'operateur/scheduler',
    canActivate: [authGuard, roleGuard(['OPERATEUR', 'ADMIN'])],
    loadComponent: () => import('./features/operateur/dashboard/dashboard.component').then(m => m.OperateurDashboardComponent)
  },
  {
    path: 'operateur/sankey',
    canActivate: [authGuard, roleGuard(['OPERATEUR', 'ADMIN'])],
    loadComponent: () => import('./features/operateur/dashboard/dashboard.component').then(m => m.OperateurDashboardComponent)
  },
  {
    path: 'operateur/fraud',
    canActivate: [authGuard, roleGuard(['OPERATEUR', 'ADMIN'])],
    loadComponent: () => import('./features/operateur/fraud/fraud.component').then(m => m.FraudComponent)
  },
  {
    path: 'operateur/stats',
    canActivate: [authGuard, roleGuard(['OPERATEUR', 'ADMIN'])],
    loadComponent: () => import('./features/operateur/stats/stats.component').then(m => m.StatsComponent)
  },

  {
    path: 'technicien',
    redirectTo: 'technicien/interventions',
    pathMatch: 'full'
  },
  {
    path: 'technicien/interventions',
    canActivate: [authGuard, roleGuard(['TECHNICIEN', 'ADMIN'])],
    loadComponent: () => import('./features/technicien/interventions/interventions.component').then(m => m.TechnicienInterventionsComponent)
  },

  {
    path: 'admin',
    redirectTo: 'admin/users',
    pathMatch: 'full'
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'admin/thresholds',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'admin/ml-models',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'admin/data',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'admin/audit',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'admin/demo-generator',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent)
  },

  {
    path: '**',
    redirectTo: ''
  }
];
