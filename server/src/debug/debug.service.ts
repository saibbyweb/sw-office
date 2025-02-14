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

  async cleanupInconsistentBreaks(): Promise<{ cleanedBreaks: number }> {
    const now = new Date();

    // Find all active breaks
    const activeBreaks = await this.prisma.break.findMany({
      where: {
        endTime: { isSet: false },
      },
      include: {
        session: true,
      },
    });

    // Group breaks by userId to identify users with multiple active breaks
    const breaksByUser = activeBreaks.reduce((acc, breakItem) => {
      const breaks = acc.get(breakItem.userId) || [];
      breaks.push(breakItem);
      acc.set(breakItem.userId, breaks);
      return acc;
    }, new Map<string, Break[]>());

    let cleanedBreaks = 0;

    // For each user with multiple breaks, keep only the most recent one
    for (const [userId, breaks] of breaksByUser.entries()) {
      if (breaks.length > 1) {
        // Sort breaks by startTime in descending order
        breaks.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

        // Keep the most recent break, end all others
        const [mostRecent, ...oldBreaks] = breaks;

        // End all old breaks
        await Promise.all(
          oldBreaks.map((breakItem) =>
            this.prisma.break.update({
              where: { id: breakItem.id },
              data: {
                endTime: now,
                duration: Math.floor(
                  (now.getTime() - breakItem.startTime.getTime()) / 1000,
                ),
              },
            }),
          ),
        );

        cleanedBreaks += oldBreaks.length;
      }
    }

    return { cleanedBreaks };
  }
}
