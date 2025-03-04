import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllActiveSessions() {
    return this.prisma.session.findMany({
      where: {
        endTime: { isSet: false },
      },
      include: {
        user: true,
        project: true,
        breaks: {
          where: {
            endTime: { isSet: false },
          },
        },
        workLogs: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        segments: {
          orderBy: {
            startTime: 'desc',
          },
        },
      },
    });
  }

  async getUserSessionDetail(userId: string) {
    return this.prisma.session.findFirst({
      where: {
        userId,
        endTime: { isSet: false },
      },
      include: {
        user: true,
        project: true,
        breaks: {
          orderBy: {
            startTime: 'desc',
          },
          where: {
            endTime: { isSet: false },
          },
        },
        workLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            project: true,
          },
        },
        segments: {
          orderBy: {
            startTime: 'desc',
          },
        },
      },
    });
  }
}
