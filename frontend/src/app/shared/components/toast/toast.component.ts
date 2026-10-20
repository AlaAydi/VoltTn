import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack" aria-live="polite">
      @for (toast of notifService.toasts(); track toast.id) {
        <div 
          class="toast-item glass-card" 
          [ngClass]="'toast-' + toast.type.toLowerCase()"
          (click)="notifService.removeToast(toast.id)"
        >
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('SUCCESS') { <span class="material-symbols-rounded">check_circle</span> }
              @case ('WARNING') { <span class="material-symbols-rounded">warning</span> }
              @case ('ALERT') { <span class="material-symbols-rounded">error</span> }
              @default { <span class="material-symbols-rounded">info</span> }
            }
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-msg">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="notifService.removeToast(toast.id)">
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      top: 86px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 9999;
      pointer-events: none;
      max-width: 380px;
      width: calc(100% - 48px);
    }

    [dir="rtl"] .toast-stack {
      right: auto;
      left: 24px;
    }

    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 18px;
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(20px);
      box-shadow: 0 12px 32px rgba(29, 53, 87, 0.14);
      cursor: pointer;
      animation: slideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      border-left: 5px solid var(--sun-gold);

      &.toast-success {
        border-left-color: var(--nature-green);
        .toast-icon { color: var(--nature-green); }
      }
      &.toast-warning {
        border-left-color: var(--warn-amber);
        .toast-icon { color: var(--warn-amber); }
      }
      &.toast-alert {
        border-left-color: var(--alert-coral);
        .toast-icon { color: var(--alert-coral); }
      }
      &.toast-info {
        border-left-color: var(--sky-blue);
        .toast-icon { color: var(--sky-ocean); }
      }
    }

    [dir="rtl"] .toast-item {
      border-left: none;
      border-right: 5px solid var(--sun-gold);
      &.toast-success { border-right-color: var(--nature-green); }
      &.toast-warning { border-right-color: var(--warn-amber); }
      &.toast-alert { border-right-color: var(--alert-coral); }
      &.toast-info { border-right-color: var(--sky-blue); }
    }

    .toast-icon {
      font-size: 24px;
      line-height: 1;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .toast-content {
      flex: 1;
    }

    .toast-title {
      font-weight: 800;
      font-size: 14px;
      color: var(--text-main);
      margin-bottom: 2px;
    }

    .toast-msg {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      color: var(--text-light);
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      transition: color var(--transition-fast);
      &:hover { color: var(--text-main); }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(40px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }
  `]
})
export class ToastComponent {
  notifService = inject(NotificationService);
}
