import { Injectable } from '@nestjs/common';

@Injectable()
export class SocketManagerService {
  private userSocketMap: Map<string, string> = new Map(); // userId -> socketId

  registerUserSocket(userId: string, socketId: string) {
    this.userSocketMap.set(userId, socketId);
  }

  removeUserSocket(userId: string) {
    this.userSocketMap.delete(userId);
  }

  getUserSocketId(userId: string): string | undefined {
    return this.userSocketMap.get(userId);
  }
}
