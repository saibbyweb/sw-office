import { InputType, Field } from '@nestjs/graphql';

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
  @Field({ nullable: true })
  projectId?: string;

  @Field({ nullable: true })
  content?: string;

  @Field(() => [String], { nullable: true })
  links?: string[];
}
