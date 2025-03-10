import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketManagerService } from './socket-manager.service';
import { AuthService } from 'src/auth/auth.service';

interface SocketData {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  path: '/socket.io/',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly socketManager: SocketManagerService,
    private readonly authService: AuthService,
  ) {
    // Listen for changes to the user socket map
    this.socketManager.onUsersChange.on('change', () => {
      console.log(
        '[NotificationsGateway] User socket map changed, emitting to all clients',
      );
      this.emitConnectedUsersToAll();
    });
  }

  handleConnection(client: Socket<any, any, any, SocketData>) {
    console.log(`[NotificationsGateway] New client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket<any, any, any, SocketData>) {
    console.log(`[NotificationsGateway] Client disconnected: ${client.id}`);
    // The userId will be attached to socket in handleAuth
    const userId = client.data.userId;
    if (userId) {
      console.log(`[NotificationsGateway] Removing socket for user ${userId}`);
      this.socketManager.removeUserSocket(userId);

      // No need to emit here as the event listener will handle it
    } else {
      console.log(
        `[NotificationsGateway] No user ID found for disconnected socket ${client.id}`,
      );
    }
  }

  @SubscribeMessage('auth')
  handleAuth(client: Socket<any, any, any, SocketData>, token: string) {
    console.log(`[NotificationsGateway] Authenticating socket ${client.id}`);
    try {
      // const decoded = this.jwtService.verify<JwtPayload>(token);
      // const userId = decoded.sub;

      const decoded = this.authService.verifyToken(token);
      const userId = decoded.sub;

      console.log(
        `[NotificationsGateway] Socket ${client.id} authenticated for user ${userId}`,
      );

      // Store userId in socket data for later use
      client.data.userId = userId;

      // Register the socket
      this.socketManager.registerUserSocket(userId, client.id);

      // No need to emit here as the event listener will handle it

      return { status: 'authenticated' };
    } catch (error) {
      console.error(
        `[NotificationsGateway] Authentication failed for socket ${client.id}:`,
        error,
      );
      client.disconnect();
      return { status: 'error', message: 'Authentication failed' };
    }
  }

  // New method to emit connected users to all clients
  emitConnectedUsersToAll() {
    console.log(
      `[NotificationsGateway] Emitting connected users to all clients`,
    );
    const connectedUsers = this.socketManager.getConnectedUsers();
    this.server.emit('connected_users', connectedUsers);
  }

  // Modify the existing emitConnectedUsers method to use the new method
  emitConnectedUsers(socketId: string) {
    console.log(
      `[NotificationsGateway] Emitting connected users to socket ${socketId}`,
    );
    const connectedUsers = this.socketManager.getConnectedUsers();
    this.server.to(socketId).emit('connected_users', connectedUsers);
  }

  sendNotificationToClient(socketId: string, notification: any) {
    console.log(
      `[NotificationsGateway] Sending notification to socket ${socketId}:`,
      notification,
    );
    this.server.to(socketId).emit('notification', notification);
  }
}
