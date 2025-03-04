import { Resolver, Query } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.service';
import { User } from 'src/generated-nestjs-typegraphql';

@Resolver('Teams')
export class TeamsResolver {
  constructor(private prisma: PrismaService) {}

  @Query(() => [User])
  async teamUsers() {
    return this.prisma.user.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        // We'll implement these later with MS Teams integration
        isOnline: true,
        currentStatus: true,
      },
    });
  }
}
