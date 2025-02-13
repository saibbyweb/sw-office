import { Resolver, Query } from '@nestjs/graphql';
import { Project } from '../generated-nestjs-typegraphql';
import { ProjectService } from './project.service';

@Resolver(() => Project)
export class ProjectResolver {
  constructor(private readonly projectService: ProjectService) {}

  @Query(() => [Project])
  async projects(): Promise<Project[]> {
    return this.projectService.getActiveProjects();
  }
}
