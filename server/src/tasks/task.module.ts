import { Module } from '@nestjs/common';
import { TaskResolver } from './task.resolver';
import { TaskService } from './task.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { SlackModule } from '../slack/slack.module';

@Module({
  imports: [PrismaModule, NotificationsModule, AuthModule, SlackModule],
  providers: [TaskResolver, TaskService],
  exports: [TaskService],
})
export class TaskModule {}
