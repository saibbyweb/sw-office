import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  profile: {
    email?: string;
    real_name?: string;
    display_name?: string;
    image_24?: string;
    image_32?: string;
    image_48?: string;
    image_72?: string;
    image_192?: string;
    image_512?: string;
  };
  deleted: boolean;
  is_bot: boolean;
}

interface SlackUsersListResponse {
  ok: boolean;
  members: SlackUser[];
  error?: string;
}

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);
  private readonly slackToken: string;
  private readonly slackApiUrl = 'https://slack.com/api';

  constructor(private readonly config: ConfigService) {
    this.slackToken = this.config.get<string>('SLACK_BOT_TOKEN') || '';

    if (!this.slackToken) {
      this.logger.warn('SLACK_BOT_TOKEN not configured. Slack integration will not work.');
    }
  }

  /**
   * Fetch all users from Slack workspace
   */
  async getAllUsers(): Promise<SlackUser[]> {
    if (!this.slackToken) {
      throw new Error('Slack token not configured');
    }

    try {
      const response = await axios.get<SlackUsersListResponse>(
        `${this.slackApiUrl}/users.list`,
        {
          headers: {
            Authorization: `Bearer ${this.slackToken}`,
          },
        }
      );

      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      // Filter out bots and deleted users
      const realUsers = response.data.members.filter(
        (user) => !user.is_bot && !user.deleted
      );

      this.logger.log(`Fetched ${realUsers.length} users from Slack`);
      return realUsers;
    } catch (error) {
      this.logger.error('Error fetching Slack users:', error);
      throw error;
    }
  }

  /**
   * Get Slack user by email
   */
  async getUserByEmail(email: string): Promise<SlackUser | null> {
    if (!this.slackToken) {
      throw new Error('Slack token not configured');
    }

    try {
      const response = await axios.get<any>(
        `${this.slackApiUrl}/users.lookupByEmail`,
        {
          headers: {
            Authorization: `Bearer ${this.slackToken}`,
          },
          params: {
            email,
          },
        }
      );

      if (!response.data.ok) {
        if (response.data.error === 'users_not_found') {
          return null;
        }
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      return response.data.user;
    } catch (error) {
      this.logger.error(`Error fetching Slack user by email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Send a direct message to a Slack user
   */
  async sendDirectMessage(slackUserId: string, message: string): Promise<void> {
    if (!this.slackToken) {
      throw new Error('Slack token not configured');
    }

    try {
      // First, open a DM channel with the user
      const dmResponse = await axios.post<any>(
        `${this.slackApiUrl}/conversations.open`,
        { users: slackUserId },
        {
          headers: {
            Authorization: `Bearer ${this.slackToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!dmResponse.data.ok) {
        throw new Error(`Failed to open DM: ${dmResponse.data.error}`);
      }

      const channelId = dmResponse.data.channel.id;

      // Send the message
      const messageResponse = await axios.post<any>(
        `${this.slackApiUrl}/chat.postMessage`,
        {
          channel: channelId,
          text: message,
        },
        {
          headers: {
            Authorization: `Bearer ${this.slackToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!messageResponse.data.ok) {
        throw new Error(`Failed to send message: ${messageResponse.data.error}`);
      }

      this.logger.log(`Sent DM to Slack user ${slackUserId}`);
    } catch (error) {
      this.logger.error(`Error sending DM to ${slackUserId}:`, error);
      throw error;
    }
  }
}
