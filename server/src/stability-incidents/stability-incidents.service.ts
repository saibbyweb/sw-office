import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StabilityIncident } from '../generated-nestjs-typegraphql';
import { CreateStabilityIncidentInput } from './dto/create-incident.input';
import { UpdateStabilityIncidentInput } from './dto/update-incident.input';
import { IncidentFiltersInput } from './dto/incident-filters.input';

@Injectable()
export class StabilityIncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createIncident(
    input: CreateStabilityIncidentInput,
  ): Promise<StabilityIncident> {
    return this.prisma.stabilityIncident.create({
      data: {
        userId: input.userId,
        type: input.type,
        severity: input.severity,
        title: input.title,
        description: input.description,
        taskId: input.taskId,
        incidentDate: input.incidentDate,
        reportedById: input.reportedById,
        rootCause: input.rootCause,
        preventionPlan: input.preventionPlan,
        adminNotes: input.adminNotes,
        screenshots: input.screenshots || [],
        logLinks: input.logLinks || [],
      },
      include: {
        user: true,
        task: true,
        reportedBy: true,
        resolutionTask: true,
      },
    });
  }

  async updateIncident(
    id: string,
    input: UpdateStabilityIncidentInput,
  ): Promise<StabilityIncident> {
    return this.prisma.stabilityIncident.update({
      where: { id },
      data: {
        ...(input.type !== undefined && { type: input.type }),
        ...(input.severity !== undefined && { severity: input.severity }),
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.taskId !== undefined && { taskId: input.taskId }),
        ...(input.incidentDate !== undefined && { incidentDate: input.incidentDate }),
        ...(input.resolvedAt !== undefined && { resolvedAt: input.resolvedAt }),
        ...(input.resolutionNotes !== undefined && { resolutionNotes: input.resolutionNotes }),
        ...(input.rootCause !== undefined && { rootCause: input.rootCause }),
        ...(input.preventionPlan !== undefined && { preventionPlan: input.preventionPlan }),
        ...(input.adminNotes !== undefined && { adminNotes: input.adminNotes }),
        ...(input.screenshots !== undefined && { screenshots: input.screenshots }),
        ...(input.logLinks !== undefined && { logLinks: input.logLinks }),
      },
      include: {
        user: true,
        task: true,
        reportedBy: true,
        resolutionTask: true,
      },
    });
  }

  async deleteIncident(id: string): Promise<boolean> {
    await this.prisma.stabilityIncident.delete({
      where: { id },
    });
    return true;
  }

  async getIncidentById(id: string): Promise<StabilityIncident | null> {
    return this.prisma.stabilityIncident.findUnique({
      where: { id },
      include: {
        user: true,
        task: true,
        reportedBy: true,
        resolutionTask: true,
      },
    });
  }

  async getAllIncidents(
    filters?: IncidentFiltersInput,
  ): Promise<StabilityIncident[]> {
    const whereClause: any = {};

    if (filters) {
      if (filters.userId) {
        whereClause.userId = filters.userId;
      }

      if (filters.taskId) {
        whereClause.taskId = filters.taskId;
      }

      if (filters.type) {
        whereClause.type = filters.type;
      }

      if (filters.severity) {
        whereClause.severity = filters.severity;
      }

      if (filters.resolved !== undefined) {
        if (filters.resolved) {
          whereClause.resolvedAt = { not: null };
        } else {
          whereClause.resolvedAt = null;
        }
      }

      if (filters.startDate || filters.endDate) {
        whereClause.incidentDate = {};
        if (filters.startDate) {
          whereClause.incidentDate.gte = filters.startDate;
        }
        if (filters.endDate) {
          whereClause.incidentDate.lte = filters.endDate;
        }
      }

      if (filters.searchQuery) {
        whereClause.OR = [
          { title: { contains: filters.searchQuery, mode: 'insensitive' } },
          { description: { contains: filters.searchQuery, mode: 'insensitive' } },
        ];
      }
    }

    return this.prisma.stabilityIncident.findMany({
      where: whereClause,
      include: {
        user: true,
        task: true,
        reportedBy: true,
        resolutionTask: true,
      },
      orderBy: {
        incidentDate: 'desc',
      },
    });
  }

  async resolveIncident(
    id: string,
    resolutionNotes: string,
    resolvedAt: number,
    resolutionTaskId?: string,
  ): Promise<StabilityIncident> {
    return this.prisma.stabilityIncident.update({
      where: { id },
      data: {
        resolvedAt,
        resolutionNotes,
        resolutionTaskId: resolutionTaskId || null,
      },
      include: {
        user: true,
        task: true,
        reportedBy: true,
        resolutionTask: true,
      },
    });
  }

  async unresolveIncident(id: string): Promise<StabilityIncident> {
    return this.prisma.stabilityIncident.update({
      where: { id },
      data: {
        resolvedAt: null,
        resolutionNotes: null,
        resolutionTaskId: null,
      },
      include: {
        user: true,
        task: true,
        reportedBy: true,
        resolutionTask: true,
      },
    });
  }
}
