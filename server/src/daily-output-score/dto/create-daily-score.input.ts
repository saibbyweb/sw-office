import { InputType, Field, Float, Int } from '@nestjs/graphql';

@InputType()
export class CreateDailyScoreInput {
  @Field()
  userId: string;

  @Field()
  date: Date;

  @Field(() => Float)
  score: number;

  @Field(() => Int, { nullable: true })
  tasksCompleted?: number;

  @Field(() => Float, { nullable: true })
  taskDifficulty?: number;

  @Field(() => Int, { nullable: true })
  initiativeCount?: number;

  @Field(() => Float, { nullable: true })
  qualityRating?: number;

  @Field(() => Float, { nullable: true })
  availabilityRating?: number;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  assignedById?: string;
}
