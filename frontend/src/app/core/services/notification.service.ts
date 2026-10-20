import { Injectable, signal, computed } from '@angular/core';
import { AppNotification, ToastMessage, NotificationType } from '../../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSignal = signal<AppNotification[]>([
    {
      id: 'notif-1',
      title: 'Alerte Pic de Consommation',
      titleAr: 'تنبيه ذروة الاستهلاك',
      message: 'Pic estival prévu entre 13h et 16h sur le Grand Tunis. Modérez la climatisation.',
      messageAr: 'ذروة صيفية مرتقبة بين الساعة 13 و16 بتونس الكبرى. يرجى تعديل المكيفات.',
      type: 'WARNING',
      timestamp: 'Il y a 10 min',
      read: false,
      link: '/citoyen/tips',
      targetRole: 'ALL'
    },
    {
      id: 'notif-2',
      title: 'Réseau Sousse Rétabli',
      titleAr: 'إعادة تشغيل شبكة سوسة',
      message: 'L\'incident au poste Sousse-Sud a été résolu avec succès par les équipes d\'intervention.',
      messageAr: 'تم إصلاح العطب في محطة سوسة الجنوبية بنجاح من قبل الفرق الميدانية.',
      type: 'SUCCESS',
      timestamp: 'Il y a 35 min',
      read: false,
      link: '/outages',
      targetRole: 'ALL'
    },
    {
      id: 'notif-3',
      title: 'Nouvelle Anomalie Détectée',
      titleAr: 'اكتشاف شبهة تجاوز جديدة',
      message: 'Score SHAP 92% détecté sur le compteur MTR-SFX-3312 (Gouvernorat de Sfax).',
      messageAr: 'درجة اشتباه 92% على العداد MTR-SFX-3312 بولاية صفاقس.',
      type: 'ALERT',
      timestamp: 'Il y a 1 h',
      read: true,
      link: '/operateur/fraud',
      targetRole: 'OPERATEUR'
    },
    {
      id: 'notif-4',
      title: 'Production Solaire Optimale',
      titleAr: 'إنتاج شمسي قياسي',
      message: 'Ensoleillement exceptionnel aujourd\'hui dans le Sud (Tozeur, Tataouine) : +18% de rendement.',
      messageAr: 'إشعاع شمسي استثنائي اليوم بالجنوب: +18% في المردودية.',
      type: 'INFO',
      timestamp: 'Il y a 2 h',
      read: true,
      link: '/solar',
      targetRole: 'ALL'
    }
  ]);

  private toastsSignal = signal<ToastMessage[]>([]);

  readonly notifications = computed(() => this.notificationsSignal());
  readonly unreadCount = computed(() => this.notificationsSignal().filter(n => !n.read).length);
  readonly toasts = computed(() => this.toastsSignal());

  showToast(title: string, message: string, type: NotificationType = 'INFO', duration = 4000): void {
    const id = 'toast-' + Date.now() + Math.random().toString(36).substring(2, 5);
    const toast: ToastMessage = { id, title, message, type, duration };

    this.toastsSignal.update(toasts => [...toasts, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }
  }

  removeToast(id: string): void {
    this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
  }

  markAsRead(id: string): void {
    this.notificationsSignal.update(list =>
      list.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }

  markAllAsRead(): void {
    this.notificationsSignal.update(list =>
      list.map(n => ({ ...n, read: true }))
    );
  }

  addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): void {
    const newNotif: AppNotification = {
      ...notif,
      id: 'notif-' + Date.now(),
      timestamp: 'À l\'instant',
      read: false
    };
    this.notificationsSignal.update(list => [newNotif, ...list]);
    this.showToast(notif.title, notif.message, notif.type);
  }
}
