import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { User } from 'src/generated-nestjs-typegraphql';

export enum CallStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  ENDED = 'ENDED',
}

registerEnumType(CallStatus, {
  name: 'CallStatus',
  description: 'Status of a call',
});

@ObjectType()
export class Call {
  @Field()
  id: string;

  @Field(() => User)
  caller: User;

  @Field(() => User)
  receiver: User;

  @Field(() => CallStatus)
  status: CallStatus;

  @Field(() => String, { nullable: true })
  meetingLink?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  answeredAt?: Date;
}
