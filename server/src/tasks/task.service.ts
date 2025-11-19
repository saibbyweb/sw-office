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
}
