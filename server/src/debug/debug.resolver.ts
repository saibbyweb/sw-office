import { Resolver, Query, Mutation } from '@nestjs/graphql';
import { DebugService } from './debug.service';

@Resolver()
export class DebugResolver {
  constructor(private readonly debugService: DebugService) {}

  @Query(() => String)
  async debugData() {
    const data = await this.debugService.getDebugData();
    return JSON.stringify(data, null, 2);
  }

  @Mutation(() => String)
  async cleanupInconsistentBreaks() {
    const result = await this.debugService.cleanupInconsistentBreaks();
    return JSON.stringify(result, null, 2);
  }
}
