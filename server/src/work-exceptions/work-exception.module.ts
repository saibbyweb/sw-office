import { Module } from '@nestjs/common';
import { WorkExceptionService } from './work-exception.service';
import { WorkExceptionResolver } from './work-exception.resolver';
import { WorkExceptionTimeMigrationService } from './work-exception-time-migration.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    WorkExceptionService,
    WorkExceptionResolver,
    WorkExceptionTimeMigrationService,
  ],
  exports: [WorkExceptionService],
})
export class WorkExceptionModule {}
