import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum SegmentType {
  WORK = 'WORK',
  BREAK = 'BREAK',
}

registerEnumType(SegmentType, {
  name: 'SegmentType',
  description: 'Type of segment (work or break)',
});

@ObjectType()
export class Segment {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  sessionId: string;

  @Field(() => SegmentType)
  type: SegmentType;

  @Field(() => ID, { nullable: true })
  projectId?: string;

  @Field(() => ID, { nullable: true })
  breakId?: string;

  @Field(() => Date)
  startTime: Date;

  @Field(() => Date, { nullable: true })
  endTime?: Date;

  @Field(() => Number)
  duration: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
