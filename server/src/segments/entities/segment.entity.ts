import { ObjectType, Field, ID } from '@nestjs/graphql';
import { SegmentType, Session } from '../../generated-nestjs-typegraphql';
import { Break } from '../../breaks/entities/break.entity';
import { Project } from '../../projects/entities/project.entity';

@ObjectType()
export class Segment {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  sessionId: string;

  @Field(() => Session)
  session: Session;

  @Field(() => SegmentType)
  type: SegmentType;

  @Field(() => String, { nullable: true })
  projectId?: string;

  @Field(() => Project, { nullable: true })
  project?: Project;

  @Field(() => String, { nullable: true })
  breakId?: string;

  @Field(() => Break, { nullable: true })
  break?: Break;

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
