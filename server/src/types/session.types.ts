import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class StartSessionInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  projectId: string;
}

@InputType()
export class SwitchProjectInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
