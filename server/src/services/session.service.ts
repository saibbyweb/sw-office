import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  SegmentType,
  Session,
  SessionStatus,
} from '../generated-nestjs-typegraphql';
import { StartSessionInput, SwitchProjectInput } from '../types/session.types';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveSession(userId: string): Promise<Session | null> {
    return this.prisma.session.findFirst({
      where: {
        userId,
        status: SessionStatus.ACTIVE,
        endTime: {
          isSet: false,
        },
      },
      include: {
        project: true,
        breaks: {
          where: {
            endTime: {
              isSet: false,
            },
          },
        },
      },
    });
  }

  async startSession(
    userId: string,
    input: StartSessionInput,
  ): Promise<Session> {
    const session = await this.prisma.$transaction(async (tx) => {
      // Create the session
      const session = await tx.session.create({
        data: {
          userId,
          projectId: input.projectId,
          status: SessionStatus.ACTIVE,
          totalDuration: 0,
          totalBreakTime: 0,
        },
      });

      // Create initial work segment
      await tx.segment.create({
        data: {
          sessionId: session.id,
          type: SegmentType.WORK,
          projectId: input.projectId,
          startTime: session.startTime,
        },
      });

      return session;
    });

    return session;
  }

  async endSession(userId: string, sessionId: string): Promise<Session> {
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // Get current session and active segment
      const session = await tx.session.findFirst({
        where: { id: sessionId, userId, status: SessionStatus.ACTIVE },
      });

      if (!session) {
        throw new Error('Active session not found');
      }

      // End current segment
      const activeSegment = await tx.segment.findFirst({
        where: { sessionId, endTime: null },
        orderBy: { startTime: 'desc' },
      });

      if (activeSegment) {
        await tx.segment.update({
          where: { id: activeSegment.id },
          data: {
            endTime: now,
            duration: Math.floor(
              (now.getTime() - activeSegment.startTime.getTime()) / 1000,
            ),
          },
        });
      }

      // Calculate total duration
      const segments = await tx.segment.findMany({
        where: { sessionId },
      });

      const totalDuration = segments.reduce(
        (acc, seg) => acc + (seg.duration || 0),
        0,
      );
      const totalBreakTime = segments
        .filter((seg) => seg.type === SegmentType.BREAK)
        .reduce((acc, seg) => acc + (seg.duration || 0), 0);

      // Update session
      return tx.session.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.COMPLETED,
          endTime: now,
          totalDuration,
          totalBreakTime,
        },
      });
    });
  }

  async switchProject(
    userId: string,
    sessionId: string,
    input: SwitchProjectInput,
  ): Promise<Session> {
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // Verify session exists and is active
      const session = await tx.session.findFirst({
        where: { id: sessionId, userId, status: SessionStatus.ACTIVE },
      });

      if (!session) {
        throw new Error('Active session not found');
      }

      // End current segment
      const activeSegment = await tx.segment.findFirst({
        where: { sessionId, endTime: { isSet: false } },
        orderBy: { startTime: 'desc' },
      });

      if (activeSegment) {
        await tx.segment.update({
          where: { id: activeSegment.id },
          data: {
            endTime: now,
            duration: Math.floor(
              (now.getTime() - activeSegment.startTime.getTime()) / 1000,
            ),
          },
        });
      }

      // Create new segment for new project
      await tx.segment.create({
        data: {
          sessionId,
          type: SegmentType.WORK,
          projectId: input.projectId,
          startTime: now,
        },
      });

      // Update session with new project
      return tx.session.update({
        where: { id: sessionId },
        data: {
          projectId: input.projectId,
        },
      });
    });
  }
}
