import { Resolver, Query, Mutation } from '@nestjs/graphql';
import { SlackService } from './slack.service';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../generated-nestjs-typegraphql';
import { SlackUserOutput } from './dto/slack-user.output';

@Resolver()
export class SlackResolver {
  constructor(
    private readonly slackService: SlackService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => String)
  async testSlackConnection(): Promise<string> {
    try {
      const users = await this.slackService.getAllUsers();
      return `Successfully connected to Slack. Found ${users.length} users.`;
    } catch (error) {
      return `Failed to connect to Slack: ${error.message}`;
    }
  }

  @Query(() => [SlackUserOutput])
  async listSlackUsers(): Promise<SlackUserOutput[]> {
    try {
      const users = await this.slackService.getAllUsers();
      return users.map(user => ({
        id: user.id,
        name: user.name,
        real_name: user.real_name,
        profile: {
          email: user.profile.email,
          real_name: user.profile.real_name,
          display_name: user.profile.display_name,
          image_24: user.profile.image_24,
          image_32: user.profile.image_32,
          image_48: user.profile.image_48,
          image_72: user.profile.image_72,
          image_192: user.profile.image_192,
          image_512: user.profile.image_512,
        },
        deleted: user.deleted,
        is_bot: user.is_bot,
      }));
    } catch (error) {
      throw new Error(`Failed to list Slack users: ${error.message}`);
    }
  }

  @Mutation(() => String)
  async syncSlackUserIds(): Promise<string> {
    try {
      const slackUsers = await this.slackService.getAllUsers();
      const dbUsers = await this.prisma.user.findMany({
        where: {
          slackUserId: null,
        },
      });

      let syncedCount = 0;
      let notFoundCount = 0;

      for (const dbUser of dbUsers) {
        // Find matching Slack user by email
        const slackUser = slackUsers.find(
          (su) => su.profile.email?.toLowerCase() === dbUser.email.toLowerCase()
        );

        if (slackUser) {
          await this.prisma.user.update({
            where: { id: dbUser.id },
            data: { slackUserId: slackUser.id },
          });
          syncedCount++;
        } else {
          notFoundCount++;
        }
      }

      return `Sync complete! Synced ${syncedCount} users. ${notFoundCount} users not found in Slack.`;
    } catch (error) {
      throw new Error(`Failed to sync Slack user IDs: ${error.message}`);
    }
  }

  @Mutation(() => [User])
  async syncAllSlackUserIds(): Promise<User[]> {
    try {
      const slackUsers = await this.slackService.getAllUsers();
      const dbUsers = await this.prisma.user.findMany();

      const updatedUsers: User[] = [];

      for (const dbUser of dbUsers) {
        // Find matching Slack user by email
        const slackUser = slackUsers.find(
          (su) => su.profile.email?.toLowerCase() === dbUser.email.toLowerCase()
        );

        if (slackUser && dbUser.slackUserId !== slackUser.id) {
          const updated = await this.prisma.user.update({
            where: { id: dbUser.id },
            data: { slackUserId: slackUser.id },
          });
          updatedUsers.push(updated);
        }
      }

      return updatedUsers;
    } catch (error) {
      throw new Error(`Failed to sync all Slack user IDs: ${error.message}`);
    }
  }
}
