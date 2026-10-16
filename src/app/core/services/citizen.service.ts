import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { CitizenConsumption, EnergyTip, HourlyRecord, DailyRecord, MonthlyRecord } from '../../models/consumption.model';

@Injectable({
  providedIn: 'root'
})
export class CitizenService implements OnDestroy {
  private currentPowerKwSignal = signal<number>(3.4);
  private timerId: any = null;

  private consumptionSignal = signal<CitizenConsumption>({
    meterId: 'MTR-TN-882419',
    customerName: 'Yassine Ben Salem',
    address: '14 Rue de la Liberté, Menzah 6, Tunis',
    governorate: 'Tunis',
    currentPowerKw: 3.4,
    todayKwh: 14.8,
    estimatedBillTnd: 148.5,
    monthForecastKwh: 430,
    regionalAverageKwh: 385,
    co2SavedKg: 42.6,
    solarPercentage: 24,
    hourlyHistory: [
      { hour: '06h', kwh: 0.4, costTnd: 0.12, isPeak: false },
      { hour: '08h', kwh: 1.1, costTnd: 0.35, isPeak: false },
      { hour: '10h', kwh: 0.8, costTnd: 0.25, isPeak: false },
      { hour: '12h', kwh: 2.2, costTnd: 0.75, isPeak: true },
      { hour: '14h', kwh: 3.1, costTnd: 1.05, isPeak: true },
      { hour: '16h', kwh: 2.6, costTnd: 0.88, isPeak: true },
      { hour: '18h', kwh: 1.8, costTnd: 0.60, isPeak: false },
      { hour: '20h', kwh: 2.4, costTnd: 0.82, isPeak: true },
      { hour: '22h', kwh: 1.2, costTnd: 0.40, isPeak: false }
    ],
    dailyHistory: [
      { date: '10 Oct', dayName: 'Ven', kwh: 16.2, costTnd: 5.5, previousWeekKwh: 14.8 },
      { date: '11 Oct', dayName: 'Sam', kwh: 18.4, costTnd: 6.2, previousWeekKwh: 17.1 },
      { date: '12 Oct', dayName: 'Dim', kwh: 19.1, costTnd: 6.5, previousWeekKwh: 18.0 },
      { date: '13 Oct', dayName: 'Lun', kwh: 13.9, costTnd: 4.7, previousWeekKwh: 14.2 },
      { date: '14 Oct', dayName: 'Mar', kwh: 14.2, costTnd: 4.8, previousWeekKwh: 13.9 },
      { date: '15 Oct', dayName: 'Mer', kwh: 15.0, costTnd: 5.1, previousWeekKwh: 14.5 },
      { date: '16 Oct', dayName: 'Jeu', kwh: 14.8, costTnd: 5.0, previousWeekKwh: 14.1 }
    ],
    // 12 mois complets avec pic estival prononcé (climatisation Tunisie)
    monthlyHistory: [
      { month: 'Nov', monthAr: 'نوفمبر', kwh: 240, costTnd: 81.6, regionalAverageKwh: 250 },
      { month: 'Déc', monthAr: 'ديسمبر', kwh: 290, costTnd: 98.6, regionalAverageKwh: 300 },
      { month: 'Jan', monthAr: 'جانفي', kwh: 310, costTnd: 105.4, regionalAverageKwh: 315 },
      { month: 'Fév', monthAr: 'فيفري', kwh: 270, costTnd: 91.8, regionalAverageKwh: 280 },
      { month: 'Mar', monthAr: 'مارس', kwh: 220, costTnd: 74.8, regionalAverageKwh: 230 },
      { month: 'Avr', monthAr: 'أفريل', kwh: 210, costTnd: 71.4, regionalAverageKwh: 215 },
      { month: 'Mai', monthAr: 'ماي', kwh: 250, costTnd: 85.0, regionalAverageKwh: 260 },
      { month: 'Juin', monthAr: 'جوان', kwh: 380, costTnd: 133.0, regionalAverageKwh: 360 },
      { month: 'Juil', monthAr: 'جويلية', kwh: 580, costTnd: 208.8, regionalAverageKwh: 520 }, // Pic estival
      { month: 'Août', monthAr: 'أوت', kwh: 640, costTnd: 230.4, regionalAverageKwh: 570 }, // Pic climatisation
      { month: 'Sept', monthAr: 'سبتمبر', kwh: 410, costTnd: 143.5, regionalAverageKwh: 390 },
      { month: 'Oct', monthAr: 'أكتوبر', kwh: 320, costTnd: 108.8, regionalAverageKwh: 310 }
    ]
  });

  private tipsSignal = signal<EnergyTip[]>([
    {
      id: 'tip-1',
      title: 'Optimisation Climatisation en Été',
      titleAr: 'تعديل المكيف في الصيف',
      description: 'Régler le climatiseur sur 26°C au lieu de 22°C réduit votre facture de 22% sans perte de confort.',
      descriptionAr: 'ضبط المكيف على 26 درجة بدلاً من 22 يوفر 22% من الفاتورة مع راحة ممتازة.',
      savingsTndPerMonth: 45,
      category: 'CHAUFFAGE_CLIM',
      icon: 'ac_unit',
      difficulty: 'FACILE'
    },
    {
      id: 'tip-2',
      title: 'Heures Pleines STEG (19h - 22h)',
      titleAr: 'تجنب ساعات الذروة (19 - 22)',
      description: 'Décalez l\'usage du lave-linge et chauffe-eau après 22h pour profiter du tarif creux et soulager le réseau.',
      descriptionAr: 'تأجيل تشغيل الغسالة بعد العاشرة ليلاً يخفف الحمل عن الشبكة ويقلص التعريفة.',
      savingsTndPerMonth: 28,
      category: 'ELECTROMENAGER',
      icon: 'schedule',
      difficulty: 'FACILE'
    },
    {
      id: 'tip-3',
      title: 'Passage aux LED Haute Efficacité',
      titleAr: 'التحول لمصابيح LED',
      description: 'Remplacer 8 ampoules traditionnelles par des LED à lumière chaude économise jusqu\'à 80% sur l\'éclairage.',
      descriptionAr: 'استبدال 8 مصابيح قديمة بمصابيح LED موفرة يوفر حتى 80% في الإضاءة.',
      savingsTndPerMonth: 18,
      category: 'ECLAIRAGE',
      icon: 'lightbulb',
      difficulty: 'FACILE'
    },
    {
      id: 'tip-4',
      title: 'Installation Photovoltaïque Autoconsommation',
      titleAr: 'تركيب طاقة شمسية ذاتية',
      description: 'Un kit de 3 kWc amorti en 4 ans grâce à la subvention ANME Prosol couvre 75% de vos besoins annuels.',
      descriptionAr: 'محطة منزلية بقدرة 3 كيلوواط تسترجع كلفتها خلال 4 سنوات بفضل دعم صندوق بروسول.',
      savingsTndPerMonth: 120,
      category: 'SOLAIRE',
      icon: 'solar_power',
      difficulty: 'AVANCE'
    }
  ]);

  readonly consumption = computed(() => this.consumptionSignal());
  readonly currentPowerKw = computed(() => this.currentPowerKwSignal());
  readonly tips = computed(() => this.tipsSignal());

  constructor() {
    // Animation légère de la puissance instantanée (simule les battements du compteur électrique)
    this.timerId = setInterval(() => {
      const delta = (Math.random() - 0.48) * 0.3;
      const next = Math.max(1.2, Math.min(6.5, this.currentPowerKwSignal() + delta));
      this.currentPowerKwSignal.set(Number(next.toFixed(2)));
    }, 2500);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  associateMeter(meterId: string, clientCode: string, address: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.consumptionSignal.update(c => ({
          ...c,
          meterId,
          address
        }));
        resolve(true);
      }, 700);
    });
  }
}
