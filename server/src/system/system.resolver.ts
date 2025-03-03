import { Resolver, Query, Args } from '@nestjs/graphql';
import { SystemService } from './system.service';

@Resolver()
export class SystemResolver {
  constructor(private readonly systemService: SystemService) {}

  @Query(() => String, { description: 'Get the latest app version' })
  async latestAppVersion(): Promise<string> {
    return this.systemService.getLatestVersion();
  }

  @Query(() => String, {
    description: 'Get the GitHub release URL for a specific version',
  })
  async getReleaseUrl(@Args('version') version: string): Promise<string> {
    return this.systemService.getReleaseUrl(version);
  }
}
