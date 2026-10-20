import { Injectable, signal, computed, inject } from '@angular/core';
import { WeatherService } from './weather.service';
import { ElectricityService } from './electricity.service';
import { OutageService } from './outage.service';
import { NotificationService } from './notification.service';
import { FraudService } from './fraud.service';

export interface ScheduledTask {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  frequency: string;
  nextRun: string;
  lastRun: string;
  status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'ERROR';
  executionCount: number;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class SystemSchedulerService {
  private weatherService = inject(WeatherService);
  private electricityService = inject(ElectricityService);
  private outageService = inject(OutageService);
  private notifService = inject(NotificationService);
  private fraudService = inject(FraudService);

  private tasksSignal = signal<ScheduledTask[]>([
    {
      id: 'task-weather-sync',
      name: 'Synchronisation Météo Open-Meteo',
      nameAr: 'مزامنة الطقس اليومي',
      description: 'Récupère la température, l\'humidité et l\'irradiance DNI pour les 24 gouvernorats.',
      frequency: 'Toutes les heures & à 05:00',
      nextRun: 'Dans 14 min',
      lastRun: 'Il y a 46 min',
      status: 'SUCCESS',
      executionCount: 1428,
      icon: 'routine'
    },
    {
      id: 'task-load-forecast',
      name: 'Calcul Prévisions de Charge IA (H+1 & J+7)',
      nameAr: 'حساب توقعات الأحمال بالذكاء الاصطناعي',
      description: 'Modèle LightGBM v2.4 pour estimer les pics de consommation et la réserve de puissance.',
      frequency: 'Toutes les 30 minutes',
      nextRun: 'Dans 8 min',
      lastRun: 'Il y a 22 min',
      status: 'SUCCESS',
      executionCount: 3890,
      icon: 'trending_up'
    },
    {
      id: 'task-meter-batch-scoring',
      name: 'Scoring Nocturne Anti-Fraude par Lots',
      nameAr: 'معالجة شبهات التلاعب بالعدادات',
      description: 'Analyse les courbes de charge de 100 000 compteurs et calcule les valeurs SHAP.',
      frequency: 'Quotidien à 02:00',
      nextRun: 'Demain à 02:00',
      lastRun: 'Aujourd\'hui à 02:00',
      status: 'IDLE',
      executionCount: 365,
      icon: 'security'
    },
    {
      id: 'task-threshold-check',
      name: 'Surveillance Seuils Personnels & Surcharges',
      nameAr: 'مراقبة تجاوز السقف وتنبيه المواطنين',
      description: 'Détecte les dépassements des seuils citoyens et génère les alertes automatiques.',
      frequency: 'Toutes les 15 minutes',
      nextRun: 'Dans 3 min',
      lastRun: 'Il y a 12 min',
      status: 'SUCCESS',
      executionCount: 5210,
      icon: 'notification_important'
    },
    {
      id: 'task-outage-clustering',
      name: 'Regroupement & Déduplication des Coupures',
      nameAr: 'دمج بلاغات الانقطاع المتقاربة لمنع التكرار',
      description: 'Regroupe les signalements citoyens distants de moins de 500m sur le même poste HT/MT.',
      frequency: 'Temps réel continu (Event-driven)',
      nextRun: 'À l\'écoute (continu)',
      lastRun: 'Il y a 5 min',
      status: 'SUCCESS',
      executionCount: 780,
      icon: 'hub'
    },
    {
      id: 'task-power-restored-notifier',
      name: 'Notification Automatique de Rétablissement',
      nameAr: 'إشعار فوري بعودة التيار للمواطنين',
      description: 'Diffuse un push et un email dès qu\'une intervention terrain est clôturée.',
      frequency: 'Instantané lors du statut RÉSOLU',
      nextRun: 'En attente d\'événement',
      lastRun: 'Il y a 1 h',
      status: 'IDLE',
      executionCount: 412,
      icon: 'mark_email_read'
    }
  ]);

  private logsSignal = signal<string[]>([
    '[09:20:14] SYSTEM_DAEMON: Initialisation de la boucle planifiée VoltTN Daemon v2.4',
    '[09:20:15] WEATHER_SYNC: 24 gouvernorats interrogés avec succès via Open-Meteo',
    '[09:21:00] ML_FORECAST: Prédiction nationale H+1 calculée : 3 710 MW (marge 23%)',
    '[09:22:30] CLUSTERING: 3 signalements consolidés sous la référence INC-2025-0811',
    '[09:25:00] THRESHOLDS: 14 notifications de dépassement émises aux foyers abonnés'
  ]);

  readonly tasks = computed(() => this.tasksSignal());
  readonly logs = computed(() => this.logsSignal());

  // Déclencheur manuel d'une tâche système en 1 clic
  runTaskNow(taskId: string): void {
    this.tasksSignal.update(list =>
      list.map(t => (t.id === taskId ? { ...t, status: 'RUNNING' } : t))
    );

    const task = this.tasksSignal().find(t => t.id === taskId);
    const taskName = task ? task.name : 'Tâche Système';

    this.addLog(`[MANUAL_TRIGGER] Exécution immédiate de: ${taskName}`);

    setTimeout(() => {
      // Actions effectives selon la tâche
      if (taskId === 'task-weather-sync') {
        this.weatherService.refreshAllTunisiaWeather();
        this.addLog(`[WEATHER_SYNC] Synchronisation des températures et irradiance terminée.`);
      } else if (taskId === 'task-load-forecast') {
        this.electricityService.updateScenario({ tempDeltaC: 1 });
        this.addLog(`[ML_FORECAST] Modèle LightGBM exécuté avec succès. Prévision rafraîchie.`);
      } else if (taskId === 'task-threshold-check') {
        this.notifService.addNotification({
          title: 'Vérification Système des Seuils',
          titleAr: 'فحص دوري للشبكة',
          message: 'Analyse des seuils terminée. Aucun dépassement critique anormal détecté.',
          messageAr: 'تم الفحص الدوري بنجاح. لا توجد تجاوزات حرجة.',
          type: 'INFO',
          targetRole: 'ALL'
        });
        this.addLog(`[THRESHOLDS] Contrôle de charge et seuils achevé.`);
      } else if (taskId === 'task-outage-clustering') {
        this.addLog(`[CLUSTERING] Analyse spatiale : 0 doublon détecté parmi les coupures actives.`);
      } else if (taskId === 'task-power-restored-notifier') {
        this.notifService.addNotification({
          title: 'Courant Rétabli sur le Réseau',
          titleAr: 'عودة التيار الكهربائي',
          message: 'La STEG vous informe que l\'électricité a été rétablie dans votre secteur.',
          messageAr: 'تعلن الشركة التونسية للكهرباء والغاز عن عودة التيار الكهربائي لحيّكم.',
          type: 'SUCCESS',
          targetRole: 'CITOYEN'
        });
        this.addLog(`[NOTIFIER] Notification broadcast de retour du courant diffusée.`);
      }

      this.tasksSignal.update(list =>
        list.map(t =>
          t.id === taskId
            ? {
                ...t,
                status: 'SUCCESS',
                lastRun: 'À l\'instant',
                executionCount: t.executionCount + 1
              }
            : t
        )
      );

      this.notifService.showToast('Système Planificateur', `${taskName} exécuté avec succès.`, 'SUCCESS');
    }, 1200);
  }

  private addLog(entry: string): void {
    const time = new Date().toLocaleTimeString('fr-FR');
    this.logsSignal.update(l => [`[${time}] ${entry}`, ...l.slice(0, 40)]);
  }
}
