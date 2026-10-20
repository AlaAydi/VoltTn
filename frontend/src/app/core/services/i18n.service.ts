import { Injectable, signal, computed } from '@angular/core';

export type Language = 'fr' | 'ar' | 'darija';

export interface Translations {
  [key: string]: {
    fr: string;
    ar: string;
    darija: string;
  };
}

const DICTIONARY: Translations = {
  // Navigation
  'nav.home': { fr: 'Accueil', ar: 'الرئيسية', darija: 'الرئيسية' },
  'nav.outages': { fr: 'Carte des Coupures', ar: 'خريطة الانقطاعات', darija: 'قصّة الضو' },
  'nav.solar': { fr: 'Simulateur Solaire', ar: 'محاكي الطاقة الشمسية', darija: 'طاقتي الشمسية' },
  'nav.login': { fr: 'Connexion', ar: 'تسجيل الدخول', darija: 'دخول' },
  'nav.register': { fr: 'Inscription', ar: 'إنشاء حساب', darija: 'تسجيل جديد' },
  'nav.logout': { fr: 'Déconnexion', ar: 'تسجيل الخروج', darija: 'خروج' },
  'nav.dashboard': { fr: 'Tableau de bord', ar: 'لوحة التحكم', darija: 'فضاء المتابعة' },
  'nav.consumption': { fr: 'Ma Consommation', ar: 'استهلاكي', darija: 'استهلاكي' },
  'nav.report_outage': { fr: 'Signaler une Panne', ar: 'الإبلاغ عن عطب', darija: 'بلّغ على عطب' },
  'nav.tips': { fr: 'Conseils Éco', ar: 'نصائح التوفير', darija: 'دبّر واقتصد' },
  'nav.billing': { fr: 'Facture & Relève IA', ar: 'الفاتورة والقراءة الذكية', darija: 'فاتورتي وعدادي' },
  'nav.coach': { fr: 'Coach Énergie & Défis', ar: 'مرشد الطاقة والتحديات', darija: 'كوتش التوفير' },
  'nav.assistant': { fr: 'Assistant IA', ar: 'المساعد الذكي', darija: 'عونك الذكي' },
  'nav.alerts': { fr: 'Mes Alertes', ar: 'تنبيهاتي', darija: 'تنبيهاتي' },
  'nav.forecast': { fr: 'Prévision de Charge', ar: 'توقعات الأحمال', darija: 'توقعات الضو' },
  'nav.fraud': { fr: 'Détection de Fraude', ar: 'كشف التجاوزات', darija: 'كشف الخيوط والتجاوزات' },
  'nav.grid_management': { fr: 'Carte des Pannes', ar: 'خريطة الأعطاب', darija: 'خريطة الأعطاب' },
  'nav.maintenance': { fr: 'Maintenance Réseau', ar: 'صيانة المعدات', darija: 'تصليح وصيانة' },
  'nav.scheduler': { fr: 'Planificateur Système', ar: 'مجدول المهام', darija: 'مجدول المهام' },
  'nav.stats': { fr: 'Statistiques & Export', ar: 'إحصائيات وتصدير', darija: 'إحصائيات' },
  'nav.interventions': { fr: 'Mes Interventions', ar: 'مهامي الميدانية', darija: 'المهمات متاعي' },
  'nav.users': { fr: 'Utilisateurs & Rôles', ar: 'المستخدمين والأدوار', darija: 'المستعملين' },
  'nav.thresholds': { fr: 'Seuils Régionaux', ar: 'عتبات التنبيه', darija: 'حدود الولايات' },
  'nav.ml_models': { fr: 'Modèles IA', ar: 'نماذج الذكاء الاصطناعي', darija: 'موديلات الذكاء' },
  'nav.data': { fr: 'Données & Imports', ar: 'البيانات والتوريد', darija: 'البيانات والتوريد' },
  'nav.audit': { fr: 'Supervision & Audit', ar: 'المراقبة والتدقيق', darija: 'المراقبة والتدقيق' },
  'nav.demo_generator': { fr: 'Générateur Démo', ar: 'مولد بيانات تجريبية', darija: 'تجربة ديمو' },

  // Hero & Public
  'hero.badge': { fr: 'L\'Énergie Intelligente en Tunisie', ar: 'طاقة ذكية لمستقبل تونس', darija: 'ضو تونس الذكي' },
  'hero.title_1': { fr: 'L\'électricité de demain,', ar: 'كهرباء الغد،', darija: 'كهرباء غدوة،' },
  'hero.title_2': { fr: 'éclairée par l\'intelligence artificielle', ar: 'مستنيرة بالذكاء الاصطناعي', darija: 'منوّرة بالذكاء الاصطناعي' },
  'hero.subtitle': { 
    fr: 'VoltTN modernise le réseau électrique tunisien. Anticipez la demande, détectez les anomalies, réduisez votre facture et accélérez votre transition solaire.',
    ar: 'فولت-تونس تعصرن الشبكة الكهربائية التونسية. استبق الطلب، واكتشف الأعطال، وقلص فاتورتك مع التحول السلس نحو الطاقة الشمسية.',
    darija: 'فولت-تونس تبدّل طريقتنا مع الضو. تبع استهلاكك، اعرف فاتورتك قبل ما تجيك، قلّل مصاريفك ونوّر دارك بالطاقة الشمسية.' 
  },
  'hero.cta_citizen': { fr: 'Espace Citoyen', ar: 'فضاء المواطن', darija: 'فضاء المواطن' },
  'hero.cta_operator': { fr: 'Console Opérateur', ar: 'بوابة المشغل', darija: 'بوابة الستاغ' },
  'hero.cta_solar': { fr: 'Simuler mon Solaire', ar: 'حساب طاقتي الشمسية', darija: 'احسب شمس دارك' },

  // Stats clés
  'stats.national_load': { fr: 'Charge Nationale', ar: 'الحمل الوطني', darija: 'الحمل الوطني' },
  'stats.solar_ratio': { fr: 'Part Solaire & Renouvelable', ar: 'نسبة الطاقة المتجددة', darija: 'طاقة نظيفة' },
  'stats.forecast_accuracy': { fr: 'Précision de Prévision IA', ar: 'دقة توقعات الذكاء', darija: 'دقة التوقعات' },
  'stats.governorates_connected': { fr: 'Gouvernorats Connectés', ar: 'ولاية متصلة بالشبكة', darija: 'ولاية مربوطة' },

  // Rôles
  'role.citoyen': { fr: 'Citoyen', ar: 'مواطن', darija: 'مواطن' },
  'role.operateur': { fr: 'Opérateur STEG', ar: 'مشغل الشبكة', darija: 'مشغل الستاغ' },
  'role.technicien': { fr: 'Technicien', ar: 'تقني ميداني', darija: 'تقني ميداني' },
  'role.admin': { fr: 'Administrateur', ar: 'مدير النظام', darija: 'مدير المنظومة' },

  // Communs
  'common.loading': { fr: 'Chargement...', ar: 'جار التحميل...', darija: 'لحظة تتحل...' },
  'common.save': { fr: 'Enregistrer', ar: 'حفظ', darija: 'سجّل' },
  'common.cancel': { fr: 'Annuler', ar: 'إلغاء', darija: 'بطّل' },
  'common.close': { fr: 'Fermer', ar: 'إغلاق', darija: 'سكّر' },
  'common.confirm': { fr: 'Confirmer', ar: 'تأكيد', darija: 'ثبّت' },
  'common.search': { fr: 'Rechercher...', ar: 'بحث...', darija: 'لوّج...' },
  'common.filter': { fr: 'Filtrer', ar: 'تصفية', darija: 'صفّي' },
  'common.details': { fr: 'Détails', ar: 'التفاصيل', darija: 'التفاصيل' }
};

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  currentLang = signal<Language>('fr');

  isRtl = computed(() => this.currentLang() === 'ar' || this.currentLang() === 'darija');

  constructor() {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('volttn_lang') as Language : null;
    if (saved === 'fr' || saved === 'ar' || saved === 'darija') {
      this.currentLang.set(saved);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('dir', (saved === 'ar' || saved === 'darija') ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', saved);
      }
    }
  }

  setLanguage(lang: Language): void {
    this.currentLang.set(lang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('volttn_lang', lang);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', (lang === 'ar' || lang === 'darija') ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', lang);
    }
  }

  toggleLanguage(): void {
    const current = this.currentLang();
    let next: Language = 'fr';
    if (current === 'fr') next = 'ar';
    else if (current === 'ar') next = 'darija';
    else next = 'fr';
    this.setLanguage(next);
  }

  getLanguageLabel(): string {
    const current = this.currentLang();
    if (current === 'fr') return 'FR';
    if (current === 'ar') return 'عربي';
    return 'تونسي';
  }

  translate(key: string): string {
    const entry = DICTIONARY[key];
    if (!entry) return key;
    return entry[this.currentLang()] || entry.fr || key;
  }
}
