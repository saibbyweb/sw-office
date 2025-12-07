import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DailyOutputScore } from '../generated-nestjs-typegraphql';
import { DailyOutputScoreService } from './daily-output-score.service';
import { CreateDailyScoreInput } from './dto/create-daily-score.input';
import { UpdateDailyScoreInput } from './dto/update-daily-score.input';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Resolver(() => DailyOutputScore)
export class DailyOutputScoreResolver {
  constructor(
    private readonly dailyOutputScoreService: DailyOutputScoreService,
  ) {}

  @Mutation(() => DailyOutputScore)
  @UseGuards(JwtGuard)
  async createOrUpdateDailyScore(
    @Args('input') input: CreateDailyScoreInput,
  ): Promise<DailyOutputScore> {
    return this.dailyOutputScoreService.createOrUpdateDailyScore(input);
  }

  @Mutation(() => DailyOutputScore)
  @UseGuards(JwtGuard)
  async updateDailyScore(
    @Args('id') id: string,
    @Args('input') input: UpdateDailyScoreInput,
  ): Promise<DailyOutputScore> {
    return this.dailyOutputScoreService.updateDailyScore(id, input);
  }

  @Query(() => [DailyOutputScore])
  @UseGuards(JwtGuard)
  async dailyScoresByUser(
    @Args('userId') userId: string,
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
  ): Promise<DailyOutputScore[]> {
    return this.dailyOutputScoreService.getDailyScoresByUser(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Query(() => [DailyOutputScore])
  @UseGuards(JwtGuard)
  async dailyScoresByDate(@Args('date') date: string): Promise<DailyOutputScore[]> {
    return this.dailyOutputScoreService.getDailyScoresByDate(new Date(date));
  }

  @Query(() => DailyOutputScore, { nullable: true })
  @UseGuards(JwtGuard)
  async dailyScoreByUserAndDate(
    @Args('userId') userId: string,
    @Args('date') date: string,
  ): Promise<DailyOutputScore | null> {
    return this.dailyOutputScoreService.getDailyScoreByUserAndDate(
      userId,
      new Date(date),
    );
  }

  @Query(() => [DailyOutputScore])
  @UseGuards(JwtGuard)
  async allDailyScores(
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
  ): Promise<DailyOutputScore[]> {
    return this.dailyOutputScoreService.getAllDailyScores(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Mutation(() => DailyOutputScore)
  @UseGuards(JwtGuard)
  async deleteDailyScore(@Args('id') id: string): Promise<DailyOutputScore> {
    return this.dailyOutputScoreService.deleteDailyScore(id);
  }
}
