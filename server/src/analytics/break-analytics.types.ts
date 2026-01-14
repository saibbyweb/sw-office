import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class BreakSegmentDataType {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  userName: string;

  @Field()
  userEmail: string;

  @Field()
  breakType: string;

  @Field()
  startTime: Date;

  @Field({ nullable: true })
  endTime?: Date;

  @Field(() => Int)
  duration: number;

  @Field(() => Int)
  hourOfDay: number;

  @Field(() => Int)
  dayOfWeek: number;
}

@ObjectType()
export class BreaksByTypeType {
  @Field()
  type: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class BreaksByHourType {
  @Field(() => Int)
  hour: number;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class BreaksByDayType {
  @Field(() => Int)
  day: number;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class UserBreakStatsType {
  @Field()
  userId: string;

  @Field()
  userName: string;

  @Field()
  userEmail: string;

  @Field(() => Int)
  totalBreaks: number;

  @Field(() => Float)
  averageBreakDuration: number;

  @Field(() => Int)
  totalBreakTime: number;

  @Field(() => [BreaksByTypeType])
  breaksByType: BreaksByTypeType[];

  @Field(() => [BreaksByHourType])
  breaksByHour: BreaksByHourType[];

  @Field(() => [BreaksByDayType])
  breaksByDayOfWeek: BreaksByDayType[];

  @Field(() => Float)
  averageBreaksPerDay: number;

  @Field(() => Int)
  longestBreak: number;

  @Field(() => Int)
  shortestBreak: number;

  @Field(() => [BreakSegmentDataType])
  outlierBreaks: BreakSegmentDataType[];
}

@ObjectType()
export class UserWithFewerBreaksType {
  @Field()
  userId: string;

  @Field()
  userName: string;

  @Field(() => Int)
  totalBreaks: number;

  @Field(() => Float)
  averageBreaksPerDay: number;

  @Field(() => Float)
  percentageBelow: number;
}

@ObjectType()
export class UserWithLongerBreaksType {
  @Field()
  userId: string;

  @Field()
  userName: string;

  @Field(() => Float)
  averageBreakDuration: number;

  @Field(() => Float)
  percentageAbove: number;
}

@ObjectType()
export class UnusualTimePatternType {
  @Field()
  userId: string;

  @Field()
  userName: string;

  @Field()
  pattern: string;

  @Field()
  description: string;
}

@ObjectType()
export class OverallStatsType {
  @Field(() => Int)
  totalUsers: number;

  @Field(() => Float)
  averageBreaksPerUserPerDay: number;

  @Field(() => Float)
  averageBreakDuration: number;

  @Field(() => [Int])
  mostCommonBreakHours: number[];

  @Field(() => [String])
  leastActiveUsers: string[];
}

@ObjectType()
export class BreakAnomalyAnalysisType {
  @Field(() => [UserWithFewerBreaksType])
  usersWithFewerBreaks: UserWithFewerBreaksType[];

  @Field(() => [UserWithLongerBreaksType])
  usersWithLongerBreaks: UserWithLongerBreaksType[];

  @Field(() => [UnusualTimePatternType])
  unusualTimePatterns: UnusualTimePatternType[];

  @Field(() => OverallStatsType)
  overallStats: OverallStatsType;
}

@ObjectType()
export class DateRangeType {
  @Field()
  from: Date;

  @Field()
  to: Date;
}

@ObjectType()
export class BreakAnalyticsReportType {
  @Field(() => DateRangeType)
  dateRange: DateRangeType;

  @Field(() => [UserBreakStatsType])
  userStats: UserBreakStatsType[];

  @Field(() => BreakAnomalyAnalysisType)
  anomalyAnalysis: BreakAnomalyAnalysisType;

  @Field({ nullable: true })
  aiInsights?: string;
}
