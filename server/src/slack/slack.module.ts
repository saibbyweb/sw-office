import { Module } from '@nestjs/common';
import { SlackService } from './slack.service';
import { SlackResolver } from './slack.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SlackService, SlackResolver],
  exports: [SlackService],
})
export class SlackModule {}
