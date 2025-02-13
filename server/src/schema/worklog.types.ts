import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';

@ObjectType()
export class WorkLog {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  sessionId: string;

  @Field(() => ID)
  projectId: string;

  @Field()
  content: string;

  @Field(() => [String])
  links: string[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@InputType()
export class AddWorkLogInput {
  @Field(() => ID)
  sessionId: string;

  @Field(() => ID)
  projectId: string;

  @Field()
  content: string;

  @Field(() => [String], { defaultValue: [] })
  links: string[];
}

@InputType()
export class UpdateWorkLogInput {
  @Field(() => ID, { nullable: true })
  projectId?: string;

  @Field({ nullable: true })
  content?: string;

  @Field(() => [String], { nullable: true })
  links?: string[];
}
