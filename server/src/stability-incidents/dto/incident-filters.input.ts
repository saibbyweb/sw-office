import { InputType, Field, Int } from '@nestjs/graphql';
import { IncidentSeverity, IncidentType } from '@prisma/client';

@InputType()
export class IncidentFiltersInput {
  @Field({ nullable: true })
  userId?: string;

  @Field({ nullable: true })
  taskId?: string;

  @Field(() => String, { nullable: true })
  type?: IncidentType;

  @Field(() => String, { nullable: true })
  severity?: IncidentSeverity;

  @Field({ nullable: true })
  resolved?: boolean; // Filter by resolved/unresolved

  @Field(() => Int, { nullable: true })
  startDate?: number; // Epoch timestamp in seconds

  @Field(() => Int, { nullable: true })
  endDate?: number; // Epoch timestamp in seconds

  @Field({ nullable: true })
  searchQuery?: string; // Search in title, description
}
