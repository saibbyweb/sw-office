import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEmail, MinLength } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(6)
  password: string;
}

@InputType()
export class RegisterInput extends LoginInput {
  @Field()
  @MinLength(2)
  name: string;

  @Field({ nullable: true })
  slackUserId?: string;

  @Field(() => Int, { nullable: true })
  salaryINR?: number;
}
