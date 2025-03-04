import { Injectable } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';

@Injectable()
export class TeamsService {
  private graphClient: Client;

  constructor() {
    console.log(process.env);
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

  async getAllUsers(): Promise<any[]> {
    try {
      const response = await this.graphClient
        .api('/users')
        .select('id,displayName,mail,userPrincipalName')
        .get();
      return response.value;
    } catch (error: any) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  async createOnlineMeeting(
    subject: string,
    startTime: string,
    endTime: string,
    userId: string,
  ): Promise<any> {
    try {
      const meeting = await this.graphClient
        .api(`/users/${userId}/onlineMeetings`)
        .post({
          startDateTime: startTime,
          endDateTime: endTime,
          subject: subject,
        });
      return meeting;
    } catch (error: any) {
      throw new Error(`Failed to create online meeting: ${error.message}`);
    }
  }

  async checkUserInMeeting(userId: string): Promise<boolean> {
    try {
      const presence = await this.graphClient
        .api(`/users/${userId}/presence`)
        .get();

      console.log('Presence data:', presence); // Debug log

      // Check for both 'InAMeeting' and 'InACall' activities
      return (
        presence.activity === 'InAMeeting' ||
        presence.activity === 'InACall' ||
        presence.availability === 'Busy'
      );
    } catch (error: any) {
      console.error('Presence check error:', error); // Debug log
      throw new Error(`Failed to check user meeting status: ${error.message}`);
    }
  }

  async getAllUsersWithPresence(): Promise<any[]> {
    try {
      const users = await this.getAllUsers();

      // Get presence for all users in parallel
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
    } catch (error: any) {
      throw new Error(`Failed to fetch users with presence: ${error.message}`);
    }
  }
}
