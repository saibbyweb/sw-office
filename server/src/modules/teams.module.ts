import { Module } from '@nestjs/common';
import { TeamsResolver } from '../resolvers/teams.resolver';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [TeamsResolver, PrismaService],
})
export class TeamsModule {}
