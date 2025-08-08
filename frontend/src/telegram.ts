declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready(): void;
        expand(): void;
        close(): void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show(): void;
          hide(): void;
          enable(): void;
          disable(): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
        };
        BackButton: {
          isVisible: boolean;
          show(): void;
          hide(): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
        };
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
          notificationOccurred(type: 'error' | 'success' | 'warning'): void;
          selectionChanged(): void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        colorScheme: 'light' | 'dark';
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isClosingConfirmationEnabled: boolean;
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: {
            id: number;
            is_bot?: boolean;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
            added_to_attachment_menu?: boolean;
            allows_write_to_pm?: boolean;
            photo_url?: string;
          };
          receiver?: {
            id: number;
            is_bot?: boolean;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
            added_to_attachment_menu?: boolean;
            allows_write_to_pm?: boolean;
            photo_url?: string;
          };
          chat?: {
            id: number;
            type: 'group' | 'supergroup' | 'channel';
            title: string;
            username?: string;
            photo_url?: string;
          };
          chat_type?: 'sender' | 'private' | 'group' | 'supergroup' | 'channel';
          chat_instance?: string;
          start_param?: string;
          can_send_after?: number;
          auth_date: number;
          hash: string;
        };
        platform: string;
        version: string;
        sendData(data: string): void;
        switchInlineQuery(query: string, choose_chat_types?: string[]): void;
        openLink(url: string, options?: { try_instant_view?: boolean }): void;
        openTelegramLink(url: string): void;
        openInvoice(url: string, callback?: (status: string) => void): void;
        showPopup(params: {
          title?: string;
          message: string;
          buttons?: Array<{
            id?: string;
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
            text: string;
          }>;
        }, callback?: (buttonId: string) => void): void;
        showAlert(message: string, callback?: () => void): void;
        showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
        showScanQrPopup(params: {
          text?: string;
        }, callback?: (data: string) => void): void;
        closeScanQrPopup(): void;
        readTextFromClipboard(callback?: (data: string) => void): void;
        requestWriteAccess(callback?: (access: boolean) => void): void;
        requestContact(callback?: (contact: {
          phone_number: string;
          first_name: string;
          last_name?: string;
          user_id?: number;
          vcard?: string;
        }) => void): void;
        invokeCustomMethod(method: string, params?: any): void;
        setCustomStyle(css: string): void;
        setHeaderColor(color: string): void;
        setBackgroundColor(color: string): void;
        enableClosingConfirmation(): void;
        disableClosingConfirmation(): void;
        onEvent(eventType: string, eventHandler: (event: any) => void): void;
        offEvent(eventType: string, eventHandler: (event: any) => void): void;
      };
    };
  }
}

export class TelegramWebApp {
  private static instance: TelegramWebApp;
  private webApp: typeof window.Telegram.WebApp;

  private constructor() {
    this.webApp = window.Telegram?.WebApp;
    if (this.webApp) {
      this.init();
    }
  }

  public static getInstance(): TelegramWebApp {
    if (!TelegramWebApp.instance) {
      TelegramWebApp.instance = new TelegramWebApp();
    }
    return TelegramWebApp.instance;
  }

  private init(): void {
    // Initialize the Web App
    this.webApp.ready();
    
    // Expand to full height
    this.webApp.expand();
    
    // Set theme colors
    this.webApp.setHeaderColor('#23284a');
    this.webApp.setBackgroundColor('#181c2b');
    
    // Enable closing confirmation
    this.webApp.enableClosingConfirmation();
    
    // Force landscape orientation for better UX
    this.forceLandscapeOrientation();
  }

  private forceLandscapeOrientation(): void {
    // Add CSS to force horizontal layout for mobile
    const style = document.createElement('style');
    style.textContent = `
      /* Force horizontal layout for mobile devices */
      @media screen and (max-width: 926px) {
        .force-horizontal {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          gap: 8px !important;
          overflow-x: auto !important;
          padding: 0 8px !important;
        }
        
        .force-horizontal-card {
          min-width: 140px !important;
          flex-shrink: 0 !important;
          padding: 16px !important;
        }
        
        .force-horizontal-stats {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          gap: 8px !important;
          overflow-x: auto !important;
          padding: 0 8px !important;
        }
        
        .force-horizontal-stats-card {
          min-width: 100px !important;
          flex-shrink: 0 !important;
          padding: 12px !important;
        }
        
        .force-horizontal-stats-card div {
          font-size: 12px !important;
        }
        
        .force-horizontal-stats-card div:last-child {
          font-size: 18px !important;
        }
        
        .force-horizontal-balls {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          gap: 8px !important;
          overflow-x: auto !important;
          padding: 0 8px !important;
          margin: 16px 0 !important;
        }
        
        .force-horizontal-ball-card {
          min-width: 130px !important;
          flex-shrink: 0 !important;
          padding: 16px !important;
        }
        
        .force-horizontal-ball-card img {
          width: 50px !important;
          height: 50px !important;
        }
        
        .force-horizontal-ball-card h3 {
          font-size: 12px !important;
          margin: 6px 0 !important;
        }
        
        .force-horizontal-ball-card p {
          font-size: 10px !important;
          margin: 4px 0 !important;
        }
        
        .force-horizontal-ball-card button {
          font-size: 10px !important;
          padding: 6px 10px !important;
        }
        
        .force-horizontal-ball-card .ball-name {
          font-size: 11px !important;
          margin: 4px 0 !important;
        }
        
        .force-horizontal-ball-card .ball-price {
          font-size: 10px !important;
          margin: 2px 0 !important;
        }
        
        .force-horizontal-title {
          font-size: 24px !important;
          margin-bottom: 16px !important;
          text-align: center !important;
        }
        
        /* Hide scrollbar but keep functionality */
        .force-horizontal::-webkit-scrollbar,
        .force-horizontal-stats::-webkit-scrollbar,
        .force-horizontal-balls::-webkit-scrollbar {
          display: none !important;
        }
        
        .force-horizontal,
        .force-horizontal-stats,
        .force-horizontal-balls {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      }
      
      /* Landscape specific optimizations */
      @media screen and (orientation: landscape) and (max-height: 428px) {
        .force-horizontal-card {
          min-width: 120px !important;
          padding: 12px !important;
        }
        
        .force-horizontal-stats-card {
          min-width: 100px !important;
          padding: 12px !important;
        }
        
        .force-horizontal-ball-card {
          min-width: 140px !important;
          padding: 16px !important;
        }
        
        .force-horizontal-title {
          font-size: 24px !important;
          margin-bottom: 16px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  public isTelegramWebApp(): boolean {
    return !!this.webApp;
  }

  public getTheme(): 'light' | 'dark' {
    return this.webApp?.colorScheme || 'dark';
  }

  public getThemeParams() {
    return this.webApp?.themeParams || {};
  }

  public getUser() {
    return this.webApp?.initDataUnsafe?.user;
  }

  public getChat() {
    return this.webApp?.initDataUnsafe?.chat;
  }

  public showAlert(message: string): Promise<void> {
    return new Promise((resolve) => {
      this.webApp?.showAlert(message, resolve);
    });
  }

  public showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.webApp?.showConfirm(message, resolve);
    });
  }

  public hapticFeedback(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium'): void {
    this.webApp?.HapticFeedback?.impactOccurred(style);
  }

  public notificationFeedback(type: 'error' | 'success' | 'warning' = 'success'): void {
    this.webApp?.HapticFeedback?.notificationOccurred(type);
  }

  public close(): void {
    this.webApp?.close();
  }

  public openLink(url: string): void {
    this.webApp?.openLink(url);
  }

  public sendData(data: string): void {
    this.webApp?.sendData(data);
  }
}

export default TelegramWebApp; 