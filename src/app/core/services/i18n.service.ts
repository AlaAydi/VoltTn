import { Injectable, signal, computed } from '@angular/core';

export type Language = 'fr' | 'ar';

export interface Translations {
  [key: string]: {
    fr: string;
    ar: string;
  };
}

const DICTIONARY: Translations = {
  // Navigation
  'nav.home': { fr: 'Accueil', ar: 'الرئيسية' },
  'nav.outages': { fr: 'Carte des Coupures', ar: 'خريطة الانقطاعات' },
  'nav.solar': { fr: 'Simulateur Solaire', ar: 'محاكي الطاقة الشمسية' },
  'nav.login': { fr: 'Connexion', ar: 'تسجيل الدخول' },
  'nav.register': { fr: 'Inscription', ar: 'إنشاء حساب' },
  'nav.logout': { fr: 'Déconnexion', ar: 'تسجيل الخروج' },
  'nav.dashboard': { fr: 'Tableau de bord', ar: 'لوحة التحكم' },
  'nav.consumption': { fr: 'Ma Consommation', ar: 'استهلاكي' },
  'nav.report_outage': { fr: 'Signaler une Panne', ar: 'الإبلاغ عن عطب' },
  'nav.tips': { fr: 'Conseils Éco', ar: 'نصائح التوفير' },
  'nav.alerts': { fr: 'Mes Alertes', ar: 'تنبيهاتي' },
  'nav.forecast': { fr: 'Prévision de Charge', ar: 'توقعات الأحمال' },
  'nav.fraud': { fr: 'Détection de Fraude', ar: 'كشف التجاوزات' },
  'nav.grid_management': { fr: 'Gestion du Réseau', ar: 'إدارة الشبكة' },
  'nav.stats': { fr: 'Statistiques & Export', ar: 'إحصائيات وتصدير' },
  'nav.interventions': { fr: 'Mes Interventions', ar: 'مهامي الميدانية' },
  'nav.users': { fr: 'Utilisateurs & Rôles', ar: 'المستخدمين والأدوار' },
  'nav.thresholds': { fr: 'Seuils Régionaux', ar: 'عتبات التنبيه' },
  'nav.ml_models': { fr: 'Modèles IA', ar: 'نماذج الذكاء الاصطناعي' },
  'nav.audit': { fr: 'Journal d\'Audit', ar: 'سجل العمليات' },
  'nav.demo_generator': { fr: 'Générateur Démo', ar: 'مولد بيانات تجريبية' },

  // Hero & Public
  'hero.badge': { fr: 'L\'Énergie Intelligente en Tunisie', ar: 'طاقة ذكية لمستقبل تونس' },
  'hero.title_1': { fr: 'L\'électricité de demain,', ar: 'كهرباء الغد،' },
  'hero.title_2': { fr: 'éclairée par l\'intelligence artificielle', ar: 'مستنيرة بالذكاء الاصطناعي' },
  'hero.subtitle': { 
    fr: 'VoltTN modernise le réseau électrique tunisien. Anticipez la demande, détectez les anomalies, réduisez votre facture et accélérez votre transition solaire.',
    ar: 'فولت-تونس تعصرن الشبكة الكهربائية التونسية. استبق الطلب، واكتشف الأعطال، وقلص فاتورتك مع التحول السلس نحو الطاقة الشمسية.' 
  },
  'hero.cta_citizen': { fr: 'Espace Citoyen', ar: 'فضاء المواطن' },
  'hero.cta_operator': { fr: 'Console Opérateur', ar: 'بوابة المشغل' },
  'hero.cta_solar': { fr: 'Simuler mon Solaire', ar: 'حساب طاقتي الشمسية' },

  // Stats clés
  'stats.national_load': { fr: 'Charge Nationale', ar: 'الحمل الوطني' },
  'stats.solar_ratio': { fr: 'Part Solaire & Renouvelable', ar: 'نسبة الطاقة المتجددة' },
  'stats.forecast_accuracy': { fr: 'Précision de Prévision IA', ar: 'دقة توقعات الذكاء' },
  'stats.governorates_connected': { fr: 'Gouvernorats Connectés', ar: 'ولاية متصلة بالشبكة' },

  // Rôles
  'role.citoyen': { fr: 'Citoyen', ar: 'مواطن' },
  'role.operateur': { fr: 'Opérateur STEG', ar: 'مشغل الشبكة' },
  'role.technicien': { fr: 'Technicien', ar: 'تقني ميداني' },
  'role.admin': { fr: 'Administrateur', ar: 'مدير النظام' },

  // Communs
  'common.search': { fr: 'Rechercher...', ar: 'بحث...' },
  'common.export': { fr: 'Exporter', ar: 'تصدير' },
  'common.filter': { fr: 'Filtrer', ar: 'تصفية' },
  'common.refresh': { fr: 'Actualiser', ar: 'تحديث' },
  'common.save': { fr: 'Enregistrer', ar: 'حفظ' },
  'common.cancel': { fr: 'Annuler', ar: 'إلغاء' },
  'common.validate': { fr: 'Valider', ar: 'تأكيد' },
  'common.reject': { fr: 'Rejeter', ar: 'رفض' },
  'common.status': { fr: 'Statut', ar: 'الحالة' },
  'common.region': { fr: 'Région / Gouvernorat', ar: 'الولاية / المنطقة' },
  'common.date': { fr: 'Date', ar: 'التاريخ' },
  'common.actions': { fr: 'Actions', ar: 'الإجراءات' },
  'common.all': { fr: 'Tous', ar: 'الكل' },
  'common.tnd': { fr: 'DT', ar: 'د.ت' },
  'common.kwh': { fr: 'kWh', ar: 'ك.و.س' },
  'common.mw': { fr: 'MW', ar: 'ميجاوات' },
  'common.demo_mode': { fr: 'Mode Démo Rapide', ar: 'الوضع التجريبي السريع' }
};

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private currentLangSignal = signal<Language>('fr');

  readonly currentLang = computed(() => this.currentLangSignal());
  readonly isRtl = computed(() => this.currentLangSignal() === 'ar');

  constructor() {
    // Vérifier langue sauvegardée
    const saved = localStorage.getItem('volttn_lang') as Language;
    if (saved === 'ar' || saved === 'fr') {
      this.setLanguage(saved);
    } else {
      this.updateHtmlAttributes('fr');
    }
  }

  setLanguage(lang: Language): void {
    this.currentLangSignal.set(lang);
    localStorage.setItem('volttn_lang', lang);
    this.updateHtmlAttributes(lang);
  }

  toggleLanguage(): void {
    const next = this.currentLangSignal() === 'fr' ? 'ar' : 'fr';
    this.setLanguage(next);
  }

  translate(key: string): string {
    const entry = DICTIONARY[key];
    if (!entry) {
      return key;
    }
    return this.currentLangSignal() === 'ar' ? entry.ar : entry.fr;
  }

  private updateHtmlAttributes(lang: Language): void {
    const isArabic = lang === 'ar';
    document.documentElement.lang = lang;
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    if (isArabic) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }
}
