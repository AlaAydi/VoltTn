import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CitizenService } from '../../../core/services/citizen.service';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';
import { NotificationService } from '../../../core/services/notification.service';

export interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
  sources?: string[];
  feedback?: 'UP' | 'DOWN' | null;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Bouton Flottant Déclencheur de l'Assistant IA -->
    <div class="assistant-floating-container" [class.open]="isOpen()">
      
      @if (!isOpen()) {
        <button class="assistant-trigger-btn animate-glow" (click)="toggleChat()" title="Ouvrir l'Assistant IA VoltTN (FR / AR / Darija)">
          <div class="bot-avatar-inner">
            <span class="material-symbols-rounded bot-icon">smart_toy</span>
            <span class="pulse-ring"></span>
          </div>
          <span class="bot-caption">{{ i18n.currentLang() === 'darija' ? 'عونك الذكي' : (i18n.currentLang() === 'ar' ? 'المساعد الذكي' : 'Assistant IA') }}</span>
        </button>
      }

      <!-- Fenêtre de Chat Flottante -->
      @if (isOpen()) {
        <div class="chat-window glass-card animate-float">
          
          <!-- En-tête du Chatbot -->
          <div class="chat-header">
            <div class="header-bot-info">
              <div class="bot-icon-circle">
                <span class="material-symbols-rounded">smart_toy</span>
              </div>
              <div>
                <strong class="bot-name">VoltBot IA • تونس</strong>
                <span class="bot-status">
                  <span class="dot-online"></span>
                  <span>RAG Connecté (STEG & ANME)</span>
                </span>
              </div>
            </div>

            <div class="header-tools">
              <!-- Sélecteur rapide de langue de conversation -->
              <button class="btn-lang-toggle" (click)="i18n.toggleLanguage()" title="Changer de langue">
                {{ i18n.getLanguageLabel() }}
              </button>
              <button class="btn-close-chat" (click)="toggleChat()" title="Fermer">
                <span class="material-symbols-rounded">close</span>
              </button>
            </div>
          </div>

          <!-- Corps des Messages -->
          <div class="chat-messages-body">
            @for (msg of messages(); track msg.id) {
              <div class="message-bubble-wrapper" [class.user]="msg.sender === 'USER'" [class.ai]="msg.sender === 'AI'">
                
                @if (msg.sender === 'AI') {
                  <div class="msg-avatar ai">
                    <span class="material-symbols-rounded">bolt</span>
                  </div>
                }

                <div class="message-bubble" [class.user-bubble]="msg.sender === 'USER'" [class.ai-bubble]="msg.sender === 'AI'">
                  <div class="msg-text">{{ msg.text }}</div>
                  
                  @if (msg.sources && msg.sources.length > 0) {
                    <div class="rag-sources-panel">
                      <span class="sources-title">
                        <span class="material-symbols-rounded source-icon">verified</span>
                        <span>Sources Officielles Citées :</span>
                      </span>
                      @for (s of msg.sources; track s) {
                        <div class="source-tag">📄 {{ s }}</div>
                      }
                    </div>
                  }

                  <div class="msg-meta-row">
                    <span class="msg-time">{{ msg.timestamp }}</span>

                    @if (msg.sender === 'AI') {
                      <div class="feedback-actions">
                        <button 
                          class="feedback-btn" 
                          [class.active]="msg.feedback === 'UP'"
                          (click)="rateAnswer(msg, 'UP')"
                          title="Réponse utile"
                        >
                          <span class="material-symbols-rounded">thumb_up</span>
                        </button>
                        <button 
                          class="feedback-btn" 
                          [class.active]="msg.feedback === 'DOWN'"
                          (click)="rateAnswer(msg, 'DOWN')"
                          title="Réponse incorrecte"
                        >
                          <span class="material-symbols-rounded">thumb_down</span>
                        </button>
                      </div>
                    }
                  </div>
                </div>

              </div>
            }

            @if (isTyping()) {
              <div class="message-bubble-wrapper ai">
                <div class="msg-avatar ai"><span class="material-symbols-rounded">bolt</span></div>
                <div class="typing-indicator glass-panel">
                  <span></span><span></span><span></span>
                </div>
              </div>
            }
          </div>

          <!-- Questions Suggérées (Chips 1-Clic) -->
          <div class="suggested-chips-bar">
            @for (chip of getSuggestedQuestions(); track chip.text) {
              <button class="chip-btn" (click)="askPredefined(chip.text)">
                {{ chip.text }}
              </button>
            }
          </div>

          <!-- Barre d'Envoi avec Micro Vocal -->
          <div class="chat-input-area">
            
            <button 
              type="button" 
              class="voice-btn" 
              [class.listening]="isRecording()" 
              (click)="toggleVoiceInput()"
              [title]="isRecording() ? 'Enregistrement en cours...' : 'Dicter en Arabe, Darija ou Français'"
            >
              <span class="material-symbols-rounded">{{ isRecording() ? 'mic' : 'mic_none' }}</span>
              @if (isRecording()) {
                <span class="voice-radar"></span>
              }
            </button>

            <input 
              type="text" 
              class="chat-input" 
              [placeholder]="getPlaceholderText()" 
              [(ngModel)]="userInput" 
              (keyup.enter)="sendMessage()"
            />

            <button type="button" class="send-btn" (click)="sendMessage()" [disabled]="!userInput.trim()">
              <span class="material-symbols-rounded">send</span>
            </button>
          </div>

        </div>
      }

    </div>
  `,
  styles: [`
    .assistant-floating-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 10000;
    }

    [dir="rtl"] .assistant-floating-container {
      right: auto;
      left: 24px;
    }

    .assistant-trigger-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 18px 10px 12px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, #1D3557 0%, #0E6BA8 100%);
      color: #FFFFFF;
      border: 2px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 8px 24px rgba(29, 53, 87, 0.35);
      cursor: pointer;
      transition: all var(--transition-bounce);

      &:hover {
        transform: scale(1.08) translateY(-3px);
        box-shadow: 0 12px 30px rgba(29, 53, 87, 0.45);
      }
    }

    .bot-avatar-inner {
      position: relative;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--sun-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      .bot-icon { font-size: 22px; }
    }

    .pulse-ring {
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      border: 2px solid var(--sun-gold);
      animation: pulseGlow 2s infinite ease-out;
    }

    .bot-caption {
      font-weight: 800;
      font-size: 13.5px;
      letter-spacing: 0.3px;
    }

    /* Fenêtre de Chat */
    .chat-window {
      width: 420px;
      max-width: calc(100vw - 32px);
      height: 600px;
      max-height: calc(100vh - 120px);
      border-radius: var(--radius-xl);
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(20px);
      border: 1.5px solid rgba(29, 53, 87, 0.12);
      box-shadow: 0 16px 48px rgba(29, 53, 87, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .chat-header {
      padding: 14px 18px;
      background: linear-gradient(135deg, #1D3557 0%, #15253C 100%);
      color: #FFFFFF;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-bot-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .bot-icon-circle {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--sun-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      .material-symbols-rounded { font-size: 22px; color: #FFFFFF; }
    }

    .bot-name { font-size: 14.5px; font-weight: 900; display: block; }
    .bot-status {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.8);
      .dot-online { width: 7px; height: 7px; border-radius: 50%; background: #52B788; box-shadow: 0 0 6px #52B788; }
    }

    .header-tools {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-lang-toggle {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #FFFFFF;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 11.5px;
      font-weight: 800;
      cursor: pointer;
      &:hover { background: rgba(255, 255, 255, 0.25); }
    }

    .btn-close-chat {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      display: flex;
      align-items: center;
      &:hover { color: #FFFFFF; }
    }

    /* Corps Messages */
    .chat-messages-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .message-bubble-wrapper {
      display: flex;
      gap: 10px;
      max-width: 88%;

      &.user {
        align-self: flex-end;
        flex-direction: row-reverse;
      }
      &.ai {
        align-self: flex-start;
      }
    }

    .msg-avatar.ai {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--sky-gradient);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      .material-symbols-rounded { font-size: 16px; }
    }

    .message-bubble {
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 13px;
      line-height: 1.45;
      display: flex;
      flex-direction: column;
      gap: 8px;

      &.user-bubble {
        background: linear-gradient(135deg, #FFB703 0%, #FB8500 100%);
        color: #FFFFFF;
        border-bottom-right-radius: 4px;
        font-weight: 600;
      }

      &.ai-bubble {
        background: #F1F5F9;
        color: var(--text-main);
        border: 1px solid rgba(29, 53, 87, 0.08);
        border-bottom-left-radius: 4px;
      }
    }

    .rag-sources-panel {
      padding: 8px 10px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.9);
      border-left: 3px solid #2A9DF4;
      display: flex;
      flex-direction: column;
      gap: 3px;

      .sources-title {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 10.5px;
        font-weight: 800;
        color: #0E6BA8;
        .source-icon { font-size: 14px; }
      }
      .source-tag {
        font-size: 10px;
        color: var(--text-muted);
        font-style: italic;
      }
    }

    .msg-meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      color: var(--text-light);
    }

    .feedback-actions {
      display: flex;
      gap: 4px;
    }

    .feedback-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-light);
      padding: 2px;
      display: flex;
      align-items: center;
      &:hover { color: var(--sun-amber); }
      &.active { color: var(--nature-green); }
      .material-symbols-rounded { font-size: 15px; }
    }

    .typing-indicator {
      padding: 10px 16px;
      border-radius: 14px;
      display: flex;
      gap: 5px;
      span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--text-muted);
        animation: typingDot 1.4s infinite ease-in-out;
        &:nth-child(1) { animation-delay: 0s; }
        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }

    @keyframes typingDot {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }

    /* Suggested Chips */
    .suggested-chips-bar {
      display: flex;
      gap: 6px;
      padding: 8px 14px;
      overflow-x: auto;
      border-top: 1px solid rgba(29, 53, 87, 0.06);
      background: rgba(248, 250, 252, 0.8);
    }

    .chip-btn {
      padding: 5px 12px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      background: #FFFFFF;
      border: 1px solid rgba(29, 53, 87, 0.12);
      color: var(--text-muted);
      cursor: pointer;
      transition: all var(--transition-fast);
      &:hover {
        border-color: var(--sun-amber);
        color: var(--sun-amber);
      }
    }

    /* Input Area */
    .chat-input-area {
      padding: 12px 14px;
      background: #FFFFFF;
      border-top: 1px solid rgba(29, 53, 87, 0.08);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .voice-btn {
      position: relative;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(29, 53, 87, 0.05);
      border: 1px solid rgba(29, 53, 87, 0.1);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover { color: var(--sun-amber); border-color: var(--sun-amber); }

      &.listening {
        background: #FF6B6B;
        color: #FFFFFF;
        border-color: #FF6B6B;
      }
    }

    .voice-radar {
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      border: 2px solid #FF6B6B;
      animation: pulseGlow 1.2s infinite;
    }

    .chat-input {
      flex: 1;
      border: 1.5px solid rgba(29, 53, 87, 0.12);
      border-radius: var(--radius-full);
      padding: 8px 16px;
      font-size: 13px;
      outline: none;
      color: var(--text-main);
      &:focus { border-color: var(--sun-amber); }
    }

    .send-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--sun-gradient);
      color: #FFFFFF;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      &:disabled { opacity: 0.4; cursor: not-allowed; }
      .material-symbols-rounded { font-size: 18px; }
    }
  `]
})
export class AiAssistantComponent {
  citizenService = inject(CitizenService);
  authService = inject(AuthService);
  i18n = inject(I18nService);
  notifService = inject(NotificationService);

  isOpen = signal<boolean>(false);
  isTyping = signal<boolean>(false);
  isRecording = signal<boolean>(false);
  userInput = '';

  messages = signal<ChatMessage[]>([
    {
      id: 'm-01',
      sender: 'AI',
      text: 'عسلامة ! مرحبا بك في المساعد الذكي VoltTN. أستطيع إجابتك بالعربية، الدارجة التونسية أو الفرنسية حول فواتير الستاغ، أسعار الكهرباء، الطاقة الشمسية، أو سبب ارتفاع استهلاكك.',
      timestamp: '10:00',
      sources: ['Guide Tarifaire STEG Basse Tension 2024', 'Décret n°2016-1123 Autoproduction Solaire']
    }
  ]);

  toggleChat(): void {
    this.isOpen.update(v => !v);
  }

  getSuggestedQuestions() {
    const lang = this.i18n.currentLang();
    if (lang === 'darija') {
      return [
        { text: 'علاش الفاتورة متاعي غالية الشهر هذا ؟' },
        { text: 'وقتاش يبدا رخيص الضو (السوايع الخافضة) ؟' },
        { text: 'كيفاش نركب طاقة شمسية وناخذ منحة Prosol ؟' }
      ];
    } else if (lang === 'ar') {
      return [
        { text: 'لماذا ارتفعت فاتورتي هذا الشهر ؟' },
        { text: 'ما هي مواعيد الساعات المخفضة للكهرباء ؟' },
        { text: 'كيفية التقديم على منحة الطاقة الشمسية Prosol ؟' }
      ];
    } else {
      return [
        { text: 'Pourquoi ma facture est-elle élevée ce mois ?' },
        { text: 'Quels sont les horaires des heures creuses STEG ?' },
        { text: 'Comment bénéficier de la prime ANME Prosol ?' }
      ];
    }
  }

  getPlaceholderText(): string {
    const lang = this.i18n.currentLang();
    if (lang === 'darija') return 'اكتب سؤالك بالتونسي...';
    if (lang === 'ar') return 'اطرح سؤالك هنا...';
    return 'Posez votre question sur vos factures ou tarifs...';
  }

  askPredefined(question: string): void {
    this.userInput = question;
    this.sendMessage();
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'USER',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.messages.update(prev => [...prev, userMsg]);
    this.userInput = '';
    this.isTyping.set(true);

    setTimeout(() => {
      this.generateAiResponse(text);
      this.isTyping.set(false);
    }, 900);
  }

  generateAiResponse(query: string): void {
    const lower = query.toLowerCase();
    const currentKw = this.citizenService.currentPowerKw() || 2.4;
    let reply = '';
    let sources: string[] = [];

    if (lower.includes('facture') || lower.includes('فاتورة') || lower.includes('غالية') || lower.includes('ارتفعت')) {
      reply = `D'après vos données de compteur MTR-TN-882419, votre foyer consomme actuellement ${currentKw} kW. Votre estimation s'élève à 84.750 DT ce mois. La hausse de +14% constatée provient principalement de la vague de chaleur (+4.2°C) ayant généré 3.5h de climatisation supplémentaire par jour. En consignant votre clim à 26°C, vous économiserez immédiatement 38 DT.`;
      sources = ['Compteur STEG MTR-TN-882419 (Données Réelles)', 'STEG Grille Tarifaire BT Tranche 3'];
    } else if (lower.includes('heures creuses') || lower.includes('خافضة') || lower.includes('رخيص') || lower.includes('creuse')) {
      reply = `En Tunisie, le tarif heures creuses STEG s'applique entre 22h00 et 06h00 du matin. Le kWh y est facturé seulement 0.181 DT (contre 0.410 DT en heure de pointe 18h-22h). Il est fortement conseillé de lancer votre lave-linge et chauffe-eau la nuit.`;
      sources = ['Règlement Tarifaire STEG Basse Tension, Article 8', 'Recommandations ANME Sobriété'];
    } else if (lower.includes('solaire') || lower.includes('prosol') || lower.includes('شمسية') || lower.includes('منحة')) {
      reply = `Le programme Prosol Élec subventionné par l'ANME vous offre une prime directe de 500 DT par kWc installé (plafonnée à 1 500 DT) ainsi qu'un crédit bonifié remboursable sur votre facture STEG sur 5 ans. Votre toiture à Tunis permet d'économiser environ 1 120 DT par an avec un retour sur investissement en 3 ans.`;
      sources = ['Fonds de Transition Énergétique (FTE) - Décret 2017', 'Guide ANME Prosol Élec'];
    } else {
      reply = `J'ai bien noté votre demande. VoltTN analyse en continu les 24 gouvernorats et la tarification nationale STEG. N'hésitez pas à me poser une question précise sur vos tranches de facture, votre puissance souscrite ou vos démarches solaires.`;
      sources = ['Base Documentaire VoltTN v2.4'];
    }

    const aiMsg: ChatMessage = {
      id: 'ai-' + Date.now(),
      sender: 'AI',
      text: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources
    };

    this.messages.update(prev => [...prev, aiMsg]);
  }

  toggleVoiceInput(): void {
    if (this.isRecording()) {
      this.isRecording.set(false);
      return;
    }

    this.isRecording.set(true);
    this.notifService.showToast('Microphone Actif', 'Parlez maintenant en Français, Arabe ou Darija...', 'INFO');

    // Simulation de transcription vocale
    setTimeout(() => {
      this.isRecording.set(false);
      const sampleQueries = [
        'Pourquoi ma facture est élevée ce mois ?',
        'وقتاش يبدا رخيص الضو في الليل ؟',
        'Comment bénéficier de la prime ANME Prosol ?'
      ];
      this.userInput = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
      this.sendMessage();
    }, 2500);
  }

  rateAnswer(msg: ChatMessage, rating: 'UP' | 'DOWN'): void {
    msg.feedback = rating;
    this.notifService.showToast(
      rating === 'UP' ? 'Merci pour votre retour !' : 'Retour enregistré',
      rating === 'UP' ? 'Votre évaluation aide à améliorer les réponses du modèle.' : 'Notre équipe analysera cette réponse.',
      'SUCCESS'
    );
  }
}
