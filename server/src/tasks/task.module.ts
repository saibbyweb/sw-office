import { Module } from '@nestjs/common';
import { TaskResolver } from './task.resolver';
import { TaskService } from './task.service';
import { TaskMigrationService } from './task-migration.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { SlackModule } from '../slack/slack.module';
import { OpenAIService } from '../services/openai.service';

@Module({
  imports: [PrismaModule, NotificationsModule, AuthModule, SlackModule],
  providers: [TaskResolver, TaskService, TaskMigrationService, OpenAIService],
  exports: [TaskService, TaskMigrationService],
})
export class TaskModule {}
