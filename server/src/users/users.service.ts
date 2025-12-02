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
      const dayOfWeek = currentDate.getDay();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDays;
  }

  private calculateAvailabilityScore(
    exceptions: any[],
    workingDaysInCycle: number,
  ): number {
    // Define weightages for each exception type (as proportion of a working day)
    const exceptionWeights: Record<string, number> = {
      FULL_DAY_LEAVE: 1.0, // 100% of a working day
      HALF_DAY_LEAVE: 0.5, // 50% of a working day
      SICK_LEAVE: 0.8, // 80% of a working day
      EMERGENCY_LEAVE: 0.7, // 70% of a working day
      WORK_FROM_HOME: 0.15, // 15% of a working day
      LATE_ARRIVAL: 0.3, // 30% of a working day
      EARLY_EXIT: 0.3, // 30% of a working day
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
      const exceptionDaysImpact = exceptionWeights[exception.type] || 0.5;

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

  private getCurrentBillingCycle(): { startDate: Date; endDate: Date } {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let startDate: Date;
    let endDate: Date;

    if (currentDay >= 19) {
      // Current billing cycle: 19th of this month to 18th of next month
      startDate = new Date(currentYear, currentMonth, 19, 0, 0, 0, 0);
      endDate = new Date(currentYear, currentMonth + 1, 18, 23, 59, 59, 999);
    } else {
      // Current billing cycle: 19th of last month to 18th of this month
      startDate = new Date(currentYear, currentMonth - 1, 19, 0, 0, 0, 0);
      endDate = new Date(currentYear, currentMonth, 18, 23, 59, 59, 999);
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

    // Calculate task statistics
    const allottedTasks = user.taskAssignments.length;
    const completedTasks = user.taskAssignments.filter(
      (task) => task.status === 'COMPLETED',
    ).length;
    const inProgressTasks = user.taskAssignments.filter(
      (task) => task.status === 'IN_PROGRESS',
    ).length;

    // Calculate availability score
    const availabilityScore = this.calculateAvailabilityScore(
      workExceptions,
      workingDaysInCycle,
    );

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
      statistics: {
        allottedTasks,
        completedTasks,
        inProgressTasks,
        availabilityScore,
        workingDaysInCycle,
      },
    };
  }

  async getTeamUsers(): Promise<TeamUser[]> {
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

    const { startDate, endDate } = this.getCurrentBillingCycle();
    const workingDaysInCycle = this.calculateWorkingDays(startDate, endDate);

    const teamUsers: TeamUser[] = await Promise.all(
      users.map(async (user) => {
        const workExceptions = await this.prisma.workException.findMany({
          where: {
            userId: user.id,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        const availabilityScore = this.calculateAvailabilityScore(
          workExceptions,
          workingDaysInCycle,
        );

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl || undefined,
          isOnline: user.sessions?.[0] && user.sessions[0].breaks.length === 0,
          currentStatus: user.currentStatus || undefined,
          activeSession: user.sessions?.[0] || undefined,
          availabilityScore,
          workingDaysInCycle,
          workExceptions,
        };
      }),
    );

    return teamUsers;
  }
}
