import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { SocketManagerService } from './socket-manager.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [NotificationsGateway, SocketManagerService],
  exports: [NotificationsGateway, SocketManagerService],
})
export class NotificationsModule {}
