import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { TeamsService } from './teams.service';
import {
  TeamsUser,
  OnlineMeeting,
  MeetingStatus,
  TeamsUserWithPresence,
  MeetingHistoryItem,
  OrganizationMeeting,
} from './teams.types';

@Resolver('Teams')
export class TeamsResolver {
  constructor(private readonly teamsService: TeamsService) {}

  @Query(() => [TeamsUser])
  async getAllUsers(): Promise<TeamsUser[]> {
    return this.teamsService.getAllUsers();
  }

  @Query(() => [TeamsUserWithPresence])
  async getAllUsersWithPresence(): Promise<TeamsUserWithPresence[]> {
    return this.teamsService.getAllUsersWithPresence();
  }

  @Mutation(() => OnlineMeeting)
  async createOnlineMeeting(
    @Args('subject') subject: string,
    @Args('startTime') startTime: string,
    @Args('endTime') endTime: string,
    @Args('userId') userId: string,
  ): Promise<OnlineMeeting> {
    return this.teamsService.createOnlineMeeting(
      subject,
      startTime,
      endTime,
      userId,
    );
  }

  @Query(() => MeetingStatus)
  async checkUserInMeeting(
    @Args('userId') userId: string,
  ): Promise<MeetingStatus> {
    const isInMeeting = await this.teamsService.checkUserInMeeting(userId);
    return { isInMeeting };
  }

  @Query(() => [MeetingHistoryItem])
  async getUserMeetingHistory(
    @Args('userId') userId: string,
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
  ): Promise<MeetingHistoryItem[]> {
    return this.teamsService.getUserMeetingHistory(userId, startDate, endDate);
  }

  @Query(() => [OrganizationMeeting])
  async getUserMeetings(
    @Args('userId') userId: string,
  ): Promise<OrganizationMeeting[]> {
    return this.teamsService.getUserMeetings(userId);
  }
}
