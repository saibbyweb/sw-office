import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DailyOutputScore } from '../generated-nestjs-typegraphql';
import { CreateDailyScoreInput } from './dto/create-daily-score.input';
import { UpdateDailyScoreInput } from './dto/update-daily-score.input';

@Injectable()
export class DailyOutputScoreService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdateDailyScore(
    input: CreateDailyScoreInput,
  ): Promise<DailyOutputScore> {
    // Normalize date to start of day UTC
    const normalizedDate = new Date(input.date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Check if score already exists for this user and date
    const existing = await this.prisma.dailyOutputScore.findUnique({
      where: {
        userId_date: {
          userId: input.userId,
          date: normalizedDate,
        },
      },
    });

    if (existing) {
      // Update existing score
      const updated = await this.prisma.dailyOutputScore.update({
        where: { id: existing.id },
        data: {
          score: input.score,
          tasksCompleted: input.tasksCompleted,
          taskDifficulty: input.taskDifficulty,
          initiativeCount: input.initiativeCount,
          qualityRating: input.qualityRating,
          availabilityRating: input.availabilityRating,
          notes: input.notes,
          assignedById: input.assignedById,
        },
        include: {
          user: true,
          assignedBy: true,
        },
      });
      return updated as DailyOutputScore;
    } else {
      // Create new score
      const created = await this.prisma.dailyOutputScore.create({
        data: {
          userId: input.userId,
          date: normalizedDate,
          score: input.score,
          tasksCompleted: input.tasksCompleted || 0,
          taskDifficulty: input.taskDifficulty,
          initiativeCount: input.initiativeCount || 0,
          qualityRating: input.qualityRating,
          availabilityRating: input.availabilityRating,
          notes: input.notes,
          assignedById: input.assignedById,
        },
        include: {
          user: true,
          assignedBy: true,
        },
      });
      return created as DailyOutputScore;
    }
  }

  async updateDailyScore(
    id: string,
    input: UpdateDailyScoreInput,
  ): Promise<DailyOutputScore> {
    const data: any = {};

    if (input.score !== undefined) data.score = input.score;
    if (input.tasksCompleted !== undefined)
      data.tasksCompleted = input.tasksCompleted;
    if (input.taskDifficulty !== undefined)
      data.taskDifficulty = input.taskDifficulty;
    if (input.initiativeCount !== undefined)
      data.initiativeCount = input.initiativeCount;
    if (input.qualityRating !== undefined)
      data.qualityRating = input.qualityRating;
    if (input.availabilityRating !== undefined)
      data.availabilityRating = input.availabilityRating;
    if (input.notes !== undefined) data.notes = input.notes;

    const updated = await this.prisma.dailyOutputScore.update({
      where: { id },
      data,
      include: {
        user: true,
        assignedBy: true,
      },
    });

    return updated as DailyOutputScore;
  }

  async getDailyScoresByUser(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<DailyOutputScore[]> {
    const where: any = { userId };

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const scores = await this.prisma.dailyOutputScore.findMany({
      where,
      include: {
        user: true,
        assignedBy: true,
      },
      orderBy: { date: 'desc' },
    });

    return scores as DailyOutputScore[];
  }

  async getDailyScoresByDate(date: Date): Promise<DailyOutputScore[]> {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const scores = await this.prisma.dailyOutputScore.findMany({
      where: { date: normalizedDate },
      include: {
        user: true,
        assignedBy: true,
      },
      orderBy: { score: 'desc' },
    });

    return scores as DailyOutputScore[];
  }

  async getDailyScoreByUserAndDate(
    userId: string,
    date: Date,
  ): Promise<DailyOutputScore | null> {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const score = await this.prisma.dailyOutputScore.findUnique({
      where: {
        userId_date: {
          userId,
          date: normalizedDate,
        },
      },
      include: {
        user: true,
        assignedBy: true,
      },
    });

    return score as DailyOutputScore | null;
  }

  async getAllDailyScores(
    startDate?: Date,
    endDate?: Date,
  ): Promise<DailyOutputScore[]> {
    const where: any = {};

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const scores = await this.prisma.dailyOutputScore.findMany({
      where,
      include: {
        user: true,
        assignedBy: true,
      },
      orderBy: [{ date: 'desc' }, { score: 'desc' }],
    });

    return scores as DailyOutputScore[];
  }

  async deleteDailyScore(id: string): Promise<DailyOutputScore> {
    const deleted = await this.prisma.dailyOutputScore.delete({
      where: { id },
      include: {
        user: true,
        assignedBy: true,
      },
    });

    return deleted as DailyOutputScore;
  }
}
