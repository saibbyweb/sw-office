import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Task } from '../generated-nestjs-typegraphql';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { SocketManagerService } from '../notifications/socket-manager.service';

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

  async getAllTasks(skip?: number, take?: number, filters?: TaskFilters, userId?: string): Promise<PaginatedTasksResponse> {
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
          { description: { contains: filters.searchQuery, mode: 'insensitive' } },
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
    const [myTasksCount, availableTasksCount, suggestedTasksCount] = await Promise.all([
      // My tasks count
      userId ? this.prisma.task.count({ where: { assignedToId: userId } }) : 0,
      // Available tasks count (approved and unassigned)
      this.prisma.task.count({ where: { status: 'APPROVED', assignedToId: { isSet: false } } }),
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
    const hasMore = skip !== undefined && take !== undefined
      ? (skip + take) < total
      : false;

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

    // Send real-time notification to the assigned user
    if (userId) {
      const socketId = this.socketManager.getUserSocketId(userId);
      if (socketId) {
        console.log(`[TaskService] Sending task assignment notification to user ${userId}`);
        this.notificationsGateway.sendNotificationToClient(socketId, {
          type: 'TASK_ASSIGNED',
          taskId: task.id,
          taskTitle: task.title,
          message: `You've been assigned to: ${task.title}`,
          priority: task.priority,
        });
      } else {
        console.log(`[TaskService] User ${userId} is not connected, skipping notification`);
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
        console.log(`[TaskService] Sending task approval notification to user ${task.suggestedById}`);
        this.notificationsGateway.sendNotificationToClient(socketId, {
          type: 'TASK_APPROVED',
          taskId: task.id,
          taskTitle: task.title,
          message: `Your suggested task "${task.title}" has been approved!`,
          priority: task.priority,
        });
      } else {
        console.log(`[TaskService] User ${task.suggestedById} is not connected, skipping notification`);
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

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
    const updateData: any = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.category !== undefined) updateData.category = input.category as any;
    if (input.priority !== undefined) updateData.priority = input.priority as any;
    if (input.points !== undefined) updateData.points = input.points;
    if (input.estimatedHours !== undefined) updateData.estimatedHours = input.estimatedHours;
    if (input.projectId !== undefined) updateData.projectId = input.projectId || null;

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

  async completeTask(taskId: string): Promise<Task> {
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(),
      },
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

  async updateTaskStatus(taskId: string, status: string, userId: string): Promise<Task> {
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

    // Set completedDate when status is COMPLETED or PARTIALLY_COMPLETED
    if (status === 'COMPLETED' || status === 'PARTIALLY_COMPLETED') {
      updateData.completedDate = new Date();
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
          console.log(`[TaskService] Sending task ${status.toLowerCase()} notification to admin ${admin.id}`);
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
    const whereClause: any = {
      status: 'COMPLETED',
      completedDate: { not: null },
    };

    if (startDate || endDate) {
      whereClause.completedDate = {};
      if (startDate) whereClause.completedDate.gte = startDate;
      if (endDate) whereClause.completedDate.lte = endDate;
    }

    return this.prisma.task.findMany({
      where: whereClause,
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
      },
      orderBy: {
        completedDate: 'desc',
      },
    });
  }
}
