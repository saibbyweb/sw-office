import { Socket } from 'socket.io-client';
import { Notification, SocketEvents } from '../types/socket';
import { initSocket } from './socket';
import { API_HOST } from '../services/env';
import { localNotificationService } from './LocalNotificationService';
import toast from 'react-hot-toast';

class NotificationService {
  private socket: Socket<SocketEvents> | null = null;
  private listeners: Map<string, (data: Notification) => void> = new Map();
  private connectListeners: Set<() => void> = new Set();
  private disconnectListeners: Set<() => void> = new Set();
  private connectedUsersListeners: Map<string, (users: string[]) => void> = new Map();

 

  connect(serverUrl: string = API_HOST) {
    // Check if user is authenticated before connecting
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.log('[NotificationService] No auth token found, skipping connection');
      return;
    }

    // If socket exists but is not connected, try to connect it
    if (this.socket) {
      console.log('[NotificationService] Socket instance exists');
      
      if (this.socket.connected) {
        console.log('[NotificationService] Socket is already connected, skipping connection');
        return;
      } else {
        console.log('[NotificationService] Socket exists but not connected, connecting...');
        this.socket.connect();
        return;
      }
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

    this.socket.on('notification', (data: Notification) => {
      console.log('[NotificationService] Received notification:', data);

      // Handle task notifications
      if ('taskId' in data) {
        this.handleTaskNotification(data);
      }

      // Notify all registered listeners
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

    // Connect the socket
    console.log('[NotificationService] Connecting socket');
    this.socket.connect();
  }

  disconnect() {
    if (this.socket) {
      console.log('[NotificationService] Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
    } else {
      console.log('[NotificationService] No socket to disconnect');
    }
  }

  private handleTaskNotification(data: Notification & { taskId: string }) {
    console.log('[NotificationService] Handling task notification:', data);

    switch (data.type) {
      case 'TASK_ASSIGNED':
        // Show OS notification
        localNotificationService.show({
          title: 'New Task Assigned',
          body: data.message,
          bounceDock: true,
          silent: false,
        });

        // Show toast notification
        toast.success(data.message, {
          duration: 5000,
          icon: '📋',
        });
        break;

      case 'TASK_APPROVED':
        localNotificationService.show({
          title: 'Task Approved',
          body: data.message,
          bounceDock: true,
          silent: false,
        });
        toast.success(data.message, { duration: 5000, icon: '✅' });
        break;

      case 'TASK_COMPLETED':
        localNotificationService.show({
          title: 'Task Completed',
          body: data.message,
          bounceDock: false,
          silent: true,
        });
        toast(data.message, { duration: 4000, icon: '🎉' });
        break;

      case 'TASK_REJECTED':
        localNotificationService.show({
          title: 'Task Update',
          body: data.message,
          bounceDock: true,
          silent: false,
        });
        toast.error(data.message, { duration: 5000 });
        break;

      default:
        console.log('[NotificationService] Unknown task notification type:', data.type);
    }
  }

  addNotificationListener(id: string, callback: (data: Notification) => void) {
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