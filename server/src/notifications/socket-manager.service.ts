import { Injectable } from '@nestjs/common';

@Injectable()
export class SocketManagerService {
  private userSocketMap: Map<string, string> = new Map(); // userId -> socketId

  registerUserSocket(userId: string, socketId: string) {
    console.log(
      `[SocketManagerService] Registering socket ${socketId} for user ${userId}`,
    );
    const existingSocketId = this.userSocketMap.get(userId);
    if (existingSocketId) {
      console.log(
        `[SocketManagerService] User ${userId} already had socket ${existingSocketId}, replacing with ${socketId}`,
      );
    }
    this.userSocketMap.set(userId, socketId);
  }

  removeUserSocket(userId: string) {
    console.log(`[SocketManagerService] Removing socket for user ${userId}`);
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      console.log(
        `[SocketManagerService] Removed socket ${socketId} for user ${userId}`,
      );
      this.userSocketMap.delete(userId);
    } else {
      console.log(`[SocketManagerService] No socket found for user ${userId}`);
    }
  }

  getUserSocketId(userId: string): string | undefined {
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      console.log(
        `[SocketManagerService] Found socket ${socketId} for user ${userId}`,
      );
    } else {
      console.log(`[SocketManagerService] No socket found for user ${userId}`);
    }
    return socketId;
  }

  hasAuthenticatedSocket(userId: string): boolean {
    const hasSocket = this.userSocketMap.has(userId);
    console.log(
      `[SocketManagerService] User ${userId} ${hasSocket ? 'has' : 'does not have'} an authenticated socket connection`,
    );
    return hasSocket;
  }

  logAllConnectedUsers() {
    console.log('[SocketManagerService] Currently connected users:');
    this.userSocketMap.forEach((socketId, userId) => {
      console.log(`- User ${userId} connected with socket ${socketId}`);
    });
  }
}
