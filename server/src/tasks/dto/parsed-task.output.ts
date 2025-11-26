import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType()
export class ParsedTaskOutput {
  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  category: string;

  @Field()
  priority: string;

  @Field(() => Float)
  estimatedHours: number;

  @Field({ nullable: true })
  projectId?: string;
}
