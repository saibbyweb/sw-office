import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Project } from '../generated-nestjs-typegraphql';
import { ProjectService } from '../services/project.service';

@Resolver(() => Project)
@UseGuards(JwtGuard)
export class ProjectResolver {
  constructor(private readonly projectService: ProjectService) {}

  @Query(() => [Project])
  async projects(@CurrentUser() userId: string): Promise<Project[]> {
    return this.projectService.getUserProjects(userId);
  }
}
