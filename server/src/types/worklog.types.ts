import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class AddWorkLogInput {
  @Field()
  sessionId: string;

  @Field()
  projectId: string;

  @Field()
  content: string;

  @Field(() => [String], { defaultValue: [] })
  links?: string[];
}

@InputType()
export class UpdateWorkLogInput {
  @Field(() => ID)
  workLogId: string;

  @Field({ nullable: true })
  projectId?: string;

  @Field({ nullable: true })
  content?: string;

  @Field(() => [String], { nullable: true })
  links?: string[];
}
