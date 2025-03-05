import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { SocketManagerService } from './socket-manager.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule],
  providers: [NotificationsGateway, SocketManagerService],
  exports: [NotificationsGateway, SocketManagerService],
})
export class NotificationsModule {}
