import { Resolver, Query, Mutation, Args, ObjectType } from '@nestjs/graphql';
import { Task } from '../generated-nestjs-typegraphql';
import { TaskService, CreateTaskInput, UpdateTaskInput } from './task.service';
import { InputType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
class PaginatedTasksResponse {
  @Field(() => [Task])
  tasks: Task[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;

  @Field(() => Int)
  myTasksCount: number;

  @Field(() => Int)
  availableTasksCount: number;

  @Field(() => Int)
  suggestedTasksCount: number;
}

@InputType()
class CreateTaskInputType {
  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  category: string;

  @Field()
  priority: string;

  @Field(() => Int)
  points: number;

  @Field(() => Float)
  estimatedHours: number;

  @Field({ nullable: true })
  projectId?: string;
}

@InputType()
class UpdateTaskInputType {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  priority?: string;

  @Field(() => Int, { nullable: true })
  points?: number;

  @Field(() => Float, { nullable: true })
  estimatedHours?: number;

  @Field({ nullable: true })
  projectId?: string;
}

@InputType()
class TaskFiltersInput {
  @Field({ nullable: true })
  searchQuery?: string;

  @Field({ nullable: true })
  projectId?: string;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  priority?: string;

  @Field({ nullable: true })
  assignedToId?: string;

  @Field({ nullable: true })
  unassignedOnly?: boolean;

  @Field({ nullable: true })
  myTasksUserId?: string;
}

@Resolver(() => Task)
export class TaskResolver {
  constructor(private readonly taskService: TaskService) {}

  @Query(() => PaginatedTasksResponse)
  async tasks(
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
    @Args('filters', { nullable: true }) filters?: TaskFiltersInput,
    @Args('userId', { type: () => String, nullable: true }) userId?: string,
  ): Promise<PaginatedTasksResponse> {
    return this.taskService.getAllTasks(skip, take, filters, userId);
  }

  @Query(() => Task, { nullable: true })
  async task(@Args('id') id: string): Promise<Task | null> {
    return this.taskService.getTaskById(id);
  }

  @Mutation(() => Task)
  async createTask(@Args('input') input: CreateTaskInputType): Promise<Task> {
    return this.taskService.createTask(input);
  }

  @Mutation(() => Task)
  async assignTask(
    @Args('taskId') taskId: string,
    @Args('userId', { type: () => String, nullable: true }) userId: string | null,
  ): Promise<Task> {
    return this.taskService.assignTask(taskId, userId);
  }

  @Mutation(() => Task)
  async approveTask(
    @Args('taskId') taskId: string,
    @Args('approvedById') approvedById: string,
  ): Promise<Task> {
    return this.taskService.approveTask(taskId, approvedById);
  }

  @Mutation(() => Task)
  async unapproveTask(
    @Args('taskId') taskId: string,
  ): Promise<Task> {
    return this.taskService.unapproveTask(taskId);
  }

  @Mutation(() => Task)
  async updateTask(
    @Args('taskId') taskId: string,
    @Args('input') input: UpdateTaskInputType,
  ): Promise<Task> {
    return this.taskService.updateTask(taskId, input);
  }

  @Mutation(() => Task)
  async completeTask(
    @Args('taskId') taskId: string,
  ): Promise<Task> {
    return this.taskService.completeTask(taskId);
  }

  @Mutation(() => Task)
  async uncompleteTask(
    @Args('taskId') taskId: string,
  ): Promise<Task> {
    return this.taskService.uncompleteTask(taskId);
  }

  @Mutation(() => Task)
  async updateTaskStatus(
    @Args('taskId') taskId: string,
    @Args('status') status: string,
    @Args('userId') userId: string,
  ): Promise<Task> {
    return this.taskService.updateTaskStatus(taskId, status, userId);
  }

  @Query(() => [Task])
  async completedTasks(
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
  ): Promise<Task[]> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.taskService.getCompletedTasks(start, end);
  }
}
