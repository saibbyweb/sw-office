import { Module } from '@nestjs/common';
import { StabilityIncidentsService } from './stability-incidents.service';
import { StabilityIncidentsResolver } from './stability-incidents.resolver';
import { PrismaService } from '../database/prisma.service';

@Module({
  providers: [StabilityIncidentsService, StabilityIncidentsResolver, PrismaService],
  exports: [StabilityIncidentsService],
})
export class StabilityIncidentsModule {}
