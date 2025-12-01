import { Module } from '@nestjs/common';
import { WorkExceptionService } from './work-exception.service';
import { WorkExceptionResolver } from './work-exception.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [WorkExceptionService, WorkExceptionResolver],
  exports: [WorkExceptionService],
})
export class WorkExceptionModule {}
