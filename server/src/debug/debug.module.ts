import { Module } from '@nestjs/common';
import { DebugController } from './debug.controller';
import { DebugService } from './debug.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DebugResolver } from './debug.resolver';

@Module({
  imports: [PrismaModule],
  controllers: [DebugController],
  providers: [DebugService, DebugResolver],
  exports: [DebugService],
})
export class DebugModule {}
