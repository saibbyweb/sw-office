import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Task } from '../generated-nestjs-typegraphql';
import { TaskService, CreateTaskInput } from './task.service';
import { InputType, Field, Float, Int } from '@nestjs/graphql';

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

@Resolver(() => Task)
export class TaskResolver {
  constructor(private readonly taskService: TaskService) {}

  @Query(() => [Task])
  async tasks(): Promise<Task[]> {
    return this.taskService.getAllTasks();
  }

  @Query(() => Task, { nullable: true })
  async task(@Args('id') id: string): Promise<Task | null> {
    return this.taskService.getTaskById(id);
  }

  @Mutation(() => Task)
  async createTask(@Args('input') input: CreateTaskInputType): Promise<Task> {
    return this.taskService.createTask(input);
  }
}
