import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  Session,
  Break,
  Segment,
  WorkLog,
} from '../generated-nestjs-typegraphql';

interface DebugData {
  activeSessions: Session[];
  activeBreaks: Break[];
  recentSegments: Segment[];
  recentWorkLogs: WorkLog[];
}

@Injectable()
export class DebugService {
  constructor(private readonly prisma: PrismaService) {}

  async getDebugData(): Promise<DebugData> {
    const [activeSessions, activeBreaks, recentSegments, recentWorkLogs] =
      await Promise.all([
        // Get active sessions with user and project info
        this.prisma.session.findMany({
          where: {
            status: 'ACTIVE',
            endTime: { isSet: false },
          },
          include: {
            user: true,
            project: true,
          },
          orderBy: {
            startTime: 'desc',
          },
        }),

        // Get active breaks with user info
        this.prisma.break.findMany({
          where: {
            endTime: { isSet: false },
          },
          include: {
            user: true,
          },
          orderBy: {
            startTime: 'desc',
          },
        }),

        // Get recent segments with all related info
        this.prisma.segment.findMany({
          take: 50,
          orderBy: {
            startTime: 'desc',
          },
          include: {
            session: {
              include: {
                user: true,
              },
            },
            project: true,
            break: true,
          },
        }),

        // Get recent work logs with all related info
        this.prisma.workLog.findMany({
          take: 50,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: true,
            project: true,
            session: true,
          },
        }),
      ]);

    return {
      activeSessions,
      activeBreaks,
      recentSegments,
      recentWorkLogs,
    };
  }
}
