import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class StartSessionInput {
  @Field()
  projectId: string;
}

@InputType()
export class SwitchProjectInput {
  @Field()
  projectId: string;
}
