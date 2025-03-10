import { io, Socket } from 'socket.io-client';
import { AuthResponse, CallNotification, SocketEvents } from '../types/socket';
import { initSocket } from './socket';

class NotificationService {
  private socket: Socket<SocketEvents> | null = null;
  private listeners: Map<string, (data: CallNotification) => void> = new Map();
  private connectListeners: Set<() => void> = new Set();
  private disconnectListeners: Set<() => void> = new Set();
  private connectedUsersListeners: Map<string, (users: string[]) => void> = new Map();

  connect(serverUrl: string = 'http://localhost:3000') {
    if (this.socket) {
      console.log('[NotificationService] Socket already exists, skipping connection');
      return;
    }

    console.log('[NotificationService] Getting shared socket instance');
    this.socket = initSocket();

    this.socket.on('connect', () => {
      console.log('[NotificationService] Connected to server');
      this.connectListeners.forEach(listener => listener());
    });

    this.socket.on('disconnect', () => {
      console.log('[NotificationService] Disconnected from server');
      this.disconnectListeners.forEach(listener => listener());
    });

    this.socket.on('notification', (data: CallNotification) => {
      console.log('[NotificationService] Received notification:', data);
      this.listeners.forEach((callback) => {
        callback(data);
      });
    });

    this.socket.on('connected_users', (users: string[]) => {
      console.log('[NotificationService] Received connected users:', users);
      this.connectedUsersListeners.forEach((callback) => {
        callback(users);
      });
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('[NotificationService] Connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('[NotificationService] Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  addNotificationListener(id: string, callback: (data: CallNotification) => void) {
    console.log('[NotificationService] Adding notification listener:', id);
    this.listeners.set(id, callback);
  }

  removeNotificationListener(id: string) {
    console.log('[NotificationService] Removing notification listener:', id);
    this.listeners.delete(id);
  }

  onConnectionChange(onConnect: () => void, onDisconnect: () => void) {
    console.log('[NotificationService] Adding connection change listeners');
    this.connectListeners.add(onConnect);
    this.disconnectListeners.add(onDisconnect);
    
    // If already connected, trigger the connect callback immediately
    if (this.socket?.connected) {
      console.log('[NotificationService] Socket already connected, triggering connect callback');
      onConnect();
    }
  }

  offConnectionChange(onConnect: () => void, onDisconnect: () => void) {
    console.log('[NotificationService] Removing connection change listeners');
    this.connectListeners.delete(onConnect);
    this.disconnectListeners.delete(onDisconnect);
  }

  addConnectedUsersListener(id: string, callback: (users: string[]) => void) {
    console.log('[NotificationService] Adding connected users listener:', id);
    this.connectedUsersListeners.set(id, callback);
  }

  removeConnectedUsersListener(id: string) {
    console.log('[NotificationService] Removing connected users listener:', id);
    this.connectedUsersListeners.delete(id);
  }
}

export const notificationService = new NotificationService(); 