import { Module } from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { BreakService } from '../services/break.service';
import { WorkLogService } from '../services/worklog.service';
import { SessionResolver } from '../resolvers/session.resolver';
import { BreakResolver } from '../resolvers/break.resolver';
import { WorkLogResolver } from '../resolvers/worklog.resolver';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [
    SessionService,
    BreakService,
    WorkLogService,
    SessionResolver,
    BreakResolver,
    WorkLogResolver,
  ],
})
export class WorkModule {}
