import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { FiArrowLeft, FiAlertTriangle, FiClock, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const BREAK_ANALYTICS_REPORT = gql`
  query BreakAnalyticsReport($monthsBack: Int) {
    breakAnalyticsReport(monthsBack: $monthsBack) {
      dateRange {
        from
        to
      }
      userStats {
        userId
        userName
        userEmail
        totalBreaks
        averageBreakDuration
        totalBreakTime
        averageBreaksPerDay
        longestBreak
        shortestBreak
        breaksByType {
          type
          count
        }
        breaksByHour {
          hour
          count
        }
        breaksByDayOfWeek {
          day
          count
        }
        outlierBreaks {
          id
          userId
          userName
          userEmail
          breakType
          startTime
          endTime
          duration
          hourOfDay
          dayOfWeek
        }
      }
      anomalyAnalysis {
        usersWithFewerBreaks {
          userId
          userName
          totalBreaks
          averageBreaksPerDay
          percentageBelow
        }
        usersWithLongerBreaks {
          userId
          userName
          averageBreakDuration
          percentageAbove
        }
        unusualTimePatterns {
          userId
          userName
          pattern
          description
        }
        overallStats {
          totalUsers
          averageBreaksPerUserPerDay
          averageBreakDuration
          mostCommonBreakHours
          leastActiveUsers
        }
      }
      aiInsights
    }
  }
`;

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getDayName = (dayNum: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNum];
};

export default function BreakAnalytics() {
  const [monthsBack, setMonthsBack] = useState(2);

  const { data, loading, error, refetch } = useQuery(BREAK_ANALYTICS_REPORT, {
    variables: { monthsBack },
  });

  const handleMonthsChange = (months: number) => {
    setMonthsBack(months);
    refetch({ monthsBack: months });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading analytics data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Error loading analytics: {error.message}
          </div>
        </div>
      </div>
    );
  }

  const report = data?.breakAnalyticsReport;
  if (!report) {
    return null;
  }

  const { dateRange, userStats, anomalyAnalysis, aiInsights } = report;

  // Prepare data aggregations
  const breaksByHourData = Array.from({ length: 24 }, (_, hour) => {
    const totalBreaks = userStats.reduce((sum: number, user: any) => {
      const hourData = user.breaksByHour.find((h: any) => h.hour === hour);
      return sum + (hourData?.count || 0);
    }, 0);
    return { hour, breaks: totalBreaks };
  }).filter((item) => item.breaks > 0);

  const breaksByDayData = Array.from({ length: 7 }, (_, day) => {
    const totalBreaks = userStats.reduce((sum: number, user: any) => {
      const dayData = user.breaksByDayOfWeek.find((d: any) => d.day === day);
      return sum + (dayData?.count || 0);
    }, 0);
    return { day, breaks: totalBreaks };
  }).filter((item) => item.breaks > 0);

  const breakTypeData = userStats.reduce((acc: any, user: any) => {
    user.breaksByType.forEach((bt: any) => {
      if (!acc[bt.type]) {
        acc[bt.type] = 0;
      }
      acc[bt.type] += bt.count;
    });
    return acc;
  }, {});

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold font-outfit text-transparent bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text mb-3">
            Break Analytics & Fraud Detection
          </h1>
          <p className="text-gray-600">
            AI-powered analysis of break patterns with anomaly detection
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex items-center gap-4 bg-white/40 backdrop-blur-md rounded-lg p-4 border border-white/20">
          <label className="text-gray-700 font-medium">Analysis Period:</label>
          <select
            value={monthsBack}
            onChange={(e) => handleMonthsChange(Number(e.target.value))}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          >
            <option value={1}>Last Month</option>
            <option value={2}>Last 2 Months</option>
            <option value={3}>Last 3 Months</option>
            <option value={6}>Last 6 Months</option>
          </select>
          <span className="text-gray-600">
            {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
          </span>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/40 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <FiUsers className="text-violet-600 text-2xl" />
            </div>
            <div className="text-sm text-gray-600">Total Users</div>
            <div className="text-3xl font-bold text-gray-900">
              {anomalyAnalysis.overallStats.totalUsers}
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <FiTrendingUp className="text-blue-600 text-2xl" />
            </div>
            <div className="text-sm text-gray-600">Avg Breaks/User/Day</div>
            <div className="text-3xl font-bold text-gray-900">
              {anomalyAnalysis.overallStats.averageBreaksPerUserPerDay.toFixed(2)}
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <FiClock className="text-amber-600 text-2xl" />
            </div>
            <div className="text-sm text-gray-600">Avg Break Duration</div>
            <div className="text-3xl font-bold text-gray-900">
              {formatDuration(anomalyAnalysis.overallStats.averageBreakDuration)}
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <FiAlertTriangle className="text-red-600 text-2xl" />
            </div>
            <div className="text-sm text-gray-600">Peak Hours</div>
            <div className="text-xl font-bold text-gray-900">
              {anomalyAnalysis.overallStats.mostCommonBreakHours
                .map((h: number) => `${h}:00`)
                .join(', ')}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        {aiInsights && (
          <div className="mb-8 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">🤖 AI-Generated Insights</h2>
            <div className="whitespace-pre-wrap">{aiInsights}</div>
          </div>
        )}

        {/* Break Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/40 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold mb-4">Break Distribution by Hour</h3>
            <div className="space-y-2">
              {breaksByHourData.map((item) => (
                <div key={item.hour} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{item.hour}:00</span>
                  <span className="font-semibold">{item.breaks} breaks</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold mb-4">Break Distribution by Day</h3>
            <div className="space-y-2">
              {breaksByDayData.map((item) => (
                <div key={item.day} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{getDayName(item.day)}</span>
                  <span className="font-semibold">{item.breaks} breaks</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold mb-4">Break Types</h3>
            <div className="space-y-2">
              {Object.entries(breakTypeData).map(([type, count]: [string, any]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{type}</span>
                  <span className="font-semibold">{count as number} breaks</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Anomalies */}
        {anomalyAnalysis.usersWithFewerBreaks.length > 0 && (
          <div className="mb-8 bg-white/40 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold mb-4 text-red-600">
              ⚠️ Users with Suspiciously Few Breaks
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Total Breaks</th>
                    <th className="text-left py-3 px-4">Avg/Day</th>
                    <th className="text-left py-3 px-4">Below Average</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalyAnalysis.usersWithFewerBreaks.map((user: any) => (
                    <tr key={user.userId} className="border-b border-gray-100 hover:bg-white/50">
                      <td className="py-3 px-4">{user.userName}</td>
                      <td className="py-3 px-4">{user.totalBreaks}</td>
                      <td className="py-3 px-4">{user.averageBreaksPerDay.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                          {user.percentageBelow.toFixed(0)}% below
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {anomalyAnalysis.usersWithLongerBreaks.length > 0 && (
          <div className="mb-8 bg-white/40 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold mb-4 text-amber-600">
              ⏱️ Users with Unusually Long Breaks
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Avg Break Duration</th>
                    <th className="text-left py-3 px-4">Above Average</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalyAnalysis.usersWithLongerBreaks.map((user: any) => (
                    <tr key={user.userId} className="border-b border-gray-100 hover:bg-white/50">
                      <td className="py-3 px-4">{user.userName}</td>
                      <td className="py-3 px-4">{formatDuration(user.averageBreakDuration)}</td>
                      <td className="py-3 px-4">
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                          {user.percentageAbove.toFixed(0)}% above
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {anomalyAnalysis.unusualTimePatterns.length > 0 && (
          <div className="mb-8 bg-white/40 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">🔍 Unusual Time Patterns</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Pattern Type</th>
                    <th className="text-left py-3 px-4">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalyAnalysis.unusualTimePatterns.map((pattern: any, index: number) => (
                    <tr key={`${pattern.userId}-${index}`} className="border-b border-gray-100 hover:bg-white/50">
                      <td className="py-3 px-4">{pattern.userName}</td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                          {pattern.pattern.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">{pattern.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed User Statistics */}
        <div className="bg-white/40 backdrop-blur-md rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-bold mb-4">📋 Detailed User Statistics</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Total Breaks</th>
                  <th className="text-left py-3 px-4">Avg/Day</th>
                  <th className="text-left py-3 px-4">Avg Duration</th>
                  <th className="text-left py-3 px-4">Total Break Time</th>
                  <th className="text-left py-3 px-4">Outliers</th>
                </tr>
              </thead>
              <tbody>
                {userStats.map((user: any) => (
                  <tr key={user.userId} className="border-b border-gray-100 hover:bg-white/50">
                    <td className="py-3 px-4">{user.userName}</td>
                    <td className="py-3 px-4">{user.totalBreaks}</td>
                    <td className="py-3 px-4">{user.averageBreaksPerDay.toFixed(2)}</td>
                    <td className="py-3 px-4">{formatDuration(user.averageBreakDuration)}</td>
                    <td className="py-3 px-4">{formatDuration(user.totalBreakTime)}</td>
                    <td className="py-3 px-4">
                      {user.outlierBreaks.length > 0 && (
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                          {user.outlierBreaks.length}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
