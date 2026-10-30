import { Component, inject, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Hero3dComponent } from '../../../shared/components/hero-3d/hero-3d.component';
import { AuthService } from '../../../core/services/auth.service';
import { ElectricityService } from '../../../core/services/electricity.service';
import { OutageService } from '../../../core/services/outage.service';
import { Tilt3dDirective } from '../../../shared/directives/tilt-3d.directive';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { gsap } from 'gsap';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, Hero3dComponent, Tilt3dDirective, TranslatePipe],
  template: `
    <div class="home-page">
      
      <section class="hero-section glass-card">
        
        @defer (on viewport) {
          <app-hero-3d #hero3d></app-hero-3d>
        } @placeholder {
          <div class="hero-3d-placeholder"></div>
        }

        <div class="hero-content animate-float">
          <div class="hero-badge-pill">
            <span class="pulse-sun"></span>
            <span>{{ 'hero.badge' | trans }}</span>
          </div>

          <h1 class="hero-title">
            {{ 'hero.title_1' | trans }}<br />
            <span class="gradient-text">{{ 'hero.title_2' | trans }}</span>
          </h1>

          <p class="hero-subtitle">
            {{ 'hero.subtitle' | trans }}
          </p>

          <div class="hero-cta-group">
            <button class="btn-primary btn-hero" (click)="authService.loginAsDemoAccount('CITOYEN')">
              <span class="material-symbols-rounded">speed</span>
              <span>Tester Espace Citoyen (Compteur 3D)</span>
            </button>
            <button class="btn-secondary btn-hero" (click)="authService.loginAsDemoAccount('OPERATEUR')">
              <span class="material-symbols-rounded">map</span>
              <span>Console Opérateur (Carte 3D)</span>
            </button>
            <a routerLink="/solar" class="btn-nature btn-hero">
              <span class="material-symbols-rounded">solar_power</span>
              <span>Simulateur Solaire Gratuit</span>
            </a>
          </div>
        </div>

      </section>

      <section class="stats-banner">
        <div class="stat-card glass-card" appTilt3d [maxTilt]="10">
          <div class="stat-icon sun">
            <span class="material-symbols-rounded">bolt</span>
          </div>
          <div class="stat-meta">
            <span class="stat-val">{{ eleService.totalCurrentLoadMw() | number }} MW</span>
            <span class="stat-lbl">{{ 'stats.national_load' | trans }}</span>
          </div>
        </div>

        <div class="stat-card glass-card" appTilt3d [maxTilt]="10">
          <div class="stat-icon nature">
            <span class="material-symbols-rounded">wb_sunny</span>
          </div>
          <div class="stat-meta">
            <span class="stat-val">{{ eleService.solarSharePct() }}%</span>
            <span class="stat-lbl">{{ 'stats.solar_ratio' | trans }}</span>
          </div>
        </div>

        <div class="stat-card glass-card" appTilt3d [maxTilt]="10">
          <div class="stat-icon sky">
            <span class="material-symbols-rounded">psychology</span>
          </div>
          <div class="stat-meta">
            <span class="stat-val">97.9%</span>
            <span class="stat-lbl">{{ 'stats.forecast_accuracy' | trans }}</span>
          </div>
        </div>

        <div class="stat-card glass-card" appTilt3d [maxTilt]="10">
          <div class="stat-icon amber">
            <span class="material-symbols-rounded">location_city</span>
          </div>
          <div class="stat-meta">
            <span class="stat-val">24 / 24</span>
            <span class="stat-lbl">{{ 'stats.governorates_connected' | trans }}</span>
          </div>
        </div>
      </section>

      <section class="pillars-section">
        <div class="section-title-center">
          <span class="glass-badge badge-sun">Notre Mission</span>
          <h2 class="section-heading">Une Plateforme, Trois Piliers d'Avenir</h2>
          <p class="section-sub">Conçue pour les citoyens, les opérateurs et la transition énergétique tunisienne</p>
        </div>

        <div class="pillars-grid">
          
          <div class="pillar-card glass-card" appTilt3d [maxTilt]="8">
            <div class="pillar-icon-box sun">
              <span class="material-symbols-rounded">query_stats</span>
            </div>
            <h3 class="pillar-title">1. Prévoir</h3>
            <p class="pillar-desc">
              Algorithmes de Machine Learning (LightGBM & LSTM) entraînés sur les cycles météo tunisiens pour anticiper les pics de canicule et prévenir les coupures de courant.
            </p>
            <ul class="pillar-features">
              <li><span class="material-symbols-rounded">check</span> Horizon J+1 et J+7</li>
              <li><span class="material-symbols-rounded">check</span> Simulation météo en temps réel</li>
              <li><span class="material-symbols-rounded">check</span> Marge de réserve garantie</li>
            </ul>
          </div>

          <div class="pillar-card glass-card" appTilt3d [maxTilt]="8">
            <div class="pillar-icon-box coral">
              <span class="material-symbols-rounded">security</span>
            </div>
            <h3 class="pillar-title">2. Détecter</h3>
            <p class="pillar-desc">
              Détection automatisée des anomalies et des fraudes de comptage avec explication SHAP factorielle, pour un réseau plus juste et sécurisé.
            </p>
            <ul class="pillar-features">
              <li><span class="material-symbols-rounded">check</span> Score d'anomalie 0-100%</li>
              <li><span class="material-symbols-rounded">check</span> Facteurs explicatifs transparents</li>
              <li><span class="material-symbols-rounded">check</span> Dispatching direct aux techniciens</li>
            </ul>
          </div>

          <div class="pillar-card glass-card" appTilt3d [maxTilt]="8">
            <div class="pillar-icon-box nature">
              <span class="material-symbols-rounded">solar_power</span>
            </div>
            <h3 class="pillar-title">3. Économiser</h3>
            <p class="pillar-desc">
              Accompagnement du citoyen dans sa facture d'électricité, conseils éco-gestes adaptés à la Tunisie et simulateur solaire clé en main avec aides ANME Prosol.
            </p>
            <ul class="pillar-features">
              <li><span class="material-symbols-rounded">check</span> Compteur 3D en direct</li>
              <li><span class="material-symbols-rounded">check</span> Calcul du retour sur investissement</li>
              <li><span class="material-symbols-rounded">check</span> Réduction d'empreinte carbone</li>
            </ul>
          </div>

        </div>
      </section>

      <section class="demo-actors-section glass-card">
        <div class="section-title-center">
          <span class="glass-badge badge-sky">Démonstration Complète</span>
          <h2 class="section-heading">Explorez les 4 Tableaux de Bord Dédiés</h2>
          <p class="section-sub">Choisissez un profil pour découvrir l'expérience utilisateur et les fonctionnalités 3D</p>
        </div>

        <div class="actors-cards-grid">
          
          <div class="actor-card glass-panel" (click)="authService.loginAsDemoAccount('CITOYEN')">
            <div class="actor-avatar-box">
              <span class="material-symbols-rounded">person</span>
            </div>
            <div class="actor-name">Espace Citoyen</div>
            <p class="actor-role-desc">Compteur 3D interactif, facture estimée, conseils climatisation et simulateur solaire.</p>
            <button class="btn-primary btn-sm">Accéder en tant que Citoyen →</button>
          </div>

          <div class="actor-card glass-panel" (click)="authService.loginAsDemoAccount('OPERATEUR')">
            <div class="actor-avatar-box operator">
              <span class="material-symbols-rounded">monitoring</span>
            </div>
            <div class="actor-name">Console Opérateur</div>
            <p class="actor-role-desc">Carte 3D de la Tunisie, prévision de charge IA, simulateur canicule et détection de fraude SHAP.</p>
            <button class="btn-sky btn-sm">Accéder en tant qu'Opérateur →</button>
          </div>

          <div class="actor-card glass-panel" (click)="authService.loginAsDemoAccount('TECHNICIEN')">
            <div class="actor-avatar-box tech">
              <span class="material-symbols-rounded">build</span>
            </div>
            <div class="actor-name">Espace Technicien</div>
            <p class="actor-role-desc">Ordres de mission prioritaires, localisation des pannes et workflow de clôture sur site.</p>
            <button class="btn-nature btn-sm">Accéder en tant que Technicien →</button>
          </div>

          <div class="actor-card glass-panel" (click)="authService.loginAsDemoAccount('ADMIN')">
            <div class="actor-avatar-box admin">
              <span class="material-symbols-rounded">admin_panel_settings</span>
            </div>
            <div class="actor-name">Console Administrateur</div>
            <p class="actor-role-desc">Gestion des 20 utilisateurs, modèles ML en production, seuils régionaux et générateur démo.</p>
            <button class="btn-secondary btn-sm">Accéder en tant qu'Admin →</button>
          </div>

        </div>
      </section>

      <section class="live-outages-preview glass-card">
        <div class="preview-header">
          <div>
            <span class="glass-badge badge-coral">Transparence Publique</span>
            <h2 class="card-title">Carte Publique des Coupures & Interventions</h2>
            <p class="card-sub">Accédez à l'état du réseau sans compte nécessaire pour votre quartier</p>
          </div>
          <a routerLink="/outages" class="btn-primary">
            <span class="material-symbols-rounded">map</span>
            <span>Voir la Carte Complète</span>
          </a>
        </div>

        <div class="outages-mini-list">
          @for (outage of outageService.outages().slice(0, 3); track outage.id) {
            <div class="outage-mini-card glass-panel">
              <div class="o-status-dot" [class.en-cours]="outage.status === 'EN_COURS'"></div>
              <div class="o-info">
                <span class="o-ref">{{ outage.reference }} • {{ outage.governorate }}</span>
                <span class="o-addr">{{ outage.address }}</span>
              </div>
              <div class="o-timing">
                <span class="o-est">Rétablissement : {{ outage.estimatedResolution }}</span>
                <span class="glass-badge badge-coral">{{ outage.affectedCustomers }} abonnés</span>
              </div>
            </div>
          }
        </div>
      </section>

    </div>
  `,
  styles: [`
    .home-page {
      display: flex;
      flex-direction: column;
      gap: 36px;
      padding-bottom: 60px;
    }

    .hero-section {
      position: relative;
      height: 540px;
      border-radius: var(--radius-xl);
      overflow: hidden;
      display: flex;
      align-items: center;
      padding: 0 48px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 248, 238, 0.5) 100%);
      box-shadow: var(--shadow-lg);
    }

    .hero-3d-placeholder {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 75% 35%, rgba(255, 183, 3, 0.12) 0%, transparent 60%);
    }

    .hero-content {
      position: relative;
      z-index: 2;
      max-width: 680px;
    }

    .hero-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      border-radius: var(--radius-full);
      border: 1px solid rgba(255, 183, 3, 0.4);
      font-size: 13px;
      font-weight: 800;
      color: #A35C00;
      margin-bottom: 18px;
      box-shadow: var(--shadow-sm);
    }

    .pulse-sun {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--sun-gold);
      box-shadow: 0 0 10px var(--sun-gold);
      animation: pulseGlow 2s infinite;
    }

    .hero-title {
      font-size: 42px;
      font-weight: 900;
      color: var(--text-main);
      line-height: 1.15;
      margin-bottom: 16px;
    }

    .gradient-text {
      background: linear-gradient(135deg, var(--sun-amber) 0%, var(--sky-deep) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-subtitle {
      font-size: 16px;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 26px;
    }

    .hero-cta-group {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .btn-hero {
      padding: 13px 24px;
      font-size: 14.5px;
    }

    .stats-banner {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 18px;
    }

    .stat-card {
      padding: 22px;
      display: flex;
      align-items: center;
      gap: 16px;
      border-radius: var(--radius-lg);
    }

    .stat-icon {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      flex-shrink: 0;

      &.sun { background: var(--sun-gradient); box-shadow: 0 4px 14px rgba(251, 133, 0, 0.35); }
      &.nature { background: var(--nature-gradient); box-shadow: 0 4px 14px rgba(82, 183, 136, 0.35); }
      &.sky { background: var(--sky-gradient); box-shadow: 0 4px 14px rgba(76, 201, 240, 0.35); }
      &.amber { background: linear-gradient(135deg, #FB8500 0%, #D90429 100%); box-shadow: 0 4px 14px rgba(251, 133, 0, 0.35); }
    }

    .stat-val {
      font-family: var(--font-title);
      font-size: 26px;
      font-weight: 900;
      color: var(--text-main);
      display: block;
      line-height: 1.1;
    }

    .stat-lbl {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 700;
    }

    /* Pillars */
    .pillars-section {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .section-title-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
    }

    .section-heading {
      font-size: 30px;
      font-weight: 900;
      color: var(--text-main);
    }

    .section-sub {
      font-size: 15px;
      color: var(--text-muted);
    }

    .pillars-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
      gap: 22px;
    }

    .pillar-card {
      padding: 30px 26px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .pillar-icon-box {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;

      &.sun { background: var(--sun-gradient); box-shadow: 0 6px 18px rgba(251, 133, 0, 0.35); }
      &.coral { background: linear-gradient(135deg, #FF6B6B 0%, #D90429 100%); box-shadow: 0 6px 18px rgba(255, 107, 107, 0.35); }
      &.nature { background: var(--nature-gradient); box-shadow: 0 6px 18px rgba(82, 183, 136, 0.35); }
    }

    .pillar-title {
      font-size: 20px;
      font-weight: 900;
      color: var(--text-main);
    }

    .pillar-desc {
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.5;
      flex: 1;
    }

    .pillar-features {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-top: 10px;
      border-top: 1px solid rgba(29, 53, 87, 0.08);

      li {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--text-main);
        font-weight: 600;

        .material-symbols-rounded {
          font-size: 16px;
          color: var(--nature-green);
        }
      }
    }

    /* Actors Section */
    .demo-actors-section {
      padding: 36px 30px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .actors-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 18px;
    }

    .actor-card {
      padding: 24px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 10px;
      cursor: pointer;
      transition: all var(--transition-bounce);

      &:hover {
        transform: translateY(-6px);
        box-shadow: var(--shadow-hover);
        border-color: var(--sun-amber);
      }
    }

    .actor-avatar-box {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--sun-gradient);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(251, 133, 0, 0.35);

      &.operator { background: var(--sky-gradient); box-shadow: 0 4px 14px rgba(76, 201, 240, 0.35); }
      &.tech { background: var(--nature-gradient); box-shadow: 0 4px 14px rgba(82, 183, 136, 0.35); }
      &.admin { background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); }
    }

    .actor-name {
      font-size: 16px;
      font-weight: 800;
      color: var(--text-main);
    }

    .actor-role-desc {
      font-size: 12.5px;
      color: var(--text-muted);
      line-height: 1.4;
      flex: 1;
    }

    .btn-sm {
      padding: 8px 14px;
      font-size: 12px;
      width: 100%;
    }

    /* Outages preview */
    .live-outages-preview {
      padding: 28px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .outages-mini-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .outage-mini-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      border-radius: var(--radius-md);
    }

    .o-status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--alert-coral);
      box-shadow: 0 0 8px var(--alert-coral);

      &.en-cours { background: var(--sun-amber); box-shadow: 0 0 8px var(--sun-amber); }
    }

    .o-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .o-ref {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-light);
    }

    .o-addr {
      font-size: 14px;
      font-weight: 800;
      color: var(--text-main);
    }

    .o-timing {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .o-est {
      font-size: 12px;
      color: var(--text-muted);
    }

    @media (max-width: 900px) {
      .hero-section { height: auto; padding: 40px 20px; }
      .hero-title { font-size: 32px; }
      .preview-header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  authService = inject(AuthService);
  eleService = inject(ElectricityService);
  outageService = inject(OutageService);

  @ViewChild(Hero3dComponent) hero3d?: Hero3dComponent;
  private onScrollBound = this.handleScroll.bind(this);

  ngAfterViewInit(): void {
    window.addEventListener('scroll', this.onScrollBound, { passive: true });
    try {
      const tl = gsap.timeline();
      tl.from('.hero-badge-pill', { opacity: 0, scale: 0.8, duration: 0.6, ease: 'back.out(1.7)' })
        .from('.hero-title', { opacity: 0, y: 30, duration: 0.8, ease: 'power2.out' }, '-=0.3')
        .from('.hero-subtitle', { opacity: 0, y: 20, duration: 0.7, ease: 'power2.out' }, '-=0.4')
        .from('.hero-cta-group button, .hero-cta-group a', { 
          opacity: 0, 
          y: 20, 
          stagger: 0.12, 
          duration: 0.6, 
          ease: 'back.out(1.5)' 
        }, '-=0.3')
        .from('.stat-card', { 
          opacity: 0, 
          y: 25, 
          stagger: 0.1, 
          duration: 0.7, 
          ease: 'power3.out' 
        }, '-=0.2');
    } catch (e) {
      console.warn('GSAP animation fallback:', e);
    }
  }

  private handleScroll(): void {
    if (this.hero3d) {
      const scrollY = window.scrollY || window.pageYOffset;
      const progress = Math.min(1, Math.max(0, scrollY / 460));
      this.hero3d.updateScrollProgress(progress);
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScrollBound);
  }
}
