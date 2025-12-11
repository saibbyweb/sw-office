import { ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { Session, WorkException, StabilityIncident } from 'src/generated-nestjs-typegraphql';

@ObjectType()
export class TeamUser {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field({ nullable: true })
  isOnline?: boolean;

  @Field({ nullable: true })
  currentStatus?: string;

  @Field(() => Session, { nullable: true })
  activeSession?: Session;

  @Field(() => Float)
  availabilityScore: number;

  @Field(() => Float)
  stabilityScore: number;

  @Field(() => Int)
  workingDaysInCycle: number;

  @Field(() => [WorkException], { nullable: true })
  workExceptions?: WorkException[];

  @Field(() => [StabilityIncident], { nullable: true })
  stabilityIncidents?: StabilityIncident[];
}
