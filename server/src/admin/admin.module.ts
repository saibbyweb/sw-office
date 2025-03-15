import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminResolver } from './admin.resolver';
import { SessionService } from 'src/services/session.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AdminController],
  providers: [SessionService, AdminService, PrismaService, AdminResolver],
})
export class AdminModule {}
