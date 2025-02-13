import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Break, StartBreakInput } from '../schema/break.types';
import { SegmentType } from '../schema/segment.types';
import { SessionStatus } from '../schema/session.types';

@Injectable()
export class BreakService {
  constructor(private readonly prisma: PrismaService) {}

  async startBreak(
    userId: string,
    sessionId: string,
    input: StartBreakInput,
  ): Promise<Break> {
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // Verify session exists and is active
      const session = await tx.session.findFirst({
        where: { id: sessionId, userId, status: SessionStatus.ACTIVE },
      });

      if (!session) {
        throw new Error('Active session not found');
      }

      // End current work segment
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

      // Create break record
      const breakRecord = await tx.break.create({
        data: {
          userId,
          sessionId,
          type: input.type,
          startTime: now,
          duration: 0,
        },
      });

      // Create break segment
      await tx.segment.create({
        data: {
          sessionId,
          type: SegmentType.BREAK,
          breakId: breakRecord.id,
          startTime: now,
        },
      });

      return breakRecord;
    });
  }

  async endBreak(userId: string, breakId: string): Promise<Break> {
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // Get break record and verify ownership
      const breakRecord = await tx.break.findFirst({
        where: { id: breakId, userId, endTime: null },
        include: { session: true },
      });

      if (!breakRecord) {
        throw new Error('Active break not found');
      }

      if (breakRecord.session.status !== SessionStatus.ACTIVE) {
        throw new Error('Session is not active');
      }

      // End break segment
      const breakSegment = await tx.segment.findFirst({
        where: {
          sessionId: breakRecord.sessionId,
          breakId,
          endTime: null,
        },
      });

      if (breakSegment) {
        await tx.segment.update({
          where: { id: breakSegment.id },
          data: {
            endTime: now,
            duration: Math.floor(
              (now.getTime() - breakSegment.startTime.getTime()) / 1000,
            ),
          },
        });
      }

      // Update break record
      const duration = Math.floor(
        (now.getTime() - breakRecord.startTime.getTime()) / 1000,
      );
      const updatedBreak = await tx.break.update({
        where: { id: breakId },
        data: {
          endTime: now,
          duration,
        },
      });

      // Create new work segment with previous project
      await tx.segment.create({
        data: {
          sessionId: breakRecord.sessionId,
          type: SegmentType.WORK,
          projectId: breakRecord.session.projectId,
          startTime: now,
        },
      });

      return updatedBreak;
    });
  }
}
