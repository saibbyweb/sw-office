import { PrismaClient } from '@prisma/client';
import type { PrismaService } from '../database/prisma.service';

/**
 * Migration Script: Populate completedSessionId for existing completed tasks
 *
 * This script:
 * 1. Finds all tasks with status = 'COMPLETED' that don't have completedSessionId
 * 2. Uses the task's completedDate timestamp to find the session that was active at that time
 * 3. Sets completedSessionId field
 *
 * IMPORTANT: Review this script before running!
 * Run with: npx ts-node src/migrations/populate-task-completion-fields.ts
 */

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

async function findSessionForTaskCompletion(
  prisma: PrismaClient | PrismaService,
  userId: string,
  completedTimestamp: Date,
): Promise<string | null> {
  // Find sessions for this user that could have included this task completion
  // Session must:
  // 1. Start before or at the completion time
  // 2. End after or at the completion time (or still be active)
  // 3. Belong to the user who completed the task

  const sessions = await prisma.session.findMany({
    where: {
      userId: userId,
      startTime: {
        lte: completedTimestamp, // Session started before/at completion
      },
      OR: [
        {
          endTime: {
            gte: completedTimestamp, // Session ended after/at completion
          },
        },
        {
          endTime: null, // Or session is still active
        },
      ],
    },
    orderBy: {
      startTime: 'desc', // Prefer most recent session
    },
  });

  if (sessions.length === 0) {
    return null;
  }

  // If multiple sessions match, prefer the one with closest start time
  return sessions[0].id;
}

async function migrateTaskCompletionFields(
  prisma: PrismaClient | PrismaService,
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

  console.log(
    '🔍 Finding completed tasks without completedSessionId field...\n',
  );

  // Build where clause
  const whereClause: any = {
    status: 'COMPLETED',
    completedSessionId: { isSet: false }, // MongoDB: Only migrate tasks without completedSessionId
    completedDate: { isSet: true }, // MongoDB: Must have a completedDate to use
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
  prisma.task.findMany().then(console.log);

  // Find all completed tasks that don't have completedSessionId set yet
  const completedTasks = await prisma.task.findMany({
    // where: whereClause,
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    // orderBy: {
    //   completedDate: 'desc',
    // },
  });

  stats.totalCompleted = completedTasks.length;

  console.log(`Found ${completedTasks.length} completed tasks to migrate\n`);

  if (completedTasks.length === 0) {
    console.log('✅ No tasks to migrate!');
    return stats;
  }

  for (const task of completedTasks) {
    try {
      // Use assignedToId as the user who completed it
      // If no assignee, skip this task
      if (!task.assignedToId) {
        console.log(
          `⚠️  Task "${task.title}" (${task.id}) has no assignedTo, skipping...`,
        );
        stats.errors++;
        continue;
      }

      // Use completedDate as the completion time
      const completionTime = task.completedDate!;

      // Find the session this task was completed in
      const sessionId = await findSessionForTaskCompletion(
        prisma,
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
        // Actually update the task
        await prisma.task.update({
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

  return stats;
}

async function main() {
  console.log('====================================');
  console.log('Task Completion Fields Migration');
  console.log('====================================\n');

  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');

  // Parse date argument if provided (--date=YYYY-MM-DD)
  const dateArg = args.find((arg) => arg.startsWith('--date='));
  let targetDate: Date | undefined;

  if (dateArg) {
    const dateString = dateArg.split('=')[1];
    targetDate = new Date(dateString);
    if (isNaN(targetDate.getTime())) {
      console.error('❌ Invalid date format. Use --date=YYYY-MM-DD');
      process.exit(1);
    }
  }

  if (dryRun) {
    console.log('🔷 DRY RUN MODE - No changes will be made');
    console.log('   Run with --execute to actually update the database\n');
  } else {
    console.log('⚠️  EXECUTE MODE - Database will be modified!');
    console.log('   Press Ctrl+C to cancel\n');
    // Give user 3 seconds to cancel
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  // Create a standalone Prisma client for CLI execution
  const prisma = new PrismaClient();

  const stats = await migrateTaskCompletionFields(prisma, dryRun, targetDate);

  console.log('\n====================================');
  console.log('Migration Summary');
  console.log('====================================');
  console.log(`Total completed tasks: ${stats.totalCompleted}`);
  console.log(`Successfully migrated: ${stats.successfullyMigrated}`);
  console.log(`No session found: ${stats.noSessionFound}`);
  console.log(`Errors: ${stats.errors}`);

  if (stats.noSessionFound > 0) {
    console.log('\n⚠️  Some tasks could not be matched to a session.');
    console.log(
      '   This might happen if tasks were completed outside of work sessions.',
    );
  }

  if (dryRun && stats.successfullyMigrated > 0) {
    console.log('\n✅ Dry run successful!');
    console.log('   Run with --execute to apply these changes.');
  } else if (!dryRun && stats.successfullyMigrated > 0) {
    console.log('\n✅ Migration completed successfully!');
  }

  await prisma.$disconnect();
}

// Export the function and type for use in services
export { migrateTaskCompletionFields, MigrationStats };

// Only run main if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
