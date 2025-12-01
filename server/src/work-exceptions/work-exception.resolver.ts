import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { WorkExceptionService } from './work-exception.service';
import { Field, ObjectType, Int } from '@nestjs/graphql';
import { WorkException, ExceptionType } from '../generated-nestjs-typegraphql';

@ObjectType()
class WorkExceptionStats {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  fullDayLeaves: number;

  @Field(() => Int)
  halfDayLeaves: number;

  @Field(() => Int)
  lateArrivals: number;

  @Field(() => Int)
  earlyExits: number;

  @Field(() => Int)
  workFromHome: number;

  @Field(() => Int)
  sickLeaves: number;

  @Field(() => Int)
  emergencyLeaves: number;
}

@Resolver(() => WorkException)
export class WorkExceptionResolver {
  constructor(private workExceptionService: WorkExceptionService) {}

  @Mutation(() => WorkException)
  async createWorkException(
    @Args('userId') userId: string,
    @Args('type', { type: () => ExceptionType }) type: ExceptionType,
    @Args('date') date: string,
    @Args('scheduledTime', { nullable: true }) scheduledTime?: string,
    @Args('actualTime', { nullable: true }) actualTime?: string,
    @Args('reason', { nullable: true }) reason?: string,
    @Args('notes', { nullable: true }) notes?: string,
  ): Promise<any> {
    return this.workExceptionService.createWorkException(
      userId,
      type,
      new Date(date),
      scheduledTime ? new Date(scheduledTime) : undefined,
      actualTime ? new Date(actualTime) : undefined,
      reason,
      notes,
    );
  }

  @Query(() => [WorkException])
  async workExceptions(
    @Args('userId', { nullable: true }) userId?: string,
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
    @Args('type', { type: () => ExceptionType, nullable: true }) type?: ExceptionType,
  ): Promise<any[]> {
    return this.workExceptionService.getWorkExceptions(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      type,
    );
  }

  @Query(() => WorkException, { nullable: true })
  async workException(@Args('id') id: string): Promise<any> {
    return this.workExceptionService.getWorkExceptionById(id);
  }

  @Mutation(() => WorkException)
  async updateWorkException(
    @Args('id') id: string,
    @Args('type', { type: () => ExceptionType, nullable: true }) type?: ExceptionType,
    @Args('date', { nullable: true }) date?: string,
    @Args('scheduledTime', { nullable: true }) scheduledTime?: string,
    @Args('actualTime', { nullable: true }) actualTime?: string,
    @Args('reason', { nullable: true }) reason?: string,
    @Args('notes', { nullable: true }) notes?: string,
  ): Promise<any> {
    return this.workExceptionService.updateWorkException(
      id,
      type,
      date ? new Date(date) : undefined,
      scheduledTime ? new Date(scheduledTime) : undefined,
      actualTime ? new Date(actualTime) : undefined,
      reason,
      notes,
    );
  }

  @Mutation(() => WorkException)
  async deleteWorkException(@Args('id') id: string): Promise<any> {
    return this.workExceptionService.deleteWorkException(id);
  }

  @Query(() => WorkExceptionStats)
  async workExceptionStats(
    @Args('userId', { nullable: true }) userId?: string,
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
  ): Promise<WorkExceptionStats> {
    return this.workExceptionService.getWorkExceptionStats(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
