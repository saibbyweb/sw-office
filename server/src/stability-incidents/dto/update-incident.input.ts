import { InputType, Field, Int } from '@nestjs/graphql';
import { IncidentSeverity, IncidentType } from '@prisma/client';

@InputType()
export class UpdateStabilityIncidentInput {
  @Field(() => String, { nullable: true })
  type?: IncidentType;

  @Field(() => String, { nullable: true })
  severity?: IncidentSeverity;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  taskId?: string;

  @Field(() => Int, { nullable: true })
  incidentDate?: number;

  @Field(() => Int, { nullable: true })
  resolvedAt?: number;

  @Field({ nullable: true })
  resolutionNotes?: string;

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
