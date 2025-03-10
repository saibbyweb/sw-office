import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

@Injectable()
export class SocketManagerService {
  private userSocketMap: Map<string, string> = new Map(); // userId -> socketId
  public readonly onUsersChange = new EventEmitter();

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
    this.logAllConnectedUsers();

    // Emit event to notify that the user socket map has changed
    this.onUsersChange.emit('change');
  }

  removeUserSocket(userId: string) {
    console.log(`[SocketManagerService] Removing socket for user ${userId}`);
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      console.log(
        `[SocketManagerService] Removed socket ${socketId} for user ${userId}`,
      );
      this.userSocketMap.delete(userId);

      // Emit event to notify that the user socket map has changed
      this.onUsersChange.emit('change');
    } else {
      console.log(`[SocketManagerService] No socket found for user ${userId}`);
    }
    this.logAllConnectedUsers();
  }

  getUserSocketId(userId: string): string | undefined {
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      console.log(
        `[SocketManagerService] Found socket ${socketId} for user ${userId}`,
      );
    } else {
      console.log(
        `[SocketManagerService] ⚠️ No socket found for user ${userId} - this might indicate a disconnected user or GraphQL playground usage`,
      );
    }
    return socketId;
  }

  hasAuthenticatedSocket(userId: string): boolean {
    const hasSocket = this.userSocketMap.has(userId);
    console.log(
      `[SocketManagerService] User ${userId} ${hasSocket ? 'has' : 'does not have'} an authenticated socket connection`,
    );
    if (!hasSocket) {
      console.log(
        `[SocketManagerService] ⚠️ No authenticated socket for user ${userId} - if using GraphQL playground, this is expected`,
      );
    }
    return hasSocket;
  }

  logAllConnectedUsers() {
    const connectedCount = this.userSocketMap.size;
    console.log(
      `[SocketManagerService] Currently connected users (${connectedCount} total):`,
    );
    if (connectedCount === 0) {
      console.log('  No users connected');
    } else {
      this.userSocketMap.forEach((socketId, userId) => {
        console.log(`  - User ${userId} connected with socket ${socketId}`);
      });
    }
  }

  getConnectedUsers(): string[] {
    console.log('[SocketManagerService] Getting list of connected users');
    return Array.from(this.userSocketMap.keys());
  }
}
