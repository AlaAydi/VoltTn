import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AuthService } from './core/services/auth.service';
import { I18nService } from './core/services/i18n.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  authService = inject(AuthService);
  i18n = inject(I18nService);
  router = inject(Router);

  showSidebar(): boolean {
    const url = this.router.url;
    // Afficher la sidebar pour les dashboards d'acteurs
    return url.startsWith('/citoyen') || 
           url.startsWith('/operateur') || 
           url.startsWith('/technicien') || 
           url.startsWith('/admin');
  }
}
