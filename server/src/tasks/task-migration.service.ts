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
    console.log('🔄 TaskMigrationService initialized');
    console.log('🔍 Running task completion migration check...');

    // Run migration in dry-run mode on startup
    await this.runMigration(true, new Date('2025-12-05'));
  }

  private async findSessionForTaskCompletion(
    userId: string,
    completedTimestamp: Date,
  ): Promise<string | null> {
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
    });

    return sessions.length > 0 ? sessions[0].id : null;
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
    const whereClause: any = {
      status: 'COMPLETED',
      completedSessionId: { isSet: false },
      completedDate: { isSet: true },
    };

    // If targetDate is provided, filter to that specific date
    if (targetDate) {
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.completedDate = {
        gte: startOfDay,
        lte: endOfDay,
      };

      console.log(`📅 Filtering for date: ${targetDate.toDateString()}\n`);
    }

    // console.log('🔎 Where clause:', JSON.stringify(whereClause, null, 2));

    // Find all completed tasks that need migration
    const completedTasks = await this.prisma.task.findMany({
      where: whereClause,
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

        const sessionId = await this.findSessionForTaskCompletion(
          task.assignedToId,
          completionTime,
        );

        if (!sessionId) {
          console.log(
            `⚠️  No session found for task "${task.title}" (${task.id}) completed by ${task.assignedTo?.name || 'Unknown'} at ${completionTime.toISOString()}`,
          );
          stats.noSessionFound++;
          continue;
        }

        console.log(
          `✓ Task: "${task.title}"`,
          `\n  User: ${task.assignedTo?.name || 'Unknown'}`,
          `\n  Completed: ${completionTime.toLocaleString()}`,
          `\n  Session: ${sessionId}`,
        );

        if (!dryRun) {
          await this.prisma.task.update({
            where: { id: task.id },
            data: {
              completedSessionId: sessionId,
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
          sessionId: sessionId,
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
