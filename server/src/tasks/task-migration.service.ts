import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface MigrationStats {
  totalCompleted: number;
  successfullyMigrated: number;
  noSessionFound: number;
  errors: number;
  tasksMigrated: Array<{
    taskId: string;
    title: string;
    userId: string;
    completedDate: Date;
    sessionId: string;
  }>;
}

@Injectable()
export class TaskMigrationService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Migration already completed - commented out to prevent re-running on startup
    // console.log('🔄 TaskMigrationService initialized');
    // console.log('🔍 Running task completion migration...');
    // console.log('⚠️  EXECUTING MIGRATION - Will update database!\n');
    // await this.runMigration(false);
  }

  private async findSessionForTaskCompletion(
    userId: string,
    completedTimestamp: Date,
  ): Promise<{ id: string; startTime: Date; endTime: Date | null } | null> {
    // Find sessions for this user that could have included this task completion
    const sessions = await this.prisma.session.findMany({
      where: {
        userId: userId,
        startTime: {
          lte: completedTimestamp,
        },
        OR: [
          {
            endTime: {
              gte: completedTimestamp,
            },
          },
          {
            endTime: null,
          },
        ],
      },
      orderBy: {
        startTime: 'desc',
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    });

    return sessions.length > 0 ? sessions[0] : null;
  }

  async runMigration(
    dryRun: boolean = true,
    targetDate?: Date,
  ): Promise<MigrationStats> {
    const stats: MigrationStats = {
      totalCompleted: 0,
      successfullyMigrated: 0,
      noSessionFound: 0,
      errors: 0,
      tasksMigrated: [],
    };

    console.log('🔍 Finding completed tasks without completedSessionId...\n');

    // First check total task count
    const totalTasks = await this.prisma.task.count();
    console.log(`📊 Total tasks in database: ${totalTasks}`);

    const completedTasksCount = await this.prisma.task.count({
      where: { status: 'COMPLETED' },
    });
    console.log(`📊 Completed tasks: ${completedTasksCount}\n`);

    // Build where clause
    const baseWhereClause: any = {
      status: 'COMPLETED',
      completedDate: { isSet: true },
    };

    if (targetDate) {
      // Filter by completedDate (SAME AS DASHBOARD - uses local timezone)
      // Dashboard does: new Date(startDate).setHours(0, 0, 0, 0)
      // This uses local timezone, which then gets converted to UTC
      const start = new Date(targetDate);
      const end = new Date(targetDate);
      const startOfDay = new Date(start.setHours(0, 0, 0, 0));
      const endOfDay = new Date(end.setHours(23, 59, 59, 999));

      baseWhereClause.completedDate = {
        gte: startOfDay,
        lte: endOfDay,
      };

      console.log(
        `📅 Filtering for date (Local TZ): ${targetDate.toISOString().split('T')[0]}`,
      );
      console.log(
        `   Start (Local): ${startOfDay.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      );
      console.log(`   Start (UTC): ${startOfDay.toISOString()}`);
      console.log(
        `   End (Local): ${endOfDay.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      );
      console.log(`   End (UTC): ${endOfDay.toISOString()}\n`);
    }

    // First, check total completed tasks on this date (like Activity Tab)
    const allCompletedTasks = await this.prisma.task.count({
      where: baseWhereClause,
    });

    console.log(`📊 Total completed tasks on this date: ${allCompletedTasks}`);

    // Check how many already have sessions
    const tasksWithSessions = await this.prisma.task.count({
      where: {
        ...baseWhereClause,
        completedSessionId: { isSet: true },
      },
    });

    console.log(
      `📊 Tasks already migrated (have session): ${tasksWithSessions}`,
    );
    console.log(
      `📊 Tasks needing migration: ${allCompletedTasks - tasksWithSessions}\n`,
    );

    // Get tasks that need migration
    const completedTasks = await this.prisma.task.findMany({
      where: {
        ...baseWhereClause,
        completedSessionId: { isSet: false },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        completedDate: 'desc',
      },
    });

    stats.totalCompleted = completedTasks.length;

    console.log(`Found ${completedTasks.length} completed tasks to migrate\n`);

    if (completedTasks.length === 0) {
      console.log('✅ No tasks to migrate!');
      return stats;
    }

    for (const task of completedTasks) {
      try {
        if (!task.assignedToId) {
          console.log(
            `⚠️  Task "${task.title}" (${task.id}) has no assignedTo, skipping...`,
          );
          stats.errors++;
          continue;
        }

        const completionTime = task.completedDate!;

        const session = await this.findSessionForTaskCompletion(
          task.assignedToId,
          completionTime,
        );

        if (!session) {
          // Format date in IST for logging
          const toIST = (date: Date) => {
            const options: Intl.DateTimeFormatOptions = {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
              timeZone: 'Asia/Kolkata',
            };
            return date.toLocaleString('en-IN', options);
          };

          console.log(
            `\n⚠️  NO SESSION FOUND:`,
            `\n  Task ID: ${task.id}`,
            `\n  Task Title: "${task.title}"`,
            `\n  Assigned To: ${task.assignedTo?.name || 'Unknown'} (${task.assignedToId})`,
            `\n  Completed Date (IST): ${toIST(completionTime)}`,
            `\n  Completed Date (UTC): ${completionTime.toISOString()}`,
            `\n  Status: ${task.status}`,
            `\n  Category: ${task.category}`,
            `\n  Points: ${task.points}\n`,
          );
          stats.noSessionFound++;
          continue;
        }

        // Format date in IST (Asia/Kolkata timezone)
        const toIST = (date: Date) => {
          const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata',
          };
          return date.toLocaleString('en-IN', options);
        };

        console.log(
          `✓ Task: "${task.title}"`,
          `\n  User: ${task.assignedTo?.name || 'Unknown'}`,
          `\n  Task Completed: ${toIST(completionTime)}`,
          `\n  Session Started: ${toIST(session.startTime)}`,
          `\n  Session Ended: ${session.endTime ? toIST(session.endTime) : 'Still Active'}`,
          `\n  Session ID: ${session.id}`,
        );

        if (!dryRun) {
          await this.prisma.task.update({
            where: { id: task.id },
            data: {
              completedSessionId: session.id,
            },
          });
          console.log(`  ✅ Updated in database\n`);
        } else {
          console.log(`  ⏭️  Dry run - not updating\n`);
        }

        stats.successfullyMigrated++;
        stats.tasksMigrated.push({
          taskId: task.id,
          title: task.title,
          userId: task.assignedToId,
          completedDate: completionTime,
          sessionId: session.id,
        });
      } catch (error) {
        console.error(
          `❌ Error processing task "${task.title}" (${task.id}):`,
          error,
        );
        stats.errors++;
      }
    }

    console.log('\n====================================');
    console.log('Migration Summary');
    console.log('====================================');
    console.log(`Total completed tasks: ${stats.totalCompleted}`);
    console.log(`Successfully migrated: ${stats.successfullyMigrated}`);
    console.log(`No session found: ${stats.noSessionFound}`);
    console.log(`Errors: ${stats.errors}`);

    if (stats.noSessionFound > 0) {
      console.log('\n⚠️  Some tasks could not be matched to a session.');
    }

    if (dryRun && stats.successfullyMigrated > 0) {
      console.log('\n✅ Dry run successful!');
      console.log('   Call with dryRun=false to apply these changes.');
    } else if (!dryRun && stats.successfullyMigrated > 0) {
      console.log('\n✅ Migration completed successfully!');
    }

    return stats;
  }
}
