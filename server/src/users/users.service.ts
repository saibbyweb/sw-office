import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { User } from '../generated-nestjs-typegraphql';
import { UpdateProfileInput } from './dto/update-profile.input';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      include: {
        sessions: {
          where: {
            status: 'ACTIVE',
            endTime: { isSet: false },
          },
          include: {
            project: true,
            breaks: {
              where: {
                endTime: { isSet: false }, // Only get active breaks
              },
            },
          },
          take: 1,
        },
      },
    });

    // Map over users to set isOnline based on active session and break status
    return users.map((user) => ({
      ...user,
      isOnline: user.sessions?.[0] && user.sessions[0].breaks.length === 0,
    }));
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        ...(input.avatarUrl && { avatarUrl: input.avatarUrl }),
      },
    });

    return user;
  }
}
