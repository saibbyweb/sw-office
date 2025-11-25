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
   * Send a direct message to a Slack user with Block Kit UI
   */
  async sendDirectMessage(slackUserId: string, message: string, blocks?: any[]): Promise<void> {
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

      // Send the message with blocks if provided
      const messageResponse = await axios.post<any>(
        `${this.slackApiUrl}/chat.postMessage`,
        {
          channel: channelId,
          text: message, // Fallback text for notifications
          ...(blocks && { blocks }),
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

  /**
   * Build Slack Block Kit message for task assignment
   */
  buildTaskAssignmentBlocks(task: {
    title: string;
    description: string;
    priority: string;
    points: number;
    estimatedHours: number;
  }): any[] {
    const priorityEmoji = {
      LOW: '🔵',
      MEDIUM: '🟡',
      HIGH: '🟠',
      CRITICAL: '🔴',
    }[task.priority] || '⚪';

    return [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📋 New Task Assigned',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${task.title}*\n${task.description}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `${priorityEmoji} *Priority*\n${task.priority}`,
          },
          {
            type: 'mrkdwn',
            text: `⭐ *Points*\n${task.points}`,
          },
          {
            type: 'mrkdwn',
            text: `⏱️ *Est. Hours*\n${task.estimatedHours}h`,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '💡 _Check your task dashboard for more details_',
          },
        ],
      },
    ];
  }

  /**
   * Build Slack Block Kit message for task approval
   */
  buildTaskApprovalBlocks(task: {
    title: string;
    description: string;
    priority: string;
    points: number;
    estimatedHours: number;
    approverName: string;
  }): any[] {
    const priorityEmoji = {
      LOW: '🔵',
      MEDIUM: '🟡',
      HIGH: '🟠',
      CRITICAL: '🔴',
    }[task.priority] || '⚪';

    return [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎉 Task Approved',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Your task has been approved by *${task.approverName}*`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${task.title}*\n${task.description}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `${priorityEmoji} *Priority*\n${task.priority}`,
          },
          {
            type: 'mrkdwn',
            text: `⭐ *Points*\n${task.points}`,
          },
          {
            type: 'mrkdwn',
            text: `⏱️ *Est. Hours*\n${task.estimatedHours}h`,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '✅ _Your task is now ready to be worked on!_',
          },
        ],
      },
    ];
  }
}
