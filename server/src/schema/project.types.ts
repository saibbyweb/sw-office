import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';

@ObjectType()
export class Project {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  isCustom: boolean;

  @Field(() => ID)
  userId: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@InputType()
export class CreateProjectInput {
  @Field()
  name: string;

  @Field(() => Boolean, { defaultValue: false })
  isCustom: boolean;
}

@InputType()
export class UpdateProjectInput {
  @Field({ nullable: true })
  name?: string;

  @Field(() => Boolean, { nullable: true })
  isCustom?: boolean;
}
