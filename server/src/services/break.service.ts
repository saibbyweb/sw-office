import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Break, SegmentType } from '../generated-nestjs-typegraphql';
import { StartBreakInput } from '../types/break.types';

@Injectable()
export class BreakService {
  constructor(private readonly prisma: PrismaService) {}

  async startBreak(userId: string, input: StartBreakInput): Promise<Break> {
    const now = new Date();
    console.log('Starting break with input:', { userId, input, now });

    return this.prisma.$transaction(async (tx) => {
      // Verify session exists and is active
      const session = await tx.session.findFirst({
        where: { id: input.sessionId, userId, status: 'ACTIVE' },
      });
      console.log('Found session:', session);

      if (!session) {
        throw new Error('Active session not found');
      }

      // End current work segment
      const activeSegment = await tx.segment.findFirst({
        where: { sessionId: input.sessionId, endTime: { isSet: false } },
        orderBy: { startTime: 'desc' },
      });
      console.log('Found active segment:', activeSegment);

      if (activeSegment) {
        const updatedSegment = await tx.segment.update({
          where: { id: activeSegment.id },
          data: {
            endTime: now,
            duration: Math.floor(
              (now.getTime() - activeSegment.startTime.getTime()) / 1000,
            ),
          },
        });
        console.log('Updated segment:', updatedSegment);
      }

      // Create break record
      const breakRecord = await tx.break.create({
        data: {
          userId,
          sessionId: input.sessionId,
          type: input.type,
          startTime: now,
          duration: 0,
        },
      });
      console.log('Created break record:', breakRecord);

      // Create break segment
      const breakSegment = await tx.segment.create({
        data: {
          sessionId: input.sessionId,
          type: SegmentType.BREAK,
          breakId: breakRecord.id,
          startTime: now,
        },
      });
      console.log('Created break segment:', breakSegment);

      return breakRecord;
    });
  }

  async endBreak(userId: string, breakId: string): Promise<Break> {
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // Get break record and verify ownership
      const breakRecord = await tx.break.findFirst({
        where: { id: breakId, userId, endTime: { isSet: false } },
        include: { session: true },
      });

      if (!breakRecord) {
        throw new Error('Active break not found');
      }

      if (breakRecord.session.status !== 'ACTIVE') {
        throw new Error('Session is not active');
      }

      // End break segment
      const breakSegment = await tx.segment.findFirst({
        where: {
          sessionId: breakRecord.sessionId,
          breakId,
          endTime: { isSet: false },
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
