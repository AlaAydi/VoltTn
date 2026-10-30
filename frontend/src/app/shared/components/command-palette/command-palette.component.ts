import { 
  Component, 
  inject, 
  signal, 
  computed, 
  HostListener, 
  ElementRef, 
  ViewChild, 
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';
import { CommandPaletteService } from '../../../core/services/command-palette.service';

export interface CommandItem {
  id: string;
  title: string;
  titleAr: string;
  category: 'navigation' | 'demo' | 'system';
  icon: string;
  route?: string;
  action?: () => void;
  shortcut?: string;
  badge?: string;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="cmd-backdrop" (click)="close()">
        <div class="cmd-modal glass-card" (click)="$event.stopPropagation()">
          
          <!-- En-tête de recherche -->
          <div class="cmd-header">
            <span class="material-symbols-rounded cmd-search-icon">search</span>
            <input 
              #searchInput
              type="text" 
              class="cmd-input" 
              [placeholder]="i18n.currentLang() === 'ar' ? 'ابحث عن فضاء، ميزة أو دور...' : 'Rechercher un espace, rôle, gouvernorat...'" 
              [ngModel]="query()" 
              (ngModelChange)="onQueryChange($event)"
              (keydown)="onKeydown($event)"
              autocomplete="off"
              spellcheck="false"
            />
            <button class="cmd-esc-badge" (click)="close()" title="Fermer (Échap)">
              <span>Échap</span>
            </button>
          </div>

          <!-- Liste des commandes filtrées -->
          <div class="cmd-list" #listContainer>
            @if (filteredItems().length === 0) {
              <div class="cmd-empty">
                <span class="material-symbols-rounded">search_off</span>
                <span>{{ i18n.currentLang() === 'ar' ? 'لم يتم العثور على نتائج' : 'Aucun résultat trouvé' }}</span>
              </div>
            } @else {
              @for (item of filteredItems(); track item.id; let idx = $index) {
                <div 
                  class="cmd-item" 
                  [class.selected]="idx === selectedIndex()"
                  (click)="execute(item)"
                  (mouseenter)="selectedIndex.set(idx)"
                >
                  <div class="cmd-item-left">
                    <div class="cmd-icon-box" [ngClass]="item.category">
                      <span class="material-symbols-rounded">{{ item.icon }}</span>
                    </div>
                    <div class="cmd-item-meta">
                      <span class="cmd-item-title">
                        {{ i18n.currentLang() === 'ar' ? item.titleAr : item.title }}
                      </span>
                      <span class="cmd-item-cat">{{ getCategoryLabel(item.category) }}</span>
                    </div>
                  </div>

                  <div class="cmd-item-right">
                    @if (item.badge) {
                      <span class="cmd-badge">{{ item.badge }}</span>
                    }
                    @if (idx === selectedIndex()) {
                      <span class="cmd-enter-hint">↵ Entrée</span>
                    }
                  </div>
                </div>
              }
            }
          </div>

          <!-- Pied de la palette de commandes -->
          <div class="cmd-footer">
            <div class="cmd-shortcuts">
              <span class="shortcut-pill"><kbd>↑</kbd><kbd>↓</kbd> Naviguer</span>
              <span class="shortcut-pill"><kbd>↵</kbd> Ouvrir</span>
              <span class="shortcut-pill"><kbd>Échap</kbd> Quitter</span>
            </div>
            <div class="cmd-brand-sub">
              <span>Volt<strong>TN</strong> QuickSwitch</span>
            </div>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    .cmd-backdrop {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(29, 53, 87, 0.45);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 100px 20px 40px;
      animation: fadeInBackdrop 0.18s ease-out;
    }

    @keyframes fadeInBackdrop {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .cmd-modal {
      width: 100%;
      max-width: 640px;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border-radius: 22px;
      border: 1px solid rgba(255, 255, 255, 0.85);
      box-shadow: 0 24px 60px rgba(29, 53, 87, 0.22), 0 0 1px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: scaleInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes scaleInModal {
      from { opacity: 0; transform: scale(0.96) translateY(-8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .cmd-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(29, 53, 87, 0.08);
      background: rgba(255, 255, 255, 0.7);
    }

    .cmd-search-icon {
      font-size: 24px;
      color: var(--sun-amber, #FB8500);
    }

    .cmd-input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-main, #1D3557);
      font-family: inherit;

      &::placeholder {
        color: var(--text-light, #8D99AE);
        font-weight: 400;
      }
    }

    .cmd-esc-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px 8px;
      border-radius: 8px;
      background: rgba(29, 53, 87, 0.06);
      border: 1px solid rgba(29, 53, 87, 0.1);
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted, #5C708A);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: rgba(29, 53, 87, 0.12);
        color: var(--text-main, #1D3557);
      }
    }

    .cmd-list {
      max-height: 380px;
      overflow-y: auto;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;

      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-thumb {
        background: rgba(29, 53, 87, 0.15);
        border-radius: 10px;
      }
    }

    .cmd-empty {
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      color: var(--text-muted, #5C708A);
      font-size: 14px;
      font-weight: 600;

      .material-symbols-rounded {
        font-size: 36px;
        opacity: 0.5;
      }
    }

    .cmd-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-radius: 14px;
      cursor: pointer;
      transition: background 0.12s ease, transform 0.12s ease;

      &:hover, &.selected {
        background: rgba(255, 183, 3, 0.14);
        transform: translateX(2px);
      }
    }

    .cmd-item-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .cmd-icon-box {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;

      .material-symbols-rounded {
        font-size: 20px;
      }

      &.navigation {
        background: linear-gradient(135deg, #4CC9F0 0%, #2A9DF4 100%);
      }
      &.demo {
        background: linear-gradient(135deg, #FFB703 0%, #FB8500 100%);
      }
      &.system {
        background: linear-gradient(135deg, #52B788 0%, #2D6A4F 100%);
      }
    }

    .cmd-item-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .cmd-item-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main, #1D3557);
    }

    .cmd-item-cat {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted, #5C708A);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .cmd-item-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cmd-badge {
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(29, 53, 87, 0.06);
      font-size: 11px;
      font-weight: 700;
      color: var(--text-main, #1D3557);
    }

    .cmd-enter-hint {
      font-size: 11px;
      font-weight: 700;
      color: var(--sun-amber, #FB8500);
      background: #FFFFFF;
      padding: 3px 8px;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    .cmd-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: rgba(255, 251, 242, 0.85);
      border-top: 1px solid rgba(29, 53, 87, 0.08);
      font-size: 12px;
      color: var(--text-muted, #5C708A);
    }

    .cmd-shortcuts {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .shortcut-pill {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;

      kbd {
        background: #FFFFFF;
        border: 1px solid rgba(29, 53, 87, 0.15);
        border-radius: 4px;
        padding: 1px 5px;
        font-family: inherit;
        font-weight: 700;
        box-shadow: 0 1px 2px rgba(0,0,0,0.06);
      }
    }

    .cmd-brand-sub {
      font-size: 11px;
      font-weight: 600;
      strong { color: var(--sun-amber, #FB8500); }
    }
  `]
})
export class CommandPaletteComponent {
  authService = inject(AuthService);
  i18n = inject(I18nService);
  router = inject(Router);
  paletteService = inject(CommandPaletteService);

  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('listContainer') listContainerRef?: ElementRef<HTMLDivElement>;

  isOpen = this.paletteService.isOpen;
  query = signal<string>('');
  selectedIndex = signal<number>(0);

  // Écouteur global pour Ctrl+K / Cmd+K
  @HostListener('window:keydown', ['$event'])
  handleGlobalKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.toggle();
    } else if (e.key === 'Escape' && this.isOpen()) {
      e.preventDefault();
      this.close();
    }
  }

  // Catalogue complet des commandes rapides
  private readonly items: CommandItem[] = [
    // Navigation Espaces & Rôles
    {
      id: 'home',
      title: 'Accueil VoltTN',
      titleAr: 'الصفحة الرئيسية',
      category: 'navigation',
      icon: 'home',
      route: '/',
      badge: 'Public'
    },
    {
      id: 'citoyen-dash',
      title: 'Espace Citoyen — Compteur 3D & Facture',
      titleAr: 'فضاء المواطن — العداد الذكي والاستهلاك',
      category: 'navigation',
      icon: 'speed',
      route: '/citoyen/dashboard',
      badge: 'Citoyen'
    },
    {
      id: 'citoyen-coach',
      title: 'Espace Citoyen — Éco-Coach & Conseils',
      titleAr: 'فضاء المواطن — المستشار الطاقي الذكي',
      category: 'navigation',
      icon: 'tips_and_updates',
      route: '/citoyen/eco-coach',
      badge: 'Citoyen'
    },
    {
      id: 'citoyen-outage',
      title: 'Espace Citoyen — Signaler une panne',
      titleAr: 'فضاء المواطن — الإبلاغ عن عطب كهربائي',
      category: 'navigation',
      icon: 'report_problem',
      route: '/citoyen/report-outage',
      badge: 'Citoyen'
    },
    {
      id: 'operateur-dash',
      title: 'Console Opérateur — Supervision 24 Gouvernorats (Carte 3D)',
      titleAr: 'منصة المشغل — مراقبة 24 ولاية (خريطة ثلاثية الأبعاد)',
      category: 'navigation',
      icon: 'map',
      route: '/operateur/dashboard',
      badge: 'Opérateur'
    },
    {
      id: 'operateur-fraud',
      title: 'Console Opérateur — Détection Fraude & Explicabilité SHAP',
      titleAr: 'منصة المشغل — كشف التلاعب بالكهرباء ونموذج الذكاء الاصطناعي',
      category: 'navigation',
      icon: 'security',
      route: '/operateur/fraud',
      badge: 'Opérateur'
    },
    {
      id: 'operateur-sankey',
      title: 'Console Opérateur — Diagramme des Flux Énergétiques Sankey (ECharts)',
      titleAr: 'منصة المشغل — مخطط تدفق الطاقة الكهربائية الوطني (Sankey)',
      category: 'navigation',
      icon: 'account_tree',
      route: '/operateur/sankey',
      badge: 'Opérateur'
    },
    {
      id: 'operateur-stats',
      title: 'Console Opérateur — Statistiques Nationales & Prévision IA',
      titleAr: 'منصة المشغل — الإحصائيات الوطنية وتوقعات الاستهلاك',
      category: 'navigation',
      icon: 'bar_chart',
      route: '/operateur/stats',
      badge: 'Opérateur'
    },
    {
      id: 'technicien-interv',
      title: 'Espace Technicien — Ordres de Mission & Résolution',
      titleAr: 'فضاء التقني — مهام التدخل الميداني وإصلاح الأعطاب',
      category: 'navigation',
      icon: 'engineering',
      route: '/technicien/interventions',
      badge: 'Technicien'
    },
    {
      id: 'admin-users',
      title: 'Console Administrateur — Gestion Utilisateurs & Modèles ML',
      titleAr: 'منصة الإدارة — إدارة المستخدمين ونماذج الذكاء الاصطناعي',
      category: 'navigation',
      icon: 'admin_panel_settings',
      route: '/admin/users',
      badge: 'Admin'
    },
    {
      id: 'outages-map',
      title: 'Carte Publique des Coupures STEG',
      titleAr: 'الخريطة العامة لانقطاعات الكهرباء',
      category: 'navigation',
      icon: 'power_off',
      route: '/outages',
      badge: 'Public'
    },

    // Système & Langue
    {
      id: 'toggle-lang',
      title: 'Changer de langue (Français / العربية / تـونسي)',
      titleAr: 'تغيير اللغة (الفرنسية / العربية / الدارجة)',
      category: 'system',
      icon: 'translate',
      action: () => this.i18n.toggleLanguage(),
      badge: 'Langue'
    },

    // Connexions Démo 1-Clic
    {
      id: 'demo-citoyen',
      title: 'Connexion 1-Clic : Citoyen (Yassine Ben Salem)',
      titleAr: 'دخول سريع : مواطن (ياسين بن سالم)',
      category: 'demo',
      icon: 'person',
      action: () => this.authService.loginAsDemoAccount('CITOYEN'),
      badge: 'Démo'
    },
    {
      id: 'demo-operateur',
      title: 'Connexion 1-Clic : Opérateur (Ing. Leila Mansour)',
      titleAr: 'دخول سريع : مهندسة تشغيل (ليلى منصور)',
      category: 'demo',
      icon: 'supervisor_account',
      action: () => this.authService.loginAsDemoAccount('OPERATEUR'),
      badge: 'Démo'
    },
    {
      id: 'demo-technicien',
      title: 'Connexion 1-Clic : Technicien (Karim Trabelsi)',
      titleAr: 'دخول سريع : تقني صيانة (كريم الطرابلسي)',
      category: 'demo',
      icon: 'build',
      action: () => this.authService.loginAsDemoAccount('TECHNICIEN'),
      badge: 'Démo'
    },
    {
      id: 'demo-admin',
      title: 'Connexion 1-Clic : Administrateur (Dr. Amine Bouazizi)',
      titleAr: 'دخول سريع : مدير النظام (د. أمين البوعزيزي)',
      category: 'demo',
      icon: 'shield',
      action: () => this.authService.loginAsDemoAccount('ADMIN'),
      badge: 'Démo'
    }
  ];

  filteredItems = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.items;
    return this.items.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.titleAr.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.badge && item.badge.toLowerCase().includes(q))
    );
  });

  open(): void {
    this.paletteService.open();
    this.query.set('');
    this.selectedIndex.set(0);
    setTimeout(() => {
      this.searchInputRef?.nativeElement.focus();
    }, 50);
  }

  close(): void {
    this.paletteService.close();
  }

  toggle(): void {
    this.paletteService.toggle();
    if (this.isOpen()) {
      this.query.set('');
      this.selectedIndex.set(0);
      setTimeout(() => {
        this.searchInputRef?.nativeElement.focus();
      }, 50);
    }
  }

  onQueryChange(val: string): void {
    this.query.set(val);
    this.selectedIndex.set(0);
  }

  onKeydown(e: KeyboardEvent): void {
    const total = this.filteredItems().length;
    if (total === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex.set((this.selectedIndex() + 1) % total);
      this.scrollSelectedIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex.set((this.selectedIndex() - 1 + total) % total);
      this.scrollSelectedIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = this.filteredItems()[this.selectedIndex()];
      if (item) {
        this.execute(item);
      }
    }
  }

  execute(item: CommandItem): void {
    this.close();
    if (item.action) {
      item.action();
    } else if (item.route) {
      this.router.navigateByUrl(item.route);
    }
  }

  getCategoryLabel(category: string): string {
    const isAr = this.i18n.currentLang() === 'ar';
    switch (category) {
      case 'navigation': return isAr ? 'فضاء أو خدمة' : 'Navigation';
      case 'demo': return isAr ? 'حساب تجريبي' : 'Compte Démo';
      case 'system': return isAr ? 'إعدادات النظام' : 'Système';
      default: return category;
    }
  }

  private scrollSelectedIntoView(): void {
    setTimeout(() => {
      const container = this.listContainerRef?.nativeElement;
      const selected = container?.querySelector('.cmd-item.selected') as HTMLElement | null;
      if (container && selected) {
        const top = selected.offsetTop - container.offsetTop;
        const bottom = top + selected.clientHeight;
        if (top < container.scrollTop) {
          container.scrollTop = top;
        } else if (bottom > container.scrollTop + container.clientHeight) {
          container.scrollTop = bottom - container.clientHeight;
        }
      }
    }, 10);
  }
}
