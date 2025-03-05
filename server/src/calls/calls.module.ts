import { Module } from '@nestjs/common';
import { CallsService } from './calls.service';
import { CallsResolver } from './calls.resolver';
import { NotificationsModule } from '../notifications/notifications.module';
import { TeamsModule } from '../teams/teams.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [NotificationsModule, TeamsModule, AuthModule, UsersModule],
  providers: [CallsService, CallsResolver],
  exports: [CallsService],
})
export class CallsModule {}
