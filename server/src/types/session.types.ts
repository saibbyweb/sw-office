import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsDate } from 'class-validator';
import { SessionStatus } from '../generated-nestjs-typegraphql';

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

@InputType()
export class GetSessionsInput {
  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  endDate?: Date;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  projectIds?: string[];

  @Field(() => [SessionStatus], { nullable: true })
  @IsOptional()
  statuses?: SessionStatus[];

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  sortDescending?: boolean;
}
