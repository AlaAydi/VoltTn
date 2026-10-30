import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AiAssistantComponent } from './shared/components/ai-assistant/ai-assistant.component';
import { CommandPaletteComponent } from './shared/components/command-palette/command-palette.component';
import { AuthService } from './core/services/auth.service';
import { I18nService } from './core/services/i18n.service';
import { SmoothScrollService } from './core/services/smooth-scroll.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    NavbarComponent, 
    SidebarComponent, 
    ToastComponent, 
    AiAssistantComponent,
    CommandPaletteComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  authService = inject(AuthService);
  i18n = inject(I18nService);
  router = inject(Router);
  smoothScroll = inject(SmoothScrollService);

  ngOnInit(): void {
    this.smoothScroll.init();
  }

  showSidebar(): boolean {
    const url = this.router.url;
    if (url === '/login' || url === '/register' || url === '/') {
      return false;
    }
    return this.authService.isLoggedIn() || 
           url.startsWith('/citoyen') || 
           url.startsWith('/operateur') || 
           url.startsWith('/technicien') || 
           url.startsWith('/admin');
  }
}
