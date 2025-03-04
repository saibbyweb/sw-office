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
