import { InputType, Field, ID } from '@nestjs/graphql';
import { BreakType } from 'src/generated-nestjs-typegraphql';

@InputType()
export class StartBreakInput {
  @Field(() => BreakType)
  type: BreakType;

  @Field(() => ID)
  sessionId: string;
}

@InputType()
export class EndBreakInput {
  @Field()
  id: string;
}
