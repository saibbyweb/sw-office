import { Injectable } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import {
  TeamsUser,
  TeamsUserWithPresence,
  OnlineMeeting,
  MeetingHistoryItem,
  OrganizationMeeting,
} from './teams.types';

interface GraphApiResponse<T> {
  value: T[];
}

interface PresenceResponse {
  activity: string;
  availability: string;
}

interface GraphError {
  message: string;
}

interface CalendarEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
  isOnlineMeeting: boolean;
  onlineMeeting?: {
    joinUrl: string;
  };
  organizer?: {
    emailAddress?: {
      address: string;
      name: string;
    };
  };
}

function isGraphError(error: unknown): error is GraphError {
  return typeof error === 'object' && error !== null && 'message' in error;
}

@Injectable()
export class TeamsService {
  private graphClient: Client;

  constructor() {
    console.log('Azure Credentials:', {
      tenantId: process.env.AZURE_TENANT_ID?.substring(0, 5) + '...',
      clientId: process.env.AZURE_CLIENT_ID?.substring(0, 5) + '...',
      hasSecret: !!process.env.AZURE_CLIENT_SECRET,
    });

    if (
      !process.env.AZURE_TENANT_ID ||
      !process.env.AZURE_CLIENT_ID ||
      !process.env.AZURE_CLIENT_SECRET
    ) {
      throw new Error(
        'Missing required Azure credentials in environment variables',
      );
    }

    const credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID,
      process.env.AZURE_CLIENT_ID,
      process.env.AZURE_CLIENT_SECRET,
    );

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default'],
    });

    this.graphClient = Client.initWithMiddleware({
      authProvider,
    });
  }

  async getAllUsers(): Promise<TeamsUser[]> {
    try {
      const response = (await this.graphClient
        .api('/users')
        .select('id,displayName,mail,userPrincipalName')
        .get()) as GraphApiResponse<TeamsUser>;
      return response.value;
    } catch (error: unknown) {
      throw new Error(
        `Failed to fetch users: ${isGraphError(error) ? error.message : 'Unknown error'}`,
      );
    }
  }

  async createOnlineMeeting(
    subject: string,
    startTime: string,
    endTime: string,
    userId: string,
  ): Promise<OnlineMeeting> {
    try {
      // First create the online meeting
      const meeting = (await this.graphClient
        .api(`/users/${userId}/onlineMeetings`)
        .post({
          startDateTime: startTime,
          endDateTime: endTime,
          subject: subject,
        })) as OnlineMeeting;

      // Then create a calendar event with the online meeting information
      await this.graphClient.api(`/users/${userId}/events`).post({
        subject: subject,
        start: {
          dateTime: startTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: endTime,
          timeZone: 'UTC',
        },
        isOnlineMeeting: true,
        onlineMeeting: {
          joinUrl: meeting.joinUrl,
        },
      });

      return meeting;
    } catch (error: unknown) {
      console.error('Detailed error:', error);
      throw new Error(
        `Failed to create online meeting: ${isGraphError(error) ? error.message : 'Unknown error'}`,
      );
    }
  }

  async checkUserInMeeting(userId: string): Promise<boolean> {
    try {
      const presence = (await this.graphClient
        .api(`/users/${userId}/presence`)
        .get()) as PresenceResponse;

      return (
        presence.activity === 'InAMeeting' ||
        presence.activity === 'InACall' ||
        presence.availability === 'Busy'
      );
    } catch (error: unknown) {
      throw new Error(
        `Failed to check user meeting status: ${isGraphError(error) ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getAllUsersWithPresence(): Promise<TeamsUserWithPresence[]> {
    try {
      const users = await this.getAllUsers();
      const usersWithPresence = await Promise.all(
        users.map(async (user) => {
          const isInMeeting = await this.checkUserInMeeting(user.id);
          return {
            ...user,
            isInMeeting,
          };
        }),
      );
      return usersWithPresence;
    } catch (error: unknown) {
      throw new Error(
        `Failed to fetch users with presence: ${isGraphError(error) ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getUserMeetingHistory(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<MeetingHistoryItem[]> {
    try {
      console.log('Fetching meetings for user:', userId);
      console.log('Date range:', { startDate, endDate });

      const response = (await this.graphClient
        .api(`/users/${userId}/calendar/events`)
        .filter(
          `start/dateTime ge '${startDate}' and end/dateTime le '${endDate}'`,
        )
        .select('subject,start,end,isOnlineMeeting,onlineMeeting')
        .orderby('start/dateTime')
        .get()) as GraphApiResponse<CalendarEvent>;

      console.log('API Response:', JSON.stringify(response, null, 2));

      return response.value
        .filter((event) => event.isOnlineMeeting)
        .map((event) => ({
          subject: event.subject,
          startDateTime: event.start.dateTime,
          endDateTime: event.end.dateTime,
          isOnlineMeeting: event.isOnlineMeeting,
          joinUrl: event.onlineMeeting?.joinUrl,
        }));
    } catch (error: unknown) {
      console.error('Detailed error:', error);
      if (isGraphError(error)) {
        console.error('Graph API Error:', {
          message: error.message,
          error: JSON.stringify(error, null, 2),
        });
      }
      throw new Error(
        `Failed to fetch meeting history: ${isGraphError(error) ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getUserMeetings(userId: string): Promise<OrganizationMeeting[]> {
    try {
      console.log('Fetching meetings for user:', userId);

      // Set date range to last 2 months
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);

      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();

      console.log('Date range:', {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      });

      const response = (await this.graphClient
        .api(`/users/${userId}/events`)
        .filter(
          `start/dateTime ge '${formattedStartDate}' and end/dateTime le '${formattedEndDate}'`,
        )
        .select('id,subject,start,end,isOnlineMeeting,onlineMeeting,organizer')
        .orderby('start/dateTime')
        .get()) as GraphApiResponse<CalendarEvent>;

      // Filter for online meetings and map to required format
      return response.value
        .filter((event) => event.onlineMeeting?.joinUrl)
        .map((event) => ({
          id: event.id,
          subject: event.subject,
          startDateTime: event.start.dateTime,
          endDateTime: event.end.dateTime,
          organizerEmail: event.organizer?.emailAddress?.address || '',
          organizerName: event.organizer?.emailAddress?.name || '',
          joinUrl: event.onlineMeeting?.joinUrl || '',
        }));
    } catch (error: unknown) {
      console.error('Detailed error:', error);
      throw new Error(
        `Failed to fetch user meetings: ${isGraphError(error) ? error.message : 'Unknown error'}`,
      );
    }
  }
}
