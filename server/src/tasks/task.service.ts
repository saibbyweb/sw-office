import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Task } from '../generated-nestjs-typegraphql';

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

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async createTask(input: CreateTaskInput): Promise<Task> {
    return this.prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category as any,
        priority: input.priority as any,
        points: input.points,
        estimatedHours: input.estimatedHours,
        projectId: input.projectId || undefined,
      },
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
      },
    });
  }

  async getAllTasks(): Promise<Task[]> {
    return this.prisma.task.findMany({
      include: {
        project: true,
        suggestedBy: true,
        assignedTo: true,
        approvedBy: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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
    return this.prisma.task.update({
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
  }

  async approveTask(taskId: string, approvedById: string): Promise<Task> {
    return this.prisma.task.update({
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
