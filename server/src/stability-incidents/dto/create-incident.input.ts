import { InputType, Field, Int } from '@nestjs/graphql';
import { IncidentSeverity, IncidentType } from '@prisma/client';

@InputType()
export class CreateStabilityIncidentInput {
  @Field()
  userId: string;

  @Field(() => String)
  type: IncidentType;

  @Field(() => String)
  severity: IncidentSeverity;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field({ nullable: true })
  taskId?: string;

  @Field(() => Int)
  incidentDate: number; // Epoch timestamp in seconds

  @Field({ nullable: true })
  reportedById?: string;

  @Field({ nullable: true })
  rootCause?: string;

  @Field({ nullable: true })
  preventionPlan?: string;

  @Field({ nullable: true })
  adminNotes?: string;

  @Field(() => [String], { nullable: true })
  screenshots?: string[];

  @Field(() => [String], { nullable: true })
  logLinks?: string[];
}
