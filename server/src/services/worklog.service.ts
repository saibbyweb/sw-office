import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  WorkLog,
  AddWorkLogInput,
  UpdateWorkLogInput,
} from '../schema/worklog.types';
import { SessionStatus } from '../schema/session.types';

@Injectable()
export class WorkLogService {
  constructor(private readonly prisma: PrismaService) {}

  async addWorkLog(userId: string, input: AddWorkLogInput): Promise<WorkLog> {
    // Verify session exists and is active
    const session = await this.prisma.session.findFirst({
      where: { id: input.sessionId, userId, status: SessionStatus.ACTIVE },
    });

    if (!session) {
      throw new Error('Active session not found');
    }

    // Create work log
    return this.prisma.workLog.create({
      data: {
        userId,
        sessionId: input.sessionId,
        projectId: input.projectId,
        content: input.content,
        links: input.links,
      },
    });
  }

  async updateWorkLog(
    userId: string,
    id: string,
    input: UpdateWorkLogInput,
  ): Promise<WorkLog> {
    // Verify work log exists and belongs to user
    const workLog = await this.prisma.workLog.findFirst({
      where: { id, userId },
      include: { session: true },
    });

    if (!workLog) {
      throw new Error('Work log not found');
    }

    if (workLog.session.status !== SessionStatus.ACTIVE) {
      throw new Error('Cannot update work log for completed session');
    }

    // Update work log
    return this.prisma.workLog.update({
      where: { id },
      data: {
        ...(input.projectId && { projectId: input.projectId }),
        ...(input.content && { content: input.content }),
        ...(input.links && { links: input.links }),
      },
    });
  }

  async deleteWorkLog(userId: string, id: string): Promise<boolean> {
    // Verify work log exists and belongs to user
    const workLog = await this.prisma.workLog.findFirst({
      where: { id, userId },
      include: { session: true },
    });

    if (!workLog) {
      throw new Error('Work log not found');
    }

    if (workLog.session.status !== SessionStatus.ACTIVE) {
      throw new Error('Cannot delete work log for completed session');
    }

    // Delete work log
    await this.prisma.workLog.delete({
      where: { id },
    });

    return true;
  }
}
