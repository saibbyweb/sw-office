import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminResolver } from './admin.resolver';
import { SessionService } from 'src/services/session.service';
import { UsersModule } from 'src/users/users.module';
import { WorkLogService } from 'src/services/worklog.service';

@Module({
  imports: [UsersModule],
  controllers: [AdminController],
  providers: [
    WorkLogService,
    SessionService,
    AdminService,
    PrismaService,
    AdminResolver,
  ],
})
export class AdminModule {}
