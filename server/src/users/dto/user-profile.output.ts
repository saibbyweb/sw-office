import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { User, Task, Session, WorkException, StabilityIncident } from 'src/generated-nestjs-typegraphql';

@ObjectType()
export class UserStatistics {
  @Field(() => Int)
  allottedTasks: number;

  @Field(() => Int)
  completedTasks: number;

  @Field(() => Int)
  inProgressTasks: number;

  @Field(() => Float)
  availabilityScore: number;

  @Field(() => Float)
  stabilityScore: number;

  @Field(() => Int)
  workingDaysInCycle: number;

  @Field(() => Float)
  monthlyOutputScore: number;

  @Field(() => Int)
  totalTasksInCycle: number;

  @Field(() => Int)
  totalRatedTasksInCycle: number;
}

@ObjectType()
export class UserProfile {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field()
  role: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field({ nullable: true })
  isOnline?: boolean;

  @Field({ nullable: true })
  currentStatus?: string;

  @Field()
  createdAt: Date;

  @Field(() => UserStatistics, { nullable: true })
  statistics?: UserStatistics;

  @Field(() => [Task], { nullable: true })
  taskAssignments?: Task[];

  @Field(() => [Task], { nullable: true })
  taskSuggestions?: Task[];

  @Field(() => [Session], { nullable: true })
  sessions?: Session[];

  @Field(() => Session, { nullable: true })
  activeSession?: Session;

  @Field(() => [WorkException], { nullable: true })
  workExceptions?: WorkException[];

  @Field(() => [StabilityIncident], { nullable: true })
  stabilityIncidents?: StabilityIncident[];
}
