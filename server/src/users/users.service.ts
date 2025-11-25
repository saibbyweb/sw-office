import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { User } from '../generated-nestjs-typegraphql';
import { UpdateProfileInput } from './dto/update-profile.input';
import { UserProfile } from './dto/user-profile.output';

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

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate task statistics
    const allottedTasks = user.taskAssignments.length;
    const completedTasks = user.taskAssignments.filter(
      (task) => task.status === 'COMPLETED',
    ).length;
    const inProgressTasks = user.taskAssignments.filter(
      (task) => task.status === 'IN_PROGRESS',
    ).length;

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
      statistics: {
        allottedTasks,
        completedTasks,
        inProgressTasks,
      },
    };
  }
}
