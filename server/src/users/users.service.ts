import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { User } from '../generated-nestjs-typegraphql';
import { UpdateProfileInput } from './dto/update-profile.input';
import { UserProfile } from './dto/user-profile.output';
import { TeamUser } from './dto/team-user.output';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        archived: false,
      },
      include: {
        sessions: {
          where: {
            status: 'ACTIVE',
            endTime: null,
          },
          include: {
            project: true,
            breaks: {
              where: {
                endTime: null, // Only get active breaks
              },
            },
          },
          take: 1,
        },
      },
    });

    // Map over users to set isOnline based on active session and break status
    return users.map((user) => ({
      ...user,
      isOnline: user.sessions?.[0] && user.sessions[0].breaks.length === 0,
    })) as User[];
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        ...(input.avatarUrl && { avatarUrl: input.avatarUrl }),
      },
    });

    return user;
  }

  private calculateWorkingDays(startDate: Date, endDate: Date): number {
    let workingDays = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getUTCDay();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return workingDays;
  }

  private calculateAvailabilityScore(
    exceptions: any[],
    workingDaysInCycle: number,
  ): number {
    // Define weightages for each exception type (as proportion of a working day)
    const exceptionWeights: Record<string, number> = {
      UNAUTHORIZED_ABSENCE: 1.5, // 150% of a working day
      FULL_DAY_LEAVE: 1.0, // 100% of a working day
      SICK_LEAVE: 0.8, // 80% of a working day
      EMERGENCY_LEAVE: 0.7, // 70% of a working day
      HALF_DAY_LEAVE: 0.5, // 50% of a working day
      LATE_ARRIVAL: 0.01, // 1% per 30 minutes (fallback if no epoch data)
      EARLY_EXIT: 0.01, // 1% per 30 minutes (fallback if no epoch data)
      WORK_FROM_HOME: 0.15, // 15% of a working day
    };

    // Calculate value per working day
    const valuePerDay = 100 / workingDaysInCycle;

    // Sort exceptions by date to process chronologically
    const sortedExceptions = [...exceptions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    let currentPenalizedDays = 0;
    let totalPenalty = 0;

    // Process each exception chronologically
    sortedExceptions.forEach((exception) => {
      let exceptionDaysImpact = exceptionWeights[exception.type] || 0.5;

      // For late arrival and early exit, calculate weight based on time difference
      if (
        (exception.type === 'LATE_ARRIVAL' || exception.type === 'EARLY_EXIT') &&
        exception.scheduledTimeEpoch &&
        exception.actualTimeEpoch
      ) {
        // Calculate time difference in minutes
        const timeDiffMinutes = Math.abs(
          exception.actualTimeEpoch - exception.scheduledTimeEpoch
        ) / 60;

        // 0.3 penalty score per 30 minutes (0.01 per minute)
        // 30 min = 0.3, 60 min = 0.6, 90 min = 0.9, etc.
        const halfHourUnits = Math.ceil(timeDiffMinutes / 30);
        const penaltyScore = halfHourUnits * 0.3;
        totalPenalty += penaltyScore;
        // Don't accumulate penalty days for late arrival/early exit
        return;
      }

      // For sick leaves, apply penalty linearly (no Fibonacci progression)
      if (exception.type === 'SICK_LEAVE') {
        const penaltyScore = exceptionDaysImpact * valuePerDay;
        totalPenalty += penaltyScore;
        // Don't accumulate penalty days for sick leaves
        return;
      }

      // Fibonacci-like progression: each exception adds (its weight + current penalized days)
      const penaltyDays = exceptionDaysImpact + currentPenalizedDays;
      const penaltyScore = penaltyDays * valuePerDay;

      totalPenalty += penaltyScore;
      currentPenalizedDays += penaltyDays;
    });

    // Calculate final score (100 - penalty, capped at 100)
    const score = Math.min(100, Math.max(0, 100 - totalPenalty));

    // Round to 2 decimal places
    return Math.round(score * 100) / 100;
  }

  private calculateStabilityScore(incidents: any[]): number {
    // If no incidents, perfect score
    if (incidents.length === 0) {
      return 100;
    }

    // Define penalty points based on incident type and severity
    const severityWeights: Record<string, number> = {
      CRITICAL: 15, // 15 points penalty
      HIGH: 10, // 10 points penalty
      MEDIUM: 6, // 6 points penalty
      LOW: 3, // 3 points penalty
      NEGLIGIBLE: 1, // 1 point penalty
    };

    const typeMultipliers: Record<string, number> = {
      PRODUCTION_BUG: 1.5, // Most critical
      SECURITY_VULNERABILITY: 1.5, // Most critical
      DATA_CORRUPTION: 1.4,
      DEPLOYMENT_FAILURE: 1.3,
      BREAKING_CHANGE: 1.3,
      HOTFIX_REQUIRED: 1.2,
      REGRESSION: 1.2,
      PERFORMANCE_ISSUE: 1.0,
      TEST_FAILURE: 0.8,
      CODE_QUALITY_ISSUE: 0.7,
    };

    // Sort incidents by date to process chronologically
    const sortedIncidents = [...incidents].sort(
      (a, b) => a.incidentDate - b.incidentDate,
    );

    let totalPenalty = 0;
    let accumulatedPenalty = 0;

    // Process each incident chronologically with compounding effect
    sortedIncidents.forEach((incident) => {
      const severityPenalty = severityWeights[incident.severity] || 5;
      const typeMultiplier = typeMultipliers[incident.type] || 1.0;

      // Calculate base penalty for this incident
      const basePenalty = severityPenalty * typeMultiplier;

      // Add compounding effect: each incident makes future incidents cost more
      const compoundedPenalty = basePenalty + accumulatedPenalty * 0.1;

      totalPenalty += compoundedPenalty;
      accumulatedPenalty += basePenalty;
    });

    // Calculate final score (100 - penalty, capped between 0 and 100)
    const score = Math.min(100, Math.max(0, 100 - totalPenalty));

    // Round to 2 decimal places
    return Math.round(score * 100) / 100;
  }

  private getCurrentBillingCycle(): { startDate: Date; endDate: Date } {
    const now = new Date();
    const currentDay = now.getUTCDate();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();

    let startDate: Date;
    let endDate: Date;

    if (currentDay >= 19) {
      // Current billing cycle: 19th of this month to 18th of next month (UTC)
      startDate = new Date(Date.UTC(currentYear, currentMonth, 19, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(currentYear, currentMonth + 1, 18, 23, 59, 59, 999));
    } else {
      // Current billing cycle: 19th of last month to 18th of this month (UTC)
      startDate = new Date(Date.UTC(currentYear, currentMonth - 1, 19, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(currentYear, currentMonth, 18, 23, 59, 59, 999));
    }

    return { startDate, endDate };
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        taskSuggestions: {
          include: {
            project: true,
            assignedTo: true,
            approvedBy: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        taskAssignments: {
          include: {
            project: true,
            suggestedBy: true,
            approvedBy: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        sessions: {
          where: {
            status: 'ACTIVE',
            endTime: {
              isSet: false,
            },
          },
          include: {
            project: true,
            breaks: {
              where: {
                endTime: {
                  isSet: false,
                },
              },
            },
            segments: {
              orderBy: {
                startTime: 'asc',
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get current billing cycle
    const { startDate, endDate } = this.getCurrentBillingCycle();

    // Calculate working days in billing cycle (excluding weekends)
    const workingDaysInCycle = this.calculateWorkingDays(startDate, endDate);

    // Fetch work exceptions for current billing cycle
    const workExceptions = await this.prisma.workException.findMany({
      where: {
        userId: userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Fetch stability incidents for current billing cycle
    // Convert dates to epoch timestamps for comparison
    const startEpoch = Math.floor(startDate.getTime() / 1000);
    const endEpoch = Math.floor(endDate.getTime() / 1000);

    const stabilityIncidents = await this.prisma.stabilityIncident.findMany({
      where: {
        userId: userId,
        incidentDate: {
          gte: startEpoch,
          lte: endEpoch,
        },
      },
      include: {
        task: true,
        resolutionTask: true,
        reportedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        incidentDate: 'asc',
      },
    });

    // Calculate task statistics
    const allottedTasks = user.taskAssignments.length;
    const completedTasks = user.taskAssignments.filter(
      (task) => task.status === 'COMPLETED' || task.status === 'PARTIALLY_COMPLETED',
    ).length;
    const inProgressTasks = user.taskAssignments.filter(
      (task) => task.status === 'IN_PROGRESS',
    ).length;

    // Calculate availability score
    const availabilityScore = this.calculateAvailabilityScore(
      workExceptions,
      workingDaysInCycle,
    );

    // Calculate stability score
    const stabilityScore = this.calculateStabilityScore(stabilityIncidents);

    // Fetch ALL tasks for this user to check if any tasks exist in cycle
    const allTasksForUser = await this.prisma.task.findMany({
      where: {
        assignedToId: userId,
      },
      select: {
        id: true,
        title: true,
        score: true,
        status: true,
        createdAt: true,
        completedDate: true,
        completedSessionId: true,
        completedSession: {
          select: {
            startTime: true,
          },
        },
      },
    });

    // Check if user has any tasks assigned/completed in the cycle
    // Use session start time for completed tasks, createdAt for others
    const anyTasksInCycle = allTasksForUser.some(task => {
      // For completed tasks, use session start time (or completedDate as fallback)
      if (task.status === 'COMPLETED' || task.status === 'PARTIALLY_COMPLETED') {
        const relevantDate = task.completedSession?.startTime || task.completedDate;
        return relevantDate && relevantDate >= startDate && relevantDate <= endDate;
      }

      // For non-completed tasks, use createdAt
      return task.createdAt >= startDate && task.createdAt <= endDate;
    });

    // Filter completed tasks by session start time (or completedDate as fallback)
    const completedTasksInCycle = allTasksForUser.filter(task => {
      if (task.status !== 'COMPLETED' && task.status !== 'PARTIALLY_COMPLETED') return false;

      // Prefer session start time if available, otherwise use completed date
      const relevantDate = task.completedSession?.startTime || task.completedDate;

      if (!relevantDate) return false;

      return relevantDate >= startDate && relevantDate <= endDate;
    });

    // Calculate monthly output score
    let monthlyOutputScore: number;

    if (!anyTasksInCycle) {
      // No tasks assigned at all - give 100%
      monthlyOutputScore = 100;
    } else {
      const totalTasksInCycle = completedTasksInCycle.length;
      const ratedTasksInCycle = completedTasksInCycle.filter(
        (task) => task.score !== null,
      );
      const totalRatedTasksInCycle = ratedTasksInCycle.length;

      const scoresArray = ratedTasksInCycle.map(task => task.score);
      const sumOfScores = ratedTasksInCycle.reduce((sum, task) => sum + (task.score || 0), 0);

      monthlyOutputScore =
        totalRatedTasksInCycle > 0
          ? sumOfScores / totalRatedTasksInCycle
          : 0;
    }

    const totalTasksInCycle = completedTasksInCycle.length;
    const totalRatedTasksInCycle = completedTasksInCycle.filter(
      (task) => task.score !== null,
    ).length;

    // LOG: getUserProfile monthly output calculation (only for imran@saibbyweb.com)
    if (user.email === 'imran@saibbyweb.com') {
      console.log('=== getUserProfile Monthly Output Calculation ===');
      console.log('User ID:', userId);
      console.log('User Email:', user.email);
      console.log('Method: getUserProfile');
      console.log('Billing Cycle:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      console.log('Any Tasks In Cycle:', anyTasksInCycle);
      console.log('All Tasks for User:', allTasksForUser.length);
      console.log('All Completed Tasks:', allTasksForUser.filter(t => t.status === 'COMPLETED').length);
      console.log('Completed Tasks in Cycle (after filtering):', totalTasksInCycle);
      console.log('Rated Tasks in Cycle:', totalRatedTasksInCycle);
      console.log('Tasks Details:', completedTasksInCycle.map(t => ({
        id: t.id,
        title: t.title,
        score: t.score,
        completedDate: t.completedDate?.toISOString(),
        sessionStartTime: t.completedSession?.startTime?.toISOString(),
        usedDate: (t.completedSession?.startTime || t.completedDate)?.toISOString(),
      })));
      console.log('Monthly Output Score:', monthlyOutputScore);
      console.log('=== End getUserProfile Calculation ===\n');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl || undefined,
      isOnline: user.sessions?.[0] && user.sessions[0].breaks.length === 0,
      currentStatus: user.currentStatus || undefined,
      createdAt: user.createdAt,
      taskAssignments: user.taskAssignments,
      sessions: user.sessions,
      activeSession: user.sessions?.[0] || undefined,
      workExceptions: workExceptions,
      stabilityIncidents: stabilityIncidents as any,
      statistics: {
        allottedTasks,
        completedTasks,
        inProgressTasks,
        availabilityScore,
        stabilityScore,
        workingDaysInCycle,
        monthlyOutputScore,
        totalTasksInCycle,
        totalRatedTasksInCycle,
      },
    };
  }

  async getTeamUsers(startDate?: Date, endDate?: Date, forceCalculate: boolean = false): Promise<TeamUser[]> {
    const users = await this.prisma.user.findMany({
      where: {
        archived: false,
      },
      include: {
        sessions: {
          where: {
            status: 'ACTIVE',
            endTime: null,
          },
          include: {
            project: true,
            breaks: {
              where: {
                endTime: null,
              },
            },
          },
          take: 1,
        },
      },
    });

    // Use provided dates or current billing cycle
    const billingCycle = startDate && endDate
      ? { startDate, endDate }
      : this.getCurrentBillingCycle();

    const cycleStartDate = billingCycle.startDate;
    const cycleEndDate = billingCycle.endDate;
    const workingDaysInCycle = this.calculateWorkingDays(cycleStartDate, cycleEndDate);

    // Check if snapshots exist for this billing cycle (only if not forcing calculation)
    if (!forceCalculate) {
      const snapshots = await this.prisma.payoutSnapshot.findMany({
        where: {
          billingCycleStart: cycleStartDate,
          billingCycleEnd: cycleEndDate,
        },
      });

      // If snapshots exist for all users, return snapshot data
      if (snapshots.length === users.length) {
      return snapshots.map((snapshot) => {
        const user = users.find((u) => u.id === snapshot.userId);
        return {
          id: snapshot.userId,
          name: user?.name || '',
          email: user?.email || '',
          avatarUrl: user?.avatarUrl || undefined,
          isOnline: user?.sessions?.[0] && user.sessions[0].breaks.length === 0,
          compensationINR: snapshot.baseCompensationINR,
          availabilityScore: snapshot.availabilityScore,
          stabilityScore: snapshot.stabilityScore,
          monthlyOutputScore: snapshot.monthlyOutputScore,
          workingDaysInCycle: snapshot.workingDaysInCycle,
          workExceptions: [],
          stabilityIncidents: [],
        };
      });
      }
    }

    // Otherwise, calculate live data
    const startEpoch = Math.floor(cycleStartDate.getTime() / 1000);
    const endEpoch = Math.floor(cycleEndDate.getTime() / 1000);

    const teamUsers: TeamUser[] = await Promise.all(
      users.map(async (user) => {
        const workExceptions = await this.prisma.workException.findMany({
          where: {
            userId: user.id,
            date: {
              gte: cycleStartDate,
              lte: cycleEndDate,
            },
          },
        });

        const stabilityIncidents = await this.prisma.stabilityIncident.findMany(
          {
            where: {
              userId: user.id,
              incidentDate: {
                gte: startEpoch,
                lte: endEpoch,
              },
            },
            orderBy: {
              incidentDate: 'asc',
            },
          },
        );

        // Fetch ALL tasks for this user to check for tasks in cycle
        const allTasksForUser = await this.prisma.task.findMany({
          where: {
            assignedToId: user.id,
          },
          select: {
            id: true,
            title: true,
            score: true,
            status: true,
            createdAt: true,
            completedDate: true,
            completedSessionId: true,
            completedSession: {
              select: {
                startTime: true,
              },
            },
          },
        });

        // Check if user has any tasks assigned/completed in the cycle
        // Use session start time for completed tasks, createdAt for others
        const anyTasksInCycle = allTasksForUser.some(task => {
          // For completed tasks, use session start time (or completedDate as fallback)
          if (task.status === 'COMPLETED') {
            const relevantDate = task.completedSession?.startTime || task.completedDate;
            return relevantDate && relevantDate >= cycleStartDate && relevantDate <= cycleEndDate;
          }

          // For non-completed tasks, use createdAt
          return task.createdAt >= cycleStartDate && task.createdAt <= cycleEndDate;
        });

        // Filter completed tasks by session start time (or completedDate as fallback)
        // This ensures tasks completed after midnight but worked on during the cycle are counted
        const completedTasksInCycle = allTasksForUser.filter(task => {
          if (task.status !== 'COMPLETED') return false;

          // Prefer session start time if available, otherwise use completed date
          const relevantDate = task.completedSession?.startTime || task.completedDate;

          if (!relevantDate) return false;

          return relevantDate >= cycleStartDate && relevantDate <= cycleEndDate;
        });

        const availabilityScore = this.calculateAvailabilityScore(
          workExceptions,
          workingDaysInCycle,
        );

        const stabilityScore =
          this.calculateStabilityScore(stabilityIncidents);

        // Calculate monthly output score
        let monthlyOutputScore: number;

        if (!anyTasksInCycle) {
          // No tasks assigned at all - give 100%
          monthlyOutputScore = 100;
        } else {
          const ratedTasksInCycle = completedTasksInCycle.filter(
            (task) => task.score !== null,
          );
          const scoresArray = ratedTasksInCycle.map(task => task.score);
          const sumOfScores = ratedTasksInCycle.reduce((sum, task) => sum + (task.score || 0), 0);

          if (ratedTasksInCycle.length > 0) {
            // Has rated tasks - calculate average
            monthlyOutputScore = sumOfScores / ratedTasksInCycle.length;
          } else {
            // Has tasks but none are rated yet - give 100% (benefit of doubt)
            monthlyOutputScore = 100;
          }

          // LOG: getTeamUsers monthly output calculation (only for imran@saibbyweb.com)
          if (user.email === 'imran@saibbyweb.com') {
            console.log('=== getTeamUsers Monthly Output Calculation ===');
            console.log('User ID:', user.id);
            console.log('User Name:', user.name);
            console.log('User Email:', user.email);
            console.log('Method: getTeamUsers');
            console.log('Billing Cycle:', {
              startDate: cycleStartDate.toISOString(),
              endDate: cycleEndDate.toISOString(),
            });
            console.log('Any Tasks In Cycle:', anyTasksInCycle);
            console.log('All Tasks for User:', allTasksForUser.length);
            console.log('All Completed Tasks:', allTasksForUser.filter(t => t.status === 'COMPLETED').length);
            console.log('Completed Tasks in Cycle (after filtering):', completedTasksInCycle.length);
            console.log('Rated Tasks in Cycle:', ratedTasksInCycle.length);
            console.log('Tasks Details:', completedTasksInCycle.map(t => ({
              id: t.id,
              title: t.title,
              score: t.score,
              completedDate: t.completedDate?.toISOString(),
              sessionStartTime: t.completedSession?.startTime?.toISOString(),
              usedDate: (t.completedSession?.startTime || t.completedDate)?.toISOString(),
            })));
            console.log('Scores Array:', scoresArray);
            console.log('Sum of Scores:', sumOfScores);
            console.log('Monthly Output Score:', monthlyOutputScore);
            console.log('=== End getTeamUsers Calculation ===\n');
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl || undefined,
          isOnline: user.sessions?.[0] && user.sessions[0].breaks.length === 0,
          currentStatus: user.currentStatus || undefined,
          activeSession: user.sessions?.[0] || undefined,
          compensationINR: user.compensationINR || undefined,
          availabilityScore,
          stabilityScore,
          monthlyOutputScore,
          workingDaysInCycle,
          workExceptions,
          stabilityIncidents: stabilityIncidents as any,
        };
      }),
    );

    return teamUsers;
  }

  async syncPayoutSnapshots(
    startDate: Date,
    endDate: Date,
    syncedById: string | null,
  ): Promise<void> {
    // Get team users data for the billing cycle
    const teamUsers = await this.getTeamUsers(startDate, endDate);

    // Upsert snapshot for each user
    for (const teamUser of teamUsers) {
      const outputMultiplier = teamUser.monthlyOutputScore / 100;
      const availabilityMultiplier = teamUser.availabilityScore / 100;
      const stabilityMultiplier = teamUser.stabilityScore / 100;

      const baseCompensation = teamUser.compensationINR || 0;
      const expectedPayout =
        baseCompensation *
        outputMultiplier *
        availabilityMultiplier *
        stabilityMultiplier;
      const difference = expectedPayout - baseCompensation;

      await this.prisma.payoutSnapshot.upsert({
        where: {
          userId_billingCycleStart_billingCycleEnd: {
            userId: teamUser.id,
            billingCycleStart: startDate,
            billingCycleEnd: endDate,
          },
        },
        create: {
          userId: teamUser.id,
          billingCycleStart: startDate,
          billingCycleEnd: endDate,
          monthlyOutputScore: teamUser.monthlyOutputScore,
          availabilityScore: teamUser.availabilityScore,
          stabilityScore: teamUser.stabilityScore,
          baseCompensationINR: baseCompensation,
          expectedPayoutINR: expectedPayout,
          differenceINR: difference,
          workingDaysInCycle: teamUser.workingDaysInCycle,
          syncedById: syncedById,
        },
        update: {
          monthlyOutputScore: teamUser.monthlyOutputScore,
          availabilityScore: teamUser.availabilityScore,
          stabilityScore: teamUser.stabilityScore,
          baseCompensationINR: baseCompensation,
          expectedPayoutINR: expectedPayout,
          differenceINR: difference,
          workingDaysInCycle: teamUser.workingDaysInCycle,
          syncedById: syncedById,
          snapshotDate: new Date(), // Update snapshot date on resync
        },
      });
    }
  }

  async getPayoutSnapshots(
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    return this.prisma.payoutSnapshot.findMany({
      where: {
        billingCycleStart: startDate,
        billingCycleEnd: endDate,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        syncedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }
}
