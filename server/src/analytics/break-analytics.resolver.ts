import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { BreakAnalyticsService } from '../services/break-analytics.service';
import { BreakAnalyticsReportType } from './break-analytics.types';

@Resolver()
export class BreakAnalyticsResolver {
  constructor(
    private readonly breakAnalyticsService: BreakAnalyticsService,
  ) {}

  @Query(() => BreakAnalyticsReportType, {
    description:
      'Generate comprehensive break analytics report with anomaly detection and AI insights',
  })
  async breakAnalyticsReport(
    @Args('monthsBack', {
      type: () => Int,
      defaultValue: 2,
      description: 'Number of months to analyze (default: 2)',
    })
    monthsBack: number,
  ): Promise<BreakAnalyticsReportType> {
    const report =
      await this.breakAnalyticsService.generateBreakAnalyticsReport(monthsBack);

    return {
      dateRange: report.dateRange,
      userStats: report.userStats.map((stats) => ({
        userId: stats.userId,
        userName: stats.userName,
        userEmail: stats.userEmail,
        totalBreaks: stats.totalBreaks,
        averageBreakDuration: stats.averageBreakDuration,
        totalBreakTime: stats.totalBreakTime,
        averageBreaksPerDay: stats.averageBreaksPerDay,
        longestBreak: stats.longestBreak,
        shortestBreak: stats.shortestBreak,
        breaksByType: Object.entries(stats.breaksByType).map(
          ([type, count]) => ({ type, count }),
        ),
        breaksByHour: Object.entries(stats.breaksByHour).map(
          ([hour, count]) => ({
            hour: parseInt(hour),
            count,
          }),
        ),
        breaksByDayOfWeek: Object.entries(stats.breaksByDayOfWeek).map(
          ([day, count]) => ({
            day: parseInt(day),
            count,
          }),
        ),
        outlierBreaks: stats.outlierBreaks.map((outlier) => ({
          id: outlier.id,
          userId: outlier.userId,
          userName: outlier.userName,
          userEmail: outlier.userEmail,
          breakType: outlier.breakType,
          startTime: outlier.startTime,
          endTime: outlier.endTime,
          duration: outlier.duration,
          hourOfDay: outlier.hourOfDay,
          dayOfWeek: outlier.dayOfWeek,
        })),
      })),
      anomalyAnalysis: report.anomalyAnalysis,
      aiInsights: report.aiInsights,
    };
  }
}
