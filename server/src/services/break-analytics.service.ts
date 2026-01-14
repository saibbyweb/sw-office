import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OpenAIService } from './openai.service';

export interface BreakSegmentData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  breakType: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  hourOfDay: number;
  dayOfWeek: number;
}

export interface UserBreakStats {
  userId: string;
  userName: string;
  userEmail: string;
  totalBreaks: number;
  averageBreakDuration: number;
  totalBreakTime: number;
  breaksByType: Record<string, number>;
  breaksByHour: Record<number, number>;
  breaksByDayOfWeek: Record<number, number>;
  averageBreaksPerDay: number;
  longestBreak: number;
  shortestBreak: number;
  outlierBreaks: BreakSegmentData[];
}

export interface BreakAnomalyAnalysis {
  usersWithFewerBreaks: Array<{
    userId: string;
    userName: string;
    totalBreaks: number;
    averageBreaksPerDay: number;
    percentageBelow: number;
  }>;
  usersWithLongerBreaks: Array<{
    userId: string;
    userName: string;
    averageBreakDuration: number;
    percentageAbove: number;
  }>;
  unusualTimePatterns: Array<{
    userId: string;
    userName: string;
    pattern: string;
    description: string;
  }>;
  overallStats: {
    totalUsers: number;
    averageBreaksPerUserPerDay: number;
    averageBreakDuration: number;
    mostCommonBreakHours: number[];
    leastActiveUsers: string[];
  };
}

export interface BreakAnalyticsReport {
  dateRange: {
    from: Date;
    to: Date;
  };
  userStats: UserBreakStats[];
  anomalyAnalysis: BreakAnomalyAnalysis;
  aiInsights?: string;
}

@Injectable()
export class BreakAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openaiService: OpenAIService,
  ) {}

  async getBreakSegments(
    startDate: Date,
    endDate: Date,
  ): Promise<BreakSegmentData[]> {
    const segments = await this.prisma.segment.findMany({
      where: {
        type: 'BREAK',
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        break: true,
        session: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                archived: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return segments
      .filter((s) => s.session && s.session.user && !s.session.user.archived)
      .map((segment) => ({
        id: segment.id,
        userId: segment.session.user.id,
        userName: segment.session.user.name,
        userEmail: segment.session.user.email,
        breakType: segment.break?.type || 'UNKNOWN',
        startTime: segment.startTime,
        endTime: segment.endTime || undefined,
        duration: segment.duration,
        hourOfDay: segment.startTime.getHours(),
        dayOfWeek: segment.startTime.getDay(),
      }));
  }

  async analyzeUserBreakPatterns(
    userId: string,
    breakSegments: BreakSegmentData[],
    startDate: Date,
    endDate: Date,
  ): Promise<UserBreakStats | null> {
    const userBreaks = breakSegments.filter((b) => b.userId === userId);
    const user = userBreaks[0];

    if (!user || userBreaks.length === 0) {
      return null;
    }

    const totalBreaks = userBreaks.length;
    const totalBreakTime = userBreaks.reduce((sum, b) => sum + b.duration, 0);
    const averageBreakDuration =
      totalBreaks > 0 ? totalBreakTime / totalBreaks : 0;

    const daysInRange =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) || 1;

    const breaksByType: Record<string, number> = {};
    userBreaks.forEach((b) => {
      breaksByType[b.breakType] = (breaksByType[b.breakType] || 0) + 1;
    });

    const breaksByHour: Record<number, number> = {};
    userBreaks.forEach((b) => {
      breaksByHour[b.hourOfDay] = (breaksByHour[b.hourOfDay] || 0) + 1;
    });

    const breaksByDayOfWeek: Record<number, number> = {};
    userBreaks.forEach((b) => {
      breaksByDayOfWeek[b.dayOfWeek] =
        (breaksByDayOfWeek[b.dayOfWeek] || 0) + 1;
    });

    const durations = userBreaks.map((b) => b.duration);
    const mean = averageBreakDuration;
    const variance =
      durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) /
      durations.length;
    const stdDev = Math.sqrt(variance);
    const outlierBreaks = userBreaks.filter(
      (b) => Math.abs(b.duration - mean) > 2 * stdDev,
    );

    return {
      userId,
      userName: user.userName,
      userEmail: user.userEmail,
      totalBreaks,
      averageBreakDuration,
      totalBreakTime,
      breaksByType,
      breaksByHour,
      breaksByDayOfWeek,
      averageBreaksPerDay: totalBreaks / daysInRange,
      longestBreak: Math.max(...durations, 0),
      shortestBreak: durations.length > 0 ? Math.min(...durations) : 0,
      outlierBreaks,
    };
  }

  detectAnomalies(userStats: UserBreakStats[]): BreakAnomalyAnalysis {
    if (userStats.length === 0) {
      return {
        usersWithFewerBreaks: [],
        usersWithLongerBreaks: [],
        unusualTimePatterns: [],
        overallStats: {
          totalUsers: 0,
          averageBreaksPerUserPerDay: 0,
          averageBreakDuration: 0,
          mostCommonBreakHours: [],
          leastActiveUsers: [],
        },
      };
    }

    const avgBreaksPerDay =
      userStats.reduce((sum, u) => sum + u.averageBreaksPerDay, 0) /
      userStats.length;
    const avgBreakDuration =
      userStats.reduce((sum, u) => sum + u.averageBreakDuration, 0) /
      userStats.length;

    const usersWithFewerBreaks = userStats
      .filter((u) => u.averageBreaksPerDay < avgBreaksPerDay * 0.5)
      .map((u) => ({
        userId: u.userId,
        userName: u.userName,
        totalBreaks: u.totalBreaks,
        averageBreaksPerDay: u.averageBreaksPerDay,
        percentageBelow:
          ((avgBreaksPerDay - u.averageBreaksPerDay) / avgBreaksPerDay) * 100,
      }))
      .sort((a, b) => a.averageBreaksPerDay - b.averageBreaksPerDay);

    const usersWithLongerBreaks = userStats
      .filter((u) => u.averageBreakDuration > avgBreakDuration * 1.5)
      .map((u) => ({
        userId: u.userId,
        userName: u.userName,
        averageBreakDuration: u.averageBreakDuration,
        percentageAbove:
          ((u.averageBreakDuration - avgBreakDuration) / avgBreakDuration) *
          100,
      }))
      .sort((a, b) => b.averageBreakDuration - a.averageBreakDuration);

    const unusualTimePatterns: Array<{
      userId: string;
      userName: string;
      pattern: string;
      description: string;
    }> = [];

    userStats.forEach((user) => {
      const lateNightBreaks = Object.entries(user.breaksByHour)
        .filter(([hour]) => parseInt(hour) >= 23 || parseInt(hour) < 6)
        .reduce((sum, [, count]) => sum + count, 0);

      if (lateNightBreaks > user.totalBreaks * 0.2) {
        unusualTimePatterns.push({
          userId: user.userId,
          userName: user.userName,
          pattern: 'late_night_breaks',
          description: `${Math.round((lateNightBreaks / user.totalBreaks) * 100)}% of breaks occur between 11pm-6am`,
        });
      }

      const maxBreaksInHour = Math.max(...Object.values(user.breaksByHour), 0);
      if (maxBreaksInHour > user.totalBreaks * 0.5) {
        const peakHour = Object.entries(user.breaksByHour).find(
          ([, count]) => count === maxBreaksInHour,
        )?.[0];
        unusualTimePatterns.push({
          userId: user.userId,
          userName: user.userName,
          pattern: 'highly_consistent_timing',
          description: `${Math.round((maxBreaksInHour / user.totalBreaks) * 100)}% of breaks occur at ${peakHour}:00`,
        });
      }

      const weekendBreaks =
        (user.breaksByDayOfWeek[0] || 0) + (user.breaksByDayOfWeek[6] || 0);
      if (weekendBreaks > user.totalBreaks * 0.4) {
        unusualTimePatterns.push({
          userId: user.userId,
          userName: user.userName,
          pattern: 'weekend_heavy',
          description: `${Math.round((weekendBreaks / user.totalBreaks) * 100)}% of breaks occur on weekends`,
        });
      }
    });

    const globalBreaksByHour: Record<number, number> = {};
    userStats.forEach((user) => {
      Object.entries(user.breaksByHour).forEach(([hour, count]) => {
        globalBreaksByHour[parseInt(hour)] =
          (globalBreaksByHour[parseInt(hour)] || 0) + count;
      });
    });
    const mostCommonBreakHours = Object.entries(globalBreaksByHour)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    const sortedByBreaks = [...userStats].sort(
      (a, b) => a.totalBreaks - b.totalBreaks,
    );
    const leastActiveCount = Math.ceil(userStats.length * 0.2);
    const leastActiveUsers = sortedByBreaks
      .slice(0, leastActiveCount)
      .map((u) => u.userName);

    return {
      usersWithFewerBreaks,
      usersWithLongerBreaks,
      unusualTimePatterns,
      overallStats: {
        totalUsers: userStats.length,
        averageBreaksPerUserPerDay: avgBreaksPerDay,
        averageBreakDuration: avgBreakDuration,
        mostCommonBreakHours,
        leastActiveUsers,
      },
    };
  }

  async generateAIInsights(
    report: Omit<BreakAnalyticsReport, 'aiInsights'>,
  ): Promise<string> {
    try {
      const summary = this.generateReportSummary(report);
      const prompt = `You are an expert HR and workforce analytics consultant. Analyze the following break pattern data from our employee monitoring system and provide insights about potential fraud, anomalies, or concerning patterns.

${summary}

Please provide:
1. **Key Findings**: Most significant patterns or anomalies
2. **Potential Fraud Indicators**: Any patterns that suggest time theft, clock manipulation, or other fraudulent behavior
3. **Operational Concerns**: Patterns that might indicate burnout, poor work-life balance, or productivity issues
4. **Recommendations**: Specific actions the admin should take to investigate or address issues
5. **Users to Watch**: Specific employees who warrant closer monitoring and why

Be specific, reference actual numbers from the data, and prioritize actionable insights. Focus on patterns that deviate significantly from the norm.`;

      const completion = await this.openaiService['openai'].chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert workforce analytics consultant specializing in detecting fraud and operational anomalies in employee time tracking data.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      return completion.choices[0]?.message?.content || 'No insights generated';
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return 'AI insights unavailable - analysis can still be performed using the data provided.';
    }
  }

  private generateReportSummary(
    report: Omit<BreakAnalyticsReport, 'aiInsights'>,
  ): string {
    const { dateRange, userStats, anomalyAnalysis } = report;

    let summary = `**Analysis Period**: ${dateRange.from.toISOString().split('T')[0]} to ${dateRange.to.toISOString().split('T')[0]}\n\n`;

    summary += `**Overall Statistics**:\n`;
    summary += `- Total Users Analyzed: ${anomalyAnalysis.overallStats.totalUsers}\n`;
    summary += `- Average Breaks Per User Per Day: ${anomalyAnalysis.overallStats.averageBreaksPerUserPerDay.toFixed(2)}\n`;
    summary += `- Average Break Duration: ${Math.round(anomalyAnalysis.overallStats.averageBreakDuration / 60)} minutes\n`;
    summary += `- Most Common Break Hours: ${anomalyAnalysis.overallStats.mostCommonBreakHours.join(', ')}\n\n`;

    if (anomalyAnalysis.usersWithFewerBreaks.length > 0) {
      summary += `**Users with Suspiciously Few Breaks** (${anomalyAnalysis.usersWithFewerBreaks.length}):\n`;
      anomalyAnalysis.usersWithFewerBreaks.slice(0, 5).forEach((user) => {
        summary += `- ${user.userName}: ${user.totalBreaks} total breaks, ${user.averageBreaksPerDay.toFixed(2)} per day (${user.percentageBelow.toFixed(0)}% below average)\n`;
      });
      summary += '\n';
    }

    if (anomalyAnalysis.usersWithLongerBreaks.length > 0) {
      summary += `**Users with Unusually Long Breaks** (${anomalyAnalysis.usersWithLongerBreaks.length}):\n`;
      anomalyAnalysis.usersWithLongerBreaks.slice(0, 5).forEach((user) => {
        summary += `- ${user.userName}: ${Math.round(user.averageBreakDuration / 60)} min average (${user.percentageAbove.toFixed(0)}% above average)\n`;
      });
      summary += '\n';
    }

    if (anomalyAnalysis.unusualTimePatterns.length > 0) {
      summary += `**Unusual Time Patterns** (${anomalyAnalysis.unusualTimePatterns.length}):\n`;
      anomalyAnalysis.unusualTimePatterns.slice(0, 5).forEach((pattern) => {
        summary += `- ${pattern.userName}: ${pattern.description}\n`;
      });
      summary += '\n';
    }

    const usersWithOutliers = userStats
      .filter((u) => u.outlierBreaks.length > 0)
      .sort((a, b) => b.outlierBreaks.length - a.outlierBreaks.length)
      .slice(0, 3);

    if (usersWithOutliers.length > 0) {
      summary += `**Users with Outlier Break Durations**:\n`;
      usersWithOutliers.forEach((user) => {
        summary += `- ${user.userName}: ${user.outlierBreaks.length} breaks significantly deviate from their normal pattern\n`;
      });
      summary += '\n';
    }

    return summary;
  }

  async generateBreakAnalyticsReport(
    monthsBack: number = 2,
  ): Promise<BreakAnalyticsReport> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    const breakSegments = await this.getBreakSegments(startDate, endDate);
    const uniqueUserIds = [...new Set(breakSegments.map((b) => b.userId))];

    const userStats: UserBreakStats[] = [];
    for (const userId of uniqueUserIds) {
      const stats = await this.analyzeUserBreakPatterns(
        userId,
        breakSegments,
        startDate,
        endDate,
      );
      if (stats) {
        userStats.push(stats);
      }
    }

    const anomalyAnalysis = this.detectAnomalies(userStats);

    const reportWithoutAI: Omit<BreakAnalyticsReport, 'aiInsights'> = {
      dateRange: {
        from: startDate,
        to: endDate,
      },
      userStats,
      anomalyAnalysis,
    };

    const aiInsights = await this.generateAIInsights(reportWithoutAI);

    return {
      ...reportWithoutAI,
      aiInsights,
    };
  }
}
