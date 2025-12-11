import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { StabilityIncident } from '../generated-nestjs-typegraphql';
import { StabilityIncidentsService } from './stability-incidents.service';
import { CreateStabilityIncidentInput } from './dto/create-incident.input';
import { UpdateStabilityIncidentInput } from './dto/update-incident.input';
import { IncidentFiltersInput } from './dto/incident-filters.input';

@Resolver(() => StabilityIncident)
export class StabilityIncidentsResolver {
  constructor(
    private readonly stabilityIncidentsService: StabilityIncidentsService,
  ) {}

  @Mutation(() => StabilityIncident)
  async createStabilityIncident(
    @Args('input') input: CreateStabilityIncidentInput,
  ): Promise<StabilityIncident> {
    return this.stabilityIncidentsService.createIncident(input);
  }

  @Mutation(() => StabilityIncident)
  async updateStabilityIncident(
    @Args('id') id: string,
    @Args('input') input: UpdateStabilityIncidentInput,
  ): Promise<StabilityIncident> {
    return this.stabilityIncidentsService.updateIncident(id, input);
  }

  @Mutation(() => Boolean)
  async deleteStabilityIncident(@Args('id') id: string): Promise<boolean> {
    return this.stabilityIncidentsService.deleteIncident(id);
  }

  @Query(() => StabilityIncident, { nullable: true })
  async stabilityIncident(
    @Args('id') id: string,
  ): Promise<StabilityIncident | null> {
    return this.stabilityIncidentsService.getIncidentById(id);
  }

  @Query(() => [StabilityIncident])
  async stabilityIncidents(
    @Args('filters', { nullable: true }) filters?: IncidentFiltersInput,
  ): Promise<StabilityIncident[]> {
    return this.stabilityIncidentsService.getAllIncidents(filters);
  }

  @Mutation(() => StabilityIncident)
  async resolveStabilityIncident(
    @Args('id') id: string,
    @Args('resolutionNotes') resolutionNotes: string,
    @Args('resolvedAt', { type: () => Int }) resolvedAt: number,
    @Args('resolutionTaskId', { nullable: true }) resolutionTaskId?: string,
  ): Promise<StabilityIncident> {
    return this.stabilityIncidentsService.resolveIncident(
      id,
      resolutionNotes,
      resolvedAt,
      resolutionTaskId,
    );
  }

  @Mutation(() => StabilityIncident)
  async unresolveStabilityIncident(
    @Args('id') id: string,
  ): Promise<StabilityIncident> {
    return this.stabilityIncidentsService.unresolveIncident(id);
  }
}
