import { io, Socket } from 'socket.io-client';

class NotificationService {
  private socket: Socket | null = null;
  private listeners: Map<string, (data: any) => void> = new Map();
  private connectListeners: Set<() => void> = new Set();
  private disconnectListeners: Set<() => void> = new Set();

  connect(serverUrl: string = 'http://localhost:3000') {
    if (this.socket) {
      return;
    }

    this.socket = io(serverUrl);

    this.socket.on('connect', () => {
      console.log('Connected to notification server');
      // Send auth token after connection
      const token = localStorage.getItem('token'); // Or however you store your JWT
      if (token) {
        this.socket.emit('auth', token, (response: { status: string; message?: string }) => {
          if (response.status === 'authenticated') {
            console.log('Socket authenticated');
          } else {
            console.error('Socket authentication failed:', response.message);
            this.disconnect();
          }
        });
      }
      this.connectListeners.forEach(listener => listener());
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification server');
      this.disconnectListeners.forEach(listener => listener());
    });

    this.socket.on('notification', (data) => {
      this.listeners.forEach((callback) => {
        callback(data);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  addNotificationListener(id: string, callback: (data: any) => void) {
    this.listeners.set(id, callback);
  }

  removeNotificationListener(id: string) {
    this.listeners.delete(id);
  }

  onConnectionChange(onConnect: () => void, onDisconnect: () => void) {
    this.connectListeners.add(onConnect);
    this.disconnectListeners.add(onDisconnect);
    
    // If already connected, trigger the connect callback immediately
    if (this.socket?.connected) {
      onConnect();
    }
  }

  offConnectionChange(onConnect: () => void, onDisconnect: () => void) {
    this.connectListeners.delete(onConnect);
    this.disconnectListeners.delete(onDisconnect);
  }
}

export const notificationService = new NotificationService(); 