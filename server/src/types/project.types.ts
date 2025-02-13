import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateProjectInput {
  @Field()
  name: string;

  @Field({ defaultValue: false })
  isCustom?: boolean;
}

@InputType()
export class UpdateProjectInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  isCustom?: boolean;
}
