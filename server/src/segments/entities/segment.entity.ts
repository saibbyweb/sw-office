import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { Session } from '../../generated-nestjs-typegraphql';
import { Project } from '../../generated-nestjs-typegraphql';
import { Break } from '../../generated-nestjs-typegraphql';

export enum SegmentType {
  WORK = 'WORK',
  BREAK = 'BREAK',
}

registerEnumType(SegmentType, {
  name: 'SegmentType',
  description: 'The type of segment',
});

@ObjectType()
export class Segment {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  sessionId: string;

  @Field(() => Session)
  session: Session;

  @Field(() => SegmentType)
  type: SegmentType;

  @Field(() => ID, { nullable: true })
  projectId?: string;

  @Field(() => Project, { nullable: true })
  project?: Project;

  @Field(() => ID, { nullable: true })
  breakId?: string;

  @Field(() => Break, { nullable: true })
  break?: Break;

  @Field(() => Date)
  startTime: Date;

  @Field(() => Date, { nullable: true })
  endTime?: Date;

  @Field(() => Int)
  duration: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
