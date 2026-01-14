import { Module } from '@nestjs/common';
import { BreakAnalyticsService } from '../services/break-analytics.service';
import { BreakAnalyticsResolver } from './break-analytics.resolver';
import { DatabaseModule } from '../database/database.module';
import { OpenAIService } from '../services/openai.service';

@Module({
  imports: [DatabaseModule],
  providers: [BreakAnalyticsService, BreakAnalyticsResolver, OpenAIService],
  exports: [BreakAnalyticsService],
})
export class AnalyticsModule {}
