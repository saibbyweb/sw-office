import { InputType, Field } from '@nestjs/graphql';
import { BreakType } from 'src/generated-nestjs-typegraphql';

@InputType()
export class StartBreakInput {
  @Field(() => BreakType)
  type: BreakType;
}

@InputType()
export class EndBreakInput {
  @Field()
  id: string;
}
