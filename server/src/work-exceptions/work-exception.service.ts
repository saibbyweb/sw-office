import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExceptionType } from '@prisma/client';

@Injectable()
export class WorkExceptionService {
  constructor(private prisma: PrismaService) {}

  async createWorkException(
    userId: string,
    type: ExceptionType,
    date: Date,
    scheduledTimeEpoch?: number,
    actualTimeEpoch?: number,
    reason?: string,
    notes?: string,
    compensationDate?: Date,
  ) {
    return this.prisma.workException.create({
      data: {
        userId,
        type,
        date,
        scheduledTimeEpoch,
        actualTimeEpoch,
        reason,
        notes,
        compensationDate,
      },
      include: {
        user: true,
      },
    });
  }

  async getWorkExceptions(
    userId?: string,
    startDate?: Date,
    endDate?: Date,
    type?: ExceptionType,
  ) {
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    if (type) {
      where.type = type;
    }

    return this.prisma.workException.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async getWorkExceptionById(id: string) {
    return this.prisma.workException.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  async updateWorkException(
    id: string,
    type?: ExceptionType,
    date?: Date,
    scheduledTimeEpoch?: number,
    actualTimeEpoch?: number,
    reason?: string,
    notes?: string,
    compensationDate?: Date,
  ) {
    const data: any = {};

    if (type !== undefined) data.type = type;
    if (date !== undefined) data.date = date;
    if (scheduledTimeEpoch !== undefined) data.scheduledTimeEpoch = scheduledTimeEpoch;
    if (actualTimeEpoch !== undefined) data.actualTimeEpoch = actualTimeEpoch;
    if (reason !== undefined) data.reason = reason;
    if (notes !== undefined) data.notes = notes;
    if (compensationDate !== undefined) data.compensationDate = compensationDate;

    return this.prisma.workException.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });
  }

  async deleteWorkException(id: string) {
    return this.prisma.workException.delete({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  async getWorkExceptionStats(userId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const exceptions = await this.prisma.workException.findMany({
      where,
      select: {
        type: true,
      },
    });

    const stats = {
      total: exceptions.length,
      fullDayLeaves: exceptions.filter(e => e.type === 'FULL_DAY_LEAVE').length,
      halfDayLeaves: exceptions.filter(e => e.type === 'HALF_DAY_LEAVE').length,
      lateArrivals: exceptions.filter(e => e.type === 'LATE_ARRIVAL').length,
      earlyExits: exceptions.filter(e => e.type === 'EARLY_EXIT').length,
      workFromHome: exceptions.filter(e => e.type === 'WORK_FROM_HOME').length,
      sickLeaves: exceptions.filter(e => e.type === 'SICK_LEAVE').length,
      emergencyLeaves: exceptions.filter(e => e.type === 'EMERGENCY_LEAVE').length,
    };

    return stats;
  }
}
