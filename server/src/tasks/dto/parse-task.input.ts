import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class ParseTaskInput {
  @Field()
  naturalLanguageInput: string;
}
