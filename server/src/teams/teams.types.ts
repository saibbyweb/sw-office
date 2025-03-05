import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class TeamsUser {
  @Field(() => ID)
  id: string;

  @Field()
  displayName: string;

  @Field()
  mail: string;

  @Field()
  userPrincipalName: string;
}

@ObjectType()
export class TeamsUserWithPresence extends TeamsUser {
  @Field()
  isInMeeting: boolean;
}

@ObjectType()
export class OnlineMeeting {
  @Field(() => ID)
  id: string;

  @Field()
  joinUrl: string;

  @Field()
  subject: string;

  @Field()
  startDateTime: string;

  @Field()
  endDateTime: string;
}

@ObjectType()
export class MeetingStatus {
  @Field()
  isInMeeting: boolean;
}

@ObjectType()
export class MeetingHistoryItem {
  @Field()
  subject: string;

  @Field()
  startDateTime: string;

  @Field()
  endDateTime: string;

  @Field()
  isOnlineMeeting: boolean;

  @Field({ nullable: true })
  joinUrl?: string;
}

@ObjectType()
export class MeetingAttendee {
  @Field()
  emailAddress: string;

  @Field()
  displayName: string;

  @Field()
  joinDateTime: string;

  @Field({ nullable: true })
  leaveDateTime?: string;

  @Field()
  duration: number;
}

@ObjectType()
export class MeetingAttendanceReport {
  @Field()
  meetingId: string;

  @Field()
  meetingStartDateTime: string;

  @Field()
  meetingEndDateTime: string;

  @Field(() => [MeetingAttendee])
  attendees: MeetingAttendee[];
}

@ObjectType()
export class OrganizationMeeting {
  @Field(() => ID)
  id: string;

  @Field()
  subject: string;

  @Field()
  startDateTime: string;

  @Field()
  endDateTime: string;

  @Field()
  organizerEmail: string;

  @Field()
  organizerName: string;

  @Field()
  joinUrl: string;
}
