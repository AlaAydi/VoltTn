import { UserRole } from './user.model';

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';

export interface AppNotification {
  id: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  link?: string;
  targetRole?: UserRole | 'ALL';
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  duration?: number;
}
