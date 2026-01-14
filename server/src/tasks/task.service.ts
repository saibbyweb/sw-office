import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Task } from '../generated-nestjs-typegraphql';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { SocketManagerService } from '../notifications/socket-manager.service';
import { SlackService } from '../slack/slack.service';

export interface CreateTaskInput {
  title: string;
  description: string;
  category: string;
  priority: string;
  points: number;
  estimatedHours: number;
  projectId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  points?: number;
  estimatedHours?: number;
  projectId?: string;
}

export interface PaginatedTasksResponse {
  tasks: Task[];
  total: number;
  hasMore: boolean;
  myTasksCount: number;
  availableTasksCount: number;
  suggestedTasksCount: number;
}

export interface TaskFilters {
  searchQuery?: string;
  projectId?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
  unassignedOnly?: boolean;
  myTasksUserId?: string;
}

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly socketManager: SocketManagerService,
    private readonly slackService: SlackService,
  ) {}

  async createTask(input: CreateTaskInput, userId?: string): Promise<Task> {
    return this.prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category as any,
        priority: input.priority as any,
        points: input.points,
        estimatedHours: input.estimatedHours,
        projectId: input.projectId || undefined,
        suggestedById: userId || undefined,
      },
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
      },
    });
  }

  async getAllTasks(
    skip?: number,
    take?: number,
    filters?: TaskFilters,
    userId?: string,
  ): Promise<PaginatedTasksResponse> {
    const includeClause = {
      project: true,
      suggestedBy: true,
      assignedTo: true,
      approvedBy: true,
    };

    const orderByClause = {
      createdAt: 'desc' as const,
    };

    // Build where clause based on filters
    const whereClause: any = {};

    if (filters) {
      // Search query - search in title, description, and assignee name
      if (filters.searchQuery) {
        whereClause.OR = [
          { title: { contains: filters.searchQuery, mode: 'insensitive' } },
          {
            description: { contains: filters.searchQuery, mode: 'insensitive' },
          },
          {
            assignedTo: {
              name: { contains: filters.searchQuery, mode: 'insensitive' },
            },
          },
        ];
      }

      // Project filter
      if (filters.projectId) {
        whereClause.projectId = filters.projectId;
      }

      // Status filter
      if (filters.status) {
        whereClause.status = filters.status;
      }

      // Priority filter
      if (filters.priority) {
        whereClause.priority = filters.priority;
      }

      // My tasks filter
      if (filters.myTasksUserId) {
        whereClause.assignedToId = filters.myTasksUserId;
      }

      // Unassigned only filter
      if (filters.unassignedOnly) {
        whereClause.assignedToId = { isSet: false };
      }

      // Specific user assignment filter
      if (filters.assignedToId) {
        whereClause.assignedToId = filters.assignedToId;
      }
    }

    // Get counts for tabs (always calculated regardless of filters)
    const [myTasksCount, availableTasksCount, suggestedTasksCount] =
      await Promise.all([
        // My tasks count (excluding completed/partially completed)
        userId
          ? this.prisma.task.count({
              where: {
                assignedToId: userId,
                status: { notIn: ['COMPLETED', 'PARTIALLY_COMPLETED'] },
              },
            })
          : 0,
        // Available tasks count (approved and unassigned)
        this.prisma.task.count({
          where: { status: 'APPROVED', assignedToId: { isSet: false } },
        }),
        // Suggested tasks count
        this.prisma.task.count({ where: { status: 'SUGGESTED' } }),
      ]);

    // Get total count with filters
    const total = await this.prisma.task.count({ where: whereClause });

    // Get paginated tasks with filters
    const tasks = await this.prisma.task.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: orderByClause,
      skip: skip || 0,
      take: take || undefined,
    });

    // Calculate if there are more results
    const hasMore =
      skip !== undefined && take !== undefined ? skip + take < total : false;

    return {
      tasks,
      total,
      hasMore,
      myTasksCount,
      availableTasksCount,
      suggestedTasksCount,
    };
  }

  async getTaskById(id: string): Promise<Task | null> {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
      },
    });
  }

  async assignTask(taskId: string, userId: string | null): Promise<Task> {
    console.log(
      `[TaskService] assignTask called - taskId: ${taskId}, userId: ${userId}`,
    );

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: userId,
      },
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
      },
    });

    console.log(
      `[TaskService] Task updated, assignedTo:`,
      task.assignedTo
        ? {
            id: task.assignedTo.id,
            name: task.assignedTo.name,
            slackUserId: task.assignedTo.slackUserId,
          }
        : 'none',
    );

    // Send real-time notification to the assigned user
    if (userId) {
      const socketId = this.socketManager.getUserSocketId(userId);
      if (socketId) {
        console.log(
          `[TaskService] Sending task assignment notification to user ${userId}`,
        );
        this.notificationsGateway.sendNotificationToClient(socketId, {
          type: 'TASK_ASSIGNED',
          taskId: task.id,
          taskTitle: task.title,
          message: `You've been assigned to: ${task.title}`,
          priority: task.priority,
        });
      } else {
        console.log(
          `[TaskService] User ${userId} is not connected, skipping WebSocket notification`,
        );
      }

      // Send Slack notification if user has Slack ID
      if (task.assignedTo?.slackUserId) {
        console.log(
          `[TaskService] User has Slack ID: ${task.assignedTo.slackUserId}, sending Slack notification`,
        );
        try {
          const blocks = this.slackService.buildTaskAssignmentBlocks({
            title: task.title,
            description: task.description,
            priority: task.priority,
            points: task.points,
            estimatedHours: task.estimatedHours,
          });

          await this.slackService.sendDirectMessage(
            task.assignedTo.slackUserId,
            `New task assigned: ${task.title}`, // Fallback text
            blocks,
          );
          console.log(
            `[TaskService] ✅ Successfully sent Slack notification to user ${userId}`,
          );
        } catch (error) {
          console.error(
            `[TaskService] ❌ Failed to send Slack notification:`,
            error,
          );
          if (error.response) {
            console.error(
              `[TaskService] Slack API response:`,
              error.response.data,
            );
          }
        }
      } else {
        console.log(
          `[TaskService] User does not have Slack ID set, skipping Slack notification`,
        );
      }
    }

    return task;
  }

  async approveTask(taskId: string, approvedById: string): Promise<Task> {
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'APPROVED',
        approvedById: approvedById,
        approvedDate: new Date(),
      },
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
      },
    });

    // Send real-time notification to the user who suggested the task
    if (task.suggestedById) {
      const socketId = this.socketManager.getUserSocketId(task.suggestedById);
      if (socketId) {
        console.log(
          `[TaskService] Sending task approval notification to user ${task.suggestedById}`,
        );
        this.notificationsGateway.sendNotificationToClient(socketId, {
          type: 'TASK_APPROVED',
          taskId: task.id,
          taskTitle: task.title,
          message: `Your suggested task "${task.title}" has been approved!`,
          priority: task.priority,
        });
      } else {
        console.log(
          `[TaskService] User ${task.suggestedById} is not connected, skipping notification`,
        );
      }

      // Send Slack notification if user has Slack ID
      if (task.suggestedBy?.slackUserId) {
        try {
          const approverName = task.approvedBy?.name || 'Admin';
          const blocks = this.slackService.buildTaskApprovalBlocks({
            title: task.title,
            description: task.description,
            priority: task.priority,
            points: task.points,
            estimatedHours: task.estimatedHours,
            approverName,
          });

          await this.slackService.sendDirectMessage(
            task.suggestedBy.slackUserId,
            `Task approved: ${task.title}`, // Fallback text
            blocks,
          );
          console.log(
            `[TaskService] Sent Slack notification to user ${task.suggestedById}`,
          );
        } catch (error) {
          console.error(
            `[TaskService] Failed to send Slack notification:`,
            error,
          );
        }
      }
    }

    return task;
  }

  async unapproveTask(taskId: string): Promise<Task> {
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'SUGGESTED',
        approvedById: null,
        approvedDate: null,
      },
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
      },
    });
  }

  async selfApproveTask(taskId: string, userId: string): Promise<Task> {
    // First, fetch the task to verify the user is the one who suggested it
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { suggestedById: true, status: true },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    if (task.suggestedById !== userId) {
      throw new Error('You can only self-approve tasks you suggested');
    }

    if (task.status !== 'SUGGESTED') {
      throw new Error('Task must be in SUGGESTED status to self-approve');
    }

    // Approve the task with the same user as both suggester and approver
    const approvedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        approvedDate: new Date(),
      },
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
      },
    });

    return approvedTask;
  }

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
    const updateData: any = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.category !== undefined)
      updateData.category = input.category as any;
    if (input.priority !== undefined)
      updateData.priority = input.priority as any;
    if (input.points !== undefined) updateData.points = input.points;
    if (input.estimatedHours !== undefined)
      updateData.estimatedHours = input.estimatedHours;
    if (input.projectId !== undefined)
      updateData.projectId = input.projectId || null;

    return this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
      },
    });
  }

  async editSuggestedTask(
    taskId: string,
    input: UpdateTaskInput,
    userId: string,
  ): Promise<Task> {
    // First check if the task exists and was suggested by this user
    const existingTask = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { suggestedById: true, status: true },
    });

    if (!existingTask) {
      throw new Error('Task not found');
    }

    if (existingTask.suggestedById !== userId) {
      throw new Error('You can only edit tasks that you suggested');
    }

    // Only allow editing if task is not yet assigned or approved
    if (existingTask.status !== 'SUGGESTED') {
      throw new Error('Cannot edit task that has been assigned or approved');
    }

    const updateData: any = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.category !== undefined)
      updateData.category = input.category as any;
    if (input.priority !== undefined)
      updateData.priority = input.priority as any;
    if (input.points !== undefined) updateData.points = input.points;
    if (input.estimatedHours !== undefined)
      updateData.estimatedHours = input.estimatedHours;
    if (input.projectId !== undefined)
      updateData.projectId = input.projectId || null;

    return this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
      },
    });
  }

  async deleteSuggestedTask(taskId: string, userId: string): Promise<boolean> {
    // First check if the task exists and was suggested by this user
    const existingTask = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { suggestedById: true, status: true },
    });

    if (!existingTask) {
      throw new Error('Task not found');
    }

    if (existingTask.suggestedById !== userId) {
      throw new Error('You can only delete tasks that you suggested');
    }

    // Only allow deletion if task is not yet assigned or approved
    if (existingTask.status !== 'SUGGESTED') {
      throw new Error('Cannot delete task that has been assigned or approved');
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    return true;
  }

  async unassignTask(taskId: string, userId: string): Promise<Task> {
    // First check if the task exists
    const existingTask = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        assignedToId: true,
        suggestedById: true,
        status: true
      },
    });

    if (!existingTask) {
      throw new Error('Task not found');
    }

    if (existingTask.assignedToId !== userId) {
      throw new Error('You can only un-assign tasks assigned to you');
    }

    if (existingTask.suggestedById !== userId) {
      throw new Error('You can only un-assign tasks you suggested yourself');
    }

    // Only allow un-assignment if task has not been started yet
    if (existingTask.status !== 'APPROVED') {
      throw new Error('Cannot un-assign task that has been started (status must be APPROVED)');
    }

    // Un-assign and un-approve the task (revert to SUGGESTED status)
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: null,
        approvedById: null,
        approvedDate: null,
        status: 'SUGGESTED',
      },
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
      },
    });

    return updatedTask;
  }

  async completeTask(taskId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { assignedToId: true },
    });

    const updateData: any = {
      status: 'COMPLETED',
      completedDate: new Date(),
    };

    // Find user's active session to link the completion
    if (task?.assignedToId) {
      const activeSession = await this.prisma.session.findFirst({
        where: {
          userId: task.assignedToId,
          status: 'ACTIVE',
        },
        orderBy: {
          startTime: 'desc',
        },
      });

      if (activeSession) {
        updateData.completedSessionId = activeSession.id;
      }
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
      },
    });
  }

  async uncompleteTask(taskId: string): Promise<Task> {
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'APPROVED',
        completedDate: null,
      },
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
      },
    });
  }

  async updateTaskStatus(
    taskId: string,
    status: string,
    userId: string,
  ): Promise<Task> {
    const updateData: any = { status };

    // Set startedDate when status changes to IN_PROGRESS for the first time
    if (status === 'IN_PROGRESS') {
      const existingTask = await this.prisma.task.findUnique({
        where: { id: taskId },
        select: { startedDate: true },
      });

      if (!existingTask?.startedDate) {
        updateData.startedDate = new Date();
      }
    }

    // Set completedDate and completedSessionId when status is COMPLETED or PARTIALLY_COMPLETED
    if (status === 'COMPLETED' || status === 'PARTIALLY_COMPLETED') {
      updateData.completedDate = new Date();

      // Find user's active session
      const activeSession = await this.prisma.session.findFirst({
        where: {
          userId: userId,
          status: 'ACTIVE',
        },
        orderBy: {
          startTime: 'desc',
        },
      });

      if (activeSession) {
        updateData.completedSessionId = activeSession.id;
      }
    }

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
      },
    });

    // Send notification to admins when task is submitted (COMPLETED or PARTIALLY_COMPLETED)
    if (status === 'COMPLETED' || status === 'PARTIALLY_COMPLETED') {
      // Get all admin users
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      // Send notification to all online admins
      admins.forEach((admin) => {
        const socketId = this.socketManager.getUserSocketId(admin.id);
        if (socketId) {
          console.log(
            `[TaskService] Sending task ${status.toLowerCase()} notification to admin ${admin.id}`,
          );
          this.notificationsGateway.sendNotificationToClient(socketId, {
            type: status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_COMPLETED',
            taskId: task.id,
            taskTitle: task.title,
            message: `${task.assignedTo?.name} submitted task: ${task.title} (${status === 'COMPLETED' ? 'Completed' : 'Partially Completed'})`,
            priority: task.priority,
          });
        }
      });
    }

    return task;
  }

  async getCompletedTasks(startDate?: Date, endDate?: Date): Promise<Task[]> {
    // First, fetch all sessions that started within the date range
    const sessionWhereClause: any = {};

    if (startDate || endDate) {
      sessionWhereClause.startTime = {};
      if (startDate) sessionWhereClause.startTime.gte = startDate;
      if (endDate) sessionWhereClause.startTime.lte = endDate;
    }

    const sessions = await this.prisma.session.findMany({
      where: sessionWhereClause,
      select: { id: true },
    });

    const sessionIds = sessions.map((s) => s.id);

    // If no sessions found, return empty array
    if (sessionIds.length === 0) {
      return [];
    }

    // Now fetch all tasks completed in those sessions
    return this.prisma.task.findMany({
      where: {
        status: 'COMPLETED',
        completedSessionId: { in: sessionIds },
      },
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
        completedSession: true,
      },
      orderBy: {
        completedDate: 'desc',
      },
    });
  }

  async getTasksCompletedOnDate(date: Date, userId?: string): Promise<Task[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const whereClause: any = {
      status: 'COMPLETED',
      completedDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (userId) {
      whereClause.assignedToId = userId;
    }

    return this.prisma.task.findMany({
      where: whereClause,
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
        completedSession: true,
      },
      orderBy: {
        completedDate: 'asc',
      },
    });
  }

  async getActivityStats(startDate?: Date, endDate?: Date) {
    // First, fetch all sessions that started within the date range
    const sessionWhereClause: any = {};

    if (startDate || endDate) {
      sessionWhereClause.startTime = {};
      if (startDate) sessionWhereClause.startTime.gte = startDate;
      if (endDate) sessionWhereClause.startTime.lte = endDate;
    }

    const sessions = await this.prisma.session.findMany({
      where: sessionWhereClause,
      select: { id: true },
    });

    const sessionIds = sessions.map((s) => s.id);

    // If no sessions found, return zero stats
    if (sessionIds.length === 0) {
      return {
        totalTasks: 0,
        totalProjects: 0,
        totalUniqueUsers: 0,
      };
    }

    // Get all completed tasks in those sessions
    const tasks = await this.prisma.task.findMany({
      where: {
        status: 'COMPLETED',
        completedSessionId: { in: sessionIds },
      },
      select: {
        id: true,
        projectId: true,
        assignedToId: true,
      },
    });

    // Calculate stats
    const totalTasks = tasks.length;
    const uniqueProjects = new Set(
      tasks.map((t) => t.projectId).filter(Boolean),
    );
    const uniqueUsers = new Set(
      tasks.map((t) => t.assignedToId).filter(Boolean),
    );

    return {
      totalTasks,
      totalProjects: uniqueProjects.size,
      totalUniqueUsers: uniqueUsers.size,
    };
  }

  async updateTaskScore(taskId: string, score: number): Promise<Task> {
    // Validate score is between 0 and 200
    if (score < 0 || score > 200) {
      throw new Error('Score must be between 0 and 200');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: { score },
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
        completedSession: true,
      },
    });
  }

  async getCompletedTasksByUser(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Task[]> {
    // First, fetch all sessions that started within the date range for this user
    const sessionWhereClause: any = { userId };

    if (startDate || endDate) {
      sessionWhereClause.startTime = {};
      if (startDate) sessionWhereClause.startTime.gte = startDate;
      if (endDate) sessionWhereClause.startTime.lte = endDate;
    }

    const sessions = await this.prisma.session.findMany({
      where: sessionWhereClause,
      select: { id: true },
    });

    const sessionIds = sessions.map((s) => s.id);

    if (sessionIds.length === 0) {
      return [];
    }

    return this.prisma.task.findMany({
      where: {
        status: { in: ['COMPLETED', 'PARTIALLY_COMPLETED'] },
        assignedToId: userId,
        completedSessionId: { in: sessionIds },
      },
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
        completedSession: true,
      },
      orderBy: {
        completedDate: 'desc',
      },
    });
  }

  async getUserDailyScores(
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{
      userId: string;
      userName: string;
      totalTasks: number;
      scoredTasks: number;
      averageScore: number;
    }>
  > {
    // First, fetch all sessions that started within the date range
    const sessionWhereClause: any = {};

    if (startDate || endDate) {
      sessionWhereClause.startTime = {};
      if (startDate) sessionWhereClause.startTime.gte = startDate;
      if (endDate) sessionWhereClause.startTime.lte = endDate;
    }

    const sessions = await this.prisma.session.findMany({
      where: sessionWhereClause,
      select: { id: true },
    });

    const sessionIds = sessions.map((s) => s.id);

    if (sessionIds.length === 0) {
      return [];
    }

    // Get all completed tasks in those sessions
    const tasks = await this.prisma.task.findMany({
      where: {
        status: { in: ['COMPLETED', 'PARTIALLY_COMPLETED'] },
        completedSessionId: { in: sessionIds },
      },
      select: {
        id: true,
        assignedToId: true,
        score: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Group by user and calculate stats
    const userStatsMap = new Map<
      string,
      {
        userId: string;
        userName: string;
        totalTasks: number;
        totalScore: number;
        scoredTasks: number;
      }
    >();

    tasks.forEach((task) => {
      if (!task.assignedToId || !task.assignedTo) return;

      const userId = task.assignedToId;
      const existing = userStatsMap.get(userId);
      const taskScore = task.score ?? 100; // Use 100 as default for calculation if not scored
      const isScored = task.score !== null && task.score !== undefined; // Scored if value exists in DB

      if (existing) {
        existing.totalTasks++;
        if (isScored) {
          existing.scoredTasks++;
        }
        existing.totalScore += taskScore;
      } else {
        userStatsMap.set(userId, {
          userId,
          userName: task.assignedTo.name,
          totalTasks: 1,
          totalScore: taskScore,
          scoredTasks: isScored ? 1 : 0,
        });
      }
    });

    // Convert to array and calculate averages
    return Array.from(userStatsMap.values()).map((stats) => ({
      userId: stats.userId,
      userName: stats.userName,
      totalTasks: stats.totalTasks,
      scoredTasks: stats.scoredTasks,
      averageScore:
        stats.totalTasks > 0
          ? Math.round(stats.totalScore / stats.totalTasks)
          : 0,
    }));
  }

  async updatePrLinks(taskId: string, prLinks: string[]): Promise<Task> {
    // Validate that each link is a valid URL
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    for (const link of prLinks) {
      if (!urlRegex.test(link)) {
        throw new Error(`Invalid URL: ${link}`);
      }
    }

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { prLinks },
      include: {
        assignedTo: true,
        suggestedBy: true,
        approvedBy: true,
        project: true,
      },
    });

    return task as Task;
  }
}
