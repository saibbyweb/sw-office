const { ipcRenderer } = window.require('electron');

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  timeoutType?: 'default' | 'never';
  bounceDock?: boolean;
}

interface ShowInfoOptions {
  message: string;
  title?: string;
  silent?: boolean;
  bounceDock?: boolean;
}

class LocalNotificationService {
  private static instance: LocalNotificationService;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): LocalNotificationService {
    if (!LocalNotificationService.instance) {
      LocalNotificationService.instance = new LocalNotificationService();
    }
    return LocalNotificationService.instance;
  }

  public show(options: NotificationOptions) {
    if (!this.isSupported()) {
      console.warn('Notifications are not supported in this environment');
      return;
    }

    // Create a new native notification
    const notification = new window.Notification(options.title, {
      body: options.body,
      silent: options.silent ?? false,
      icon: options.icon
    });

    // Handle notification events
    notification.onclick = () => {
      // Focus the window when notification is clicked
      ipcRenderer.send('focus-window');
    };

    // Bounce dock icon if requested and window is not focused
    if (options.bounceDock) {
      ipcRenderer.send('bounce-dock');
    }

    return notification;
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Notifications are not supported in this environment');
      return false;
    }

    if (window.Notification.permission === 'granted') {
      return true;
    }

    if (window.Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await window.Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  public isSupported(): boolean {
    return 'Notification' in window;
  }

  public showSuccess(message: string, title: string = 'Success') {
    return this.show({
      title,
      body: message,
      silent: false,
      bounceDock: true
    });
  }

  public showError(message: string, title: string = 'Error') {
    return this.show({
      title,
      body: message,
      silent: false,
      bounceDock: true
    });
  }

  public showInfo(options: ShowInfoOptions) {
    const {
      message,
      title = 'Information',
      silent = true,
      bounceDock = true
    } = options;

    return this.show({
      title,
      body: message,
      silent,
      bounceDock
    });
  }
}

// Export a singleton instance
export const localNotificationService = LocalNotificationService.getInstance();

// Export the type for use in other files
export type { NotificationOptions }; 