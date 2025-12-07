import { Module } from '@nestjs/common';
import { DailyOutputScoreService } from './daily-output-score.service';
import { DailyOutputScoreResolver } from './daily-output-score.resolver';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [DailyOutputScoreService, DailyOutputScoreResolver],
  exports: [DailyOutputScoreService],
})
export class DailyOutputScoreModule {}
