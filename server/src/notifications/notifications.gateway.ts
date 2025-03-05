import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { SocketManagerService } from './socket-manager.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly socketManager: SocketManagerService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // The userId will be attached to socket in handleAuth
    const userId = client.data.userId;
    if (userId) {
      this.socketManager.removeUserSocket(userId);
    }
  }

  @SubscribeMessage('auth')
  handleAuth(client: Socket, token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const userId = decoded.sub;

      // Store userId in socket data for later use
      client.data.userId = userId;

      // Register the socket
      this.socketManager.registerUserSocket(userId, client.id);

      return { status: 'authenticated' };
    } catch (error) {
      client.disconnect();
      return { status: 'error', message: 'Authentication failed' };
    }
  }

  sendNotificationToClient(socketId: string, notification: any) {
    this.server.to(socketId).emit('notification', notification);
  }
}
