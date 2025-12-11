import { InputType, Field } from '@nestjs/graphql';
import { IsArray, IsString, IsUrl } from 'class-validator';

@InputType()
export class UpdatePrLinksInput {
  @Field()
  @IsString()
  taskId: string;

  @Field(() => [String])
  @IsArray()
  @IsUrl({}, { each: true, message: 'Each PR link must be a valid URL' })
  prLinks: string[];
}
