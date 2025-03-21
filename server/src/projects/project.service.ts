import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Project } from '../generated-nestjs-typegraphql';
import { UpdateProjectInput } from '../types/project.types';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveProjects(): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { isActive: true },
    });
  }

  async updateProject(
    userId: string,
    id: string,
    input: UpdateProjectInput,
  ): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: { id },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return this.prisma.project.update({
      where: { id },
      data: input,
    });
  }

  async deleteProject(userId: string, id: string): Promise<boolean> {
    const project = await this.prisma.project.findFirst({
      where: { id },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    await this.prisma.project.delete({
      where: { id },
    });

    return true;
  }
}
