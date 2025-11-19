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
}
