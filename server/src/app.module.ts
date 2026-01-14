import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { WorkModule } from './modules/work.module';
import { ProjectsModule } from './projects/projects.module';
import { DebugModule } from './debug/debug.module';
import { AdminModule } from './admin/admin.module';
import { TeamsModule } from './teams/teams.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CallsModule } from './calls/calls.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { UploadModule } from './upload/upload.module';
import { TaskModule } from './tasks/task.module';
import { SlackModule } from './slack/slack.module';
import { WorkExceptionModule } from './work-exceptions/work-exception.module';
import { DailyOutputScoreModule } from './daily-output-score/daily-output-score.module';
import { StabilityIncidentsModule } from './stability-incidents/stability-incidents.module';
import { ExpensesModule } from './expenses/expenses.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    UsersModule,
    AuthModule,
    DatabaseModule,
    WorkModule,
    ProjectsModule,
    DebugModule,
    AdminModule,
    TeamsModule,
    NotificationsModule,
    CallsModule,
    UploadModule,
    TaskModule,
    SlackModule,
    WorkExceptionModule,
    DailyOutputScoreModule,
    StabilityIncidentsModule,
    ExpensesModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
