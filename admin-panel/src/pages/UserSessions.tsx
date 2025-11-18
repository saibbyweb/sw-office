import { useQuery } from '@apollo/client';
import { format, subDays, endOfDay, startOfDay, setDate, addMonths, subMonths, isBefore } from 'date-fns';
import { useState, useMemo } from 'react';
import { FiClock, FiUser, FiArrowLeft, FiCalendar, FiX, FiFileText, FiLink, FiBriefcase, FiCoffee, FiArrowUp, FiArrowDown, FiCopy, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { DateRange } from 'react-day-picker';
import { ADMIN_USERS_QUERY, ADMIN_USER_SESSIONS_QUERY, ADMIN_SESSION_QUERY, ADMIN_SESSION_WORK_LOGS_QUERY, ADMIN_USER_WORK_LOGS_QUERY } from '../graphql/admin.queries';
import { AdminUser, AdminSession, WorkLog } from '../types/admin.types';
import DateRangePicker from '../components/DateRangePicker';

interface AdminUsersData {
  adminUsers: AdminUser[];
}

interface AdminUserSessionsData {
  adminUserSessions: AdminSession[];
}

interface AdminSessionData {
  adminSession: AdminSession;
}

interface AdminSessionWorkLogsData {
  adminSessionWorkLogs: WorkLog[];
}

interface AdminUserWorkLogsData {
  adminUserWorkLogs: WorkLog[];
}

type ViewType = 'details' | 'timeline' | null;

export default function UserSessions() {
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [viewType, setViewType] = useState<ViewType>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [sortDescending, setSortDescending] = useState(true);
  const [showWorkLogs, setShowWorkLogs] = useState(false);
  const [copied, setCopied] = useState(false);

  // Calculate billing cycles (19th to 18th of next month)
  const billingCycles = useMemo(() => {
    const cycles = [];
    const today = new Date();

    // Helper function to get billing cycle dates
    const getBillingCycle = (referenceDate: Date) => {
      let startDate: Date;
      let endDate: Date;

      const dayOfMonth = referenceDate.getDate();

      if (dayOfMonth >= 19) {
        // Current cycle: 19th of this month to 18th of next month
        startDate = startOfDay(setDate(referenceDate, 19));
        endDate = endOfDay(setDate(addMonths(referenceDate, 1), 18));
      } else {
        // Current cycle: 19th of last month to 18th of this month
        startDate = startOfDay(setDate(subMonths(referenceDate, 1), 19));
        endDate = endOfDay(setDate(referenceDate, 18));
      }

      return { startDate, endDate };
    };

    // Current billing cycle
    const currentCycle = getBillingCycle(today);

    // Generate past billing cycles (only include if they've started)
    for (let i = 0; i < 12; i++) {
      const cycleDate = subMonths(currentCycle.startDate, i);
      const cycle = getBillingCycle(cycleDate);

      // Only include cycles that have started (start date is in the past)
      if (isBefore(cycle.startDate, today) || cycle.startDate.toDateString() === today.toDateString()) {
        cycles.push({
          label: `${format(cycle.startDate, 'MMM d')} - ${format(cycle.endDate, 'MMM d, yyyy')}`,
          value: `billing_${i}`,
          startDate: cycle.startDate,
          endDate: cycle.endDate,
        });
      }
    }

    return cycles;
  }, []);

  // Initialize with current billing cycle
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(() => {
    const currentCycle = billingCycles[0];
    return currentCycle ? { from: currentCycle.startDate, to: currentCycle.endDate } : undefined;
  });

  // Memoize the date range to prevent unnecessary re-renders
  const dateRange = useMemo(() => {
    if (customDateRange?.from && customDateRange?.to) {
      return {
        startDate: customDateRange.from,
        endDate: endOfDay(customDateRange.to), // Include the entire end day
      };
    }
    // Fallback to current billing cycle
    const currentCycle = billingCycles[0];
    return currentCycle ? {
      startDate: currentCycle.startDate,
      endDate: currentCycle.endDate,
    } : {
      startDate: subDays(new Date(), 27),
      endDate: new Date(),
    };
  }, [customDateRange, billingCycles]);

  const { data: usersData, loading: usersLoading } = useQuery<AdminUsersData>(ADMIN_USERS_QUERY);

  const { data: sessionsData, loading: sessionsLoading } = useQuery<AdminUserSessionsData>(
    ADMIN_USER_SESSIONS_QUERY,
    {
      variables: {
        userId: selectedUserId,
        input: {
          ...dateRange,
          sortDescending
        }
      },
      skip: !selectedUserId,
      // Add fetchPolicy to prevent unnecessary refetches
      fetchPolicy: 'cache-and-network',
    }
  );

  const { data: sessionData, loading: sessionLoading } = useQuery<AdminSessionData>(
    ADMIN_SESSION_QUERY,
    {
      variables: { sessionId: selectedSessionId },
      skip: !selectedSessionId,
    }
  );

  const { data: workLogsData } = useQuery<AdminSessionWorkLogsData>(
    ADMIN_SESSION_WORK_LOGS_QUERY,
    {
      variables: { sessionId: selectedSessionId },
      skip: !selectedSessionId,
    }
  );

  const { data: userWorkLogsData, loading: userWorkLogsLoading } = useQuery<AdminUserWorkLogsData>(
    ADMIN_USER_WORK_LOGS_QUERY,
    {
      variables: {
        userId: selectedUserId,
        input: dateRange,
      },
      skip: !selectedUserId || !showWorkLogs,
      fetchPolicy: 'cache-and-network',
    }
  );

  const selectedUser = usersData?.adminUsers.find(user => user.id === selectedUserId);
  const session = sessionData?.adminSession;
  const workLogs = workLogsData?.adminSessionWorkLogs || [];

  const filteredUsers = usersData?.adminUsers.filter(user =>
    showArchived ? true : !user.archived
  ) || [];

  const archivedCount = usersData?.adminUsers.filter(user => user.archived).length || 0;

  // Calculate session stats
  const sessionStats = useMemo(() => {
    if (!sessionsData?.adminUserSessions) {
      return { totalSessions: 0, uniqueDays: 0 };
    }

    const sessions = sessionsData.adminUserSessions;
    const totalSessions = sessions.length;

    // Get unique days by formatting dates to YYYY-MM-DD
    const uniqueDaysSet = new Set(
      sessions.map(session => format(new Date(session.startTime), 'yyyy-MM-dd'))
    );
    const uniqueDays = uniqueDaysSet.size;

    return { totalSessions, uniqueDays };
  }, [sessionsData]);

  const handleViewDetails = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setViewType('details');
  };

  const handleViewTimeline = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setViewType('timeline');
  };

  const handleCloseDetails = () => {
    setSelectedSessionId(null);
    setViewType(null);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleCopyWorkLogs = async () => {
    if (!userWorkLogsData?.adminUserWorkLogs || !selectedUser) return;

    const logs = userWorkLogsData.adminUserWorkLogs;
    const dateRangeText = customDateRange?.from && customDateRange?.to
      ? `${format(customDateRange.from, 'MMM d, yyyy')} - ${format(customDateRange.to, 'MMM d, yyyy')}`
      : 'Selected period';

    // Format work logs for Slack
    let formattedText = `*Work Logs for ${selectedUser.name}*\n`;
    formattedText += `_${dateRangeText}_\n`;
    formattedText += `_Total logs: ${logs.length}_\n\n`;

    // Group by project
    const logsByProject: Record<string, WorkLog[]> = {};
    logs.forEach(log => {
      const projectName = log.project?.name || 'No Project';
      if (!logsByProject[projectName]) {
        logsByProject[projectName] = [];
      }
      logsByProject[projectName].push(log);
    });

    // Format each project group
    Object.entries(logsByProject).forEach(([projectName, projectLogs]) => {
      formattedText += `*${projectName}* (${projectLogs.length} logs)\n`;
      projectLogs.forEach((log, index) => {
        const timestamp = format(new Date(log.createdAt), 'MMM d, h:mm a');
        formattedText += `${index + 1}. ${log.content}\n`;
        if (log.links && log.links.length > 0) {
          log.links.forEach(link => {
            formattedText += `   • ${link}\n`;
          });
        }
        formattedText += `   _${timestamp}_\n`;
      });
      formattedText += '\n';
    });

    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const renderWorkLog = (log: WorkLog) => (
    <div key={log.id} className="bg-white/60 backdrop-blur-sm rounded-md p-2 border border-white/20">
      <div className="flex items-start gap-2">
        <FiFileText className="w-3.5 h-3.5 text-gray-500 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm text-gray-700">{log.content}</div>
            {log.project && (
              <div className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded-full whitespace-nowrap">
                {log.project.name}
              </div>
            )}
          </div>
          {log.links.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {log.links.map((link, i) => (
                <a
                  key={i}
                  href={link.startsWith('http') ? link : `https://${link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-xs text-purple-600 hover:text-purple-700"
                >
                  <FiLink className="w-3 h-3" />
                  {link.replace(/^https?:\/\//, '')}
                </a>
              ))}
            </div>
          )}
          <div className="mt-0.5 text-xs text-gray-400">
            {format(new Date(log.createdAt), 'h:mm a')}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white/40 backdrop-blur-md border-b border-white/20 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                title="Back to Home"
              >
                <FiArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold font-outfit text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text">
                  User Sessions
                </h1>
                <p className="text-sm text-gray-600">
                  View and manage user work sessions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/60 transition-colors">
                <input
                  type="checkbox"
                  checked={showWorkLogs}
                  onChange={(e) => {
                    setShowWorkLogs(e.target.checked);
                    if (e.target.checked) {
                      // Close any open session details when switching to work log view
                      setSelectedSessionId(null);
                      setViewType(null);
                    }
                  }}
                  className="w-3.5 h-3.5 text-violet-600 rounded focus:ring-violet-500"
                />
                <span className="text-sm text-gray-700">
                  Work Log View
                </span>
              </label>
              {archivedCount > 0 && (
                <label className="flex items-center gap-2 cursor-pointer bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    className="w-3.5 h-3.5 text-violet-600 rounded focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-700">
                    Show archived ({archivedCount})
                  </span>
                </label>
              )}
              <select
                value={(() => {
                  if (!customDateRange?.from) return billingCycles[0]?.value || 'custom';
                  // Check if it matches a billing cycle
                  const matchingCycle = billingCycles.find(c =>
                    c.startDate.getTime() === customDateRange.from?.getTime() &&
                    c.endDate.getTime() === customDateRange.to?.getTime()
                  );
                  return matchingCycle ? matchingCycle.value : 'custom';
                })()}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'custom') {
                    // Keep current custom date range
                  } else if (value.startsWith('billing_')) {
                    // Set billing cycle date range
                    const index = parseInt(value.split('_')[1]);
                    const cycle = billingCycles[index];
                    if (cycle) {
                      setCustomDateRange({
                        from: cycle.startDate,
                        to: cycle.endDate,
                      });
                    }
                  }
                }}
                className="text-sm text-gray-700 bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/60 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {billingCycles.map((cycle) => (
                  <option key={cycle.value} value={cycle.value}>
                    {cycle.label}
                  </option>
                ))}
                {customDateRange?.from && !billingCycles.some(c =>
                  c.startDate.getTime() === customDateRange.from?.getTime() &&
                  c.endDate.getTime() === customDateRange.to?.getTime()
                ) && <option value="custom">Custom range</option>}
              </select>
              <DateRangePicker
                value={customDateRange}
                onChange={(range) => {
                  if (!range?.from) {
                    // Reset to current billing cycle when cleared
                    const currentCycle = billingCycles[0];
                    if (currentCycle) {
                      setCustomDateRange({ from: currentCycle.startDate, to: currentCycle.endDate });
                    }
                  } else {
                    setCustomDateRange(range);
                  }
                }}
              />
              <button
                onClick={() => setSortDescending(!sortDescending)}
                className="flex items-center gap-2 text-sm text-gray-700 bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/60 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
                title={sortDescending ? 'Newest first' : 'Oldest first'}
              >
                {sortDescending ? (
                  <>
                    <FiArrowDown className="w-4 h-4 text-violet-600" />
                    <span>Newest</span>
                  </>
                ) : (
                  <>
                    <FiArrowUp className="w-4 h-4 text-violet-600" />
                    <span>Oldest</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-3 p-3">
        {/* User Sidebar */}
        <div className={`shrink-0 transition-all duration-300 ${viewType ? 'w-56' : 'w-72'}`}>
          <div className="bg-white/40 backdrop-blur-md rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 overflow-hidden h-[calc(100vh-88px)]">
            <div className="p-3 border-b border-white/20 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                <FiUser className="w-5 h-5 text-violet-600" />
                Users ({filteredUsers.length})
              </h2>
            </div>
            <div className="divide-y divide-white/20 overflow-y-auto h-[calc(100%-53px)]">
              {usersLoading ? (
                // Loading skeleton for users
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-20 mb-1.5 animate-pulse" />
                      <div className="h-2.5 bg-gray-200 rounded w-28 animate-pulse" />
                    </div>
                  </div>
                ))
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`w-full p-3 flex items-center gap-2 transition-all duration-200 ${
                      selectedUserId === user.id
                        ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border-l-4 border-violet-600'
                        : 'hover:bg-white/60'
                    }`}
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className={`w-10 h-10 rounded-full ring-2 transition-all ${
                          selectedUserId === user.id ? 'ring-violet-500' : 'ring-white/50'
                        }`}
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-2 transition-all ${
                        selectedUserId === user.id
                          ? 'bg-violet-100 ring-violet-500'
                          : 'bg-gray-200 ring-white/50'
                      }`}>
                        <FiUser className={`w-5 h-5 ${selectedUserId === user.id ? 'text-violet-600' : 'text-gray-500'}`} />
                      </div>
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-base font-medium text-gray-800 truncate">{user.name}</div>
                      <div className="text-sm text-gray-500 truncate">{user.email}</div>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      user.isOnline ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-gray-300'
                    }`} />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className={`min-w-0 transition-all duration-300 ${viewType ? 'w-96' : 'flex-1'}`}>
          {selectedUserId ? (
            <>
              {/* Selected User Header */}
              {selectedUser && (
                <div className="bg-white/40 backdrop-blur-md rounded-lg p-4 mb-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {selectedUser.avatarUrl ? (
                        <img
                          src={selectedUser.avatarUrl}
                          alt=""
                          className="w-12 h-12 rounded-full ring-2 ring-violet-500/30"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center ring-2 ring-violet-500/30">
                          <FiUser className="w-6 h-6 text-violet-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{selectedUser.name}</h3>
                        <p className="text-sm text-gray-600">{selectedUser.email}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${selectedUser.isOnline ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                          <span className="text-sm text-gray-600">
                            {selectedUser.isOnline ? 'Online' : 'Offline'} · {selectedUser.currentStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Session Stats or Copy Button */}
                    {showWorkLogs ? (
                      <button
                        onClick={handleCopyWorkLogs}
                        disabled={!userWorkLogsData?.adminUserWorkLogs?.length}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                      >
                        {copied ? (
                          <>
                            <FiCheck className="w-4 h-4" />
                            <span className="text-sm font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <FiCopy className="w-4 h-4" />
                            <span className="text-sm font-medium">Copy All</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text">
                            {sessionStats.totalSessions}
                          </div>
                          <div className="text-xs text-gray-500 font-medium">Sessions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text">
                            {sessionStats.uniqueDays}
                          </div>
                          <div className="text-xs text-gray-500 font-medium">Unique Days</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3 overflow-y-auto h-[calc(100vh-220px)]">
                {showWorkLogs ? (
                  // Work Logs View
                  userWorkLogsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="bg-white/40 backdrop-blur-md rounded-lg shadow-sm p-4 border border-white/20">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                      </div>
                    ))
                  ) : userWorkLogsData?.adminUserWorkLogs.length === 0 ? (
                    <div className="bg-white/40 backdrop-blur-md rounded-lg p-8 text-center border border-white/20">
                      <FiFileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No work logs found in selected date range</p>
                    </div>
                  ) : (
                    userWorkLogsData?.adminUserWorkLogs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-white/40 backdrop-blur-md rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all duration-300 border border-white/20 hover:border-white/40"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <FiFileText className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-800 break-words">{log.content}</p>
                              {log.links && log.links.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {log.links.map((link, idx) => (
                                    <a
                                      key={idx}
                                      href={link.startsWith('http') ? link : `https://${link}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 hover:underline"
                                    >
                                      <FiLink className="w-3.5 h-3.5" />
                                      {link.replace(/^https?:\/\//, '')}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          {log.project && (
                            <div className="px-2 py-1 bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 rounded-full text-sm font-medium whitespace-nowrap">
                              {log.project.name}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <FiClock className="w-3.5 h-3.5" />
                          <span>{format(new Date(log.createdAt), 'MMM d, yyyy · h:mm a')}</span>
                        </div>
                      </div>
                    ))
                  )
                ) : sessionsLoading ? (
                  // Loading skeleton for sessions
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white/40 backdrop-blur-md rounded-lg shadow-sm p-4 border border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-gray-200 animate-pulse" />
                          <div>
                            <div className="h-3 bg-gray-200 rounded w-28 mb-1.5 animate-pulse" />
                            <div className="h-2.5 bg-gray-200 rounded w-20 animate-pulse" />
                          </div>
                        </div>
                        <div className="h-5 bg-gray-200 rounded w-16 animate-pulse" />
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-40 animate-pulse" />
                    </div>
                  ))
                ) : sessionsData?.adminUserSessions.length === 0 ? (
                  <div className="bg-white/40 backdrop-blur-md rounded-lg p-8 text-center border border-white/20">
                    <FiClock className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No sessions found in the last 28 days</p>
                  </div>
                ) : (
                  sessionsData?.adminUserSessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-white/40 backdrop-blur-md rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all duration-300 border border-white/20 hover:border-white/40"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg">
                            <FiClock className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">
                              {format(new Date(session.startTime), 'MMM d, yyyy')}
                            </div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(session.startTime), 'h:mm a')} - {
                                session.endTime
                                  ? format(new Date(session.endTime), 'h:mm a')
                                  : 'Ongoing'
                              }
                            </div>
                          </div>
                        </div>
                        {session.project && (
                          <div className="px-2 py-1 bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 rounded-full text-sm font-medium">
                            {session.project.name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Total:</span>
                            <span className="font-medium text-gray-800">{Math.round(session.totalDuration / 60)}m</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Break:</span>
                            <span className="font-medium text-gray-800">{Math.round(session.totalBreakTime / 60)}m</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleViewDetails(session.id)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 font-medium ${
                              selectedSessionId === session.id && viewType === 'details'
                                ? 'bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-md'
                                : 'bg-gradient-to-r from-violet-100 to-violet-200 text-violet-700 hover:from-violet-200 hover:to-violet-300'
                            }`}
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleViewTimeline(session.id)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 font-medium ${
                              selectedSessionId === session.id && viewType === 'timeline'
                                ? 'bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 text-white shadow-md'
                                : 'bg-gradient-to-r from-fuchsia-100 to-fuchsia-200 text-fuchsia-700 hover:from-fuchsia-200 hover:to-fuchsia-300'
                            }`}
                          >
                            Timeline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="h-[calc(100vh-88px)] flex items-center justify-center">
              <div className="text-center">
                <FiUser className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Select a user to view their sessions</p>
              </div>
            </div>
          )}
        </div>

        {/* Details Panel */}
        {viewType && (
          <div className="flex-1 min-w-0 animate-in slide-in-from-right duration-300">
            <div className="bg-white/40 backdrop-blur-md rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 overflow-hidden h-[calc(100vh-88px)]">
              {/* Header */}
              <div className="p-3 border-b border-white/20 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  {viewType === 'details' ? 'Session Details' : 'Timeline View'}
                </h2>
                <button
                  onClick={handleCloseDetails}
                  className="p-1.5 hover:bg-white/60 rounded-lg transition-colors"
                  title="Close"
                >
                  <FiX className="w-4 h-4 text-gray-700" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto h-[calc(100%-53px)] p-4">
                {sessionLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">Loading session data...</div>
                  </div>
                ) : !session ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">Session not found</div>
                  </div>
                ) : viewType === 'details' ? (
                  <>
                    {/* Session Header */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg shadow-sm p-3 mb-4 border border-white/20">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <FiCalendar className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-medium">
                              {format(new Date(session.startTime), 'MMM d, yyyy')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {format(new Date(session.startTime), 'h:mm a')} - {
                                session.endTime
                                  ? format(new Date(session.endTime), 'h:mm a')
                                  : 'Ongoing'
                              }
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <FiClock className="text-violet-500 w-3.5 h-3.5" />
                            <span className="text-sm font-medium">
                              {formatDuration(session.totalDuration)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FiCoffee className="text-amber-500 w-3.5 h-3.5" />
                            <span className="text-sm font-medium">
                              {formatDuration(session.totalBreakTime)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Project Groups */}
                    <div className="space-y-3">
                      {(() => {
                        // Group segments by project
                        const projectGroups = session.segments
                          .filter(segment => segment.type === 'WORK' && segment.project)
                          .reduce((groups: Record<string, typeof session.segments>, segment) => {
                            if (segment.project) {
                              const projectId = segment.project.id;
                              if (!groups[projectId]) {
                                groups[projectId] = [];
                              }
                              groups[projectId].push(segment);
                            }
                            return groups;
                          }, {});

                        // Group work logs by project
                        const workLogsByProject = workLogs.reduce((groups: Record<string, WorkLog[]>, log) => {
                          const projectId = log.project?.id || 'unassigned';
                          if (!groups[projectId]) {
                            groups[projectId] = [];
                          }
                          groups[projectId].push(log);
                          return groups;
                        }, {});

                        return Object.entries(projectGroups).map(([projectId, segments]) => {
                          const project = segments[0].project!;
                          const projectWorkLogs = workLogsByProject[projectId] || [];

                          return (
                            <div key={projectId} className="bg-white/60 backdrop-blur-md rounded-lg shadow-sm overflow-hidden border border-white/20">
                              <div className="p-2.5 border-b border-white/10 bg-purple-50/50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <FiBriefcase className="w-4 h-4 text-purple-600" />
                                    <div className="font-medium text-purple-900">{project.name}</div>
                                  </div>
                                  <div className="text-sm text-purple-700 font-medium">
                                    {formatDuration(segments.reduce((total, s) => total + s.duration, 0))}
                                  </div>
                                </div>
                              </div>

                              <div className="divide-y divide-gray-100/20">
                                {segments.map((segment) => (
                                  <div key={segment.id} className="p-2.5">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <FiClock className="w-3.5 h-3.5 text-gray-500" />
                                        <div>
                                          <div className="text-sm text-gray-600">
                                            {format(new Date(segment.startTime), 'h:mm a')} - {
                                              segment.endTime
                                                ? format(new Date(segment.endTime), 'h:mm a')
                                                : 'Ongoing'
                                            }
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-sm text-gray-600 font-medium">
                                        {formatDuration(segment.duration)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {projectWorkLogs.length > 0 && (
                                <div className="border-t border-white/10 p-2.5">
                                  <div className="space-y-2">
                                    {projectWorkLogs.map(renderWorkLog)}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Unassigned Work Logs */}
                    {(() => {
                      const workLogsByProject = workLogs.reduce((groups: Record<string, WorkLog[]>, log) => {
                        const projectId = log.project?.id || 'unassigned';
                        if (!groups[projectId]) {
                          groups[projectId] = [];
                        }
                        groups[projectId].push(log);
                        return groups;
                      }, {});

                      return workLogsByProject['unassigned']?.length > 0 && (
                        <div className="mt-4">
                          <h3 className="font-medium mb-2">Additional Work Logs</h3>
                          <div className="space-y-2">
                            {workLogsByProject['unassigned'].map(renderWorkLog)}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Break Indicators */}
                    {session.breaks && session.breaks.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-medium mb-2">Breaks</h3>
                        <div className="bg-white/60 backdrop-blur-md rounded-lg shadow-sm divide-y divide-amber-50/20 border border-white/20">
                          {session.breaks.map((breakSegment) => (
                            <div key={breakSegment.id} className="p-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FiCoffee className="w-4 h-4 text-amber-500" />
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {breakSegment.type}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {format(new Date(breakSegment.startTime), 'h:mm a')} - {
                                        breakSegment.endTime
                                          ? format(new Date(breakSegment.endTime), 'h:mm a')
                                          : 'Ongoing'
                                      }
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600 font-medium">
                                  {formatDuration(breakSegment.duration)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Timeline View */}
                    <div className="space-y-4">
                      {(() => {
                        // Group segments by project
                        const groupSegmentsByProject = () => {
                          const workSegments = session.segments.filter(s => s.type === 'WORK' && s.project);
                          const projects = [...new Set(workSegments.map(s => s.project!.id))];

                          return projects.map(projectId => {
                            const projectSegments = workSegments.filter(s => s.project!.id === projectId);
                            return {
                              project: projectSegments[0].project!,
                              segments: projectSegments,
                              totalDuration: projectSegments.reduce((acc, s) => acc + s.duration, 0)
                            };
                          });
                        };

                        const renderSegment = (segment: typeof session.segments[0]) => {
                          const isWork = segment.type === 'WORK';
                          const segmentWorkLogs = workLogs.filter(log => {
                            const logTime = new Date(log.createdAt).getTime();
                            const segmentStart = new Date(segment.startTime).getTime();
                            const segmentEnd = segment.endTime ? new Date(segment.endTime).getTime() : Date.now();
                            return logTime >= segmentStart && logTime <= segmentEnd &&
                                   (!segment.project || !log.project || segment.project.id === log.project.id);
                          });

                          return (
                            <div key={segment.id} className={`rounded-md border transition-all duration-200 ${
                              isWork
                                ? 'bg-white/10 border-white/20 shadow-sm hover:shadow-md backdrop-blur-sm hover:bg-white/20'
                                : 'bg-amber-50/80 border-amber-100'
                            }`}>
                              {/* Segment Header */}
                              <div className={`p-2 ${isWork ? 'border-b border-white/10' : 'border-b border-amber-100/50'}`}>
                                <div className="flex items-center justify-between gap-2">
                                  {isWork ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <FiClock className="text-violet-500 shrink-0 w-3.5 h-3.5" />
                                        <span className="text-sm text-gray-600 whitespace-nowrap">
                                          {format(new Date(segment.startTime), 'h:mm a')} - {
                                            segment.endTime ? format(new Date(segment.endTime), 'h:mm a') : 'Ongoing'
                                          }
                                        </span>
                                      </div>
                                      <span className="text-sm text-violet-600 font-medium whitespace-nowrap">
                                        {formatDuration(segment.duration)}
                                      </span>
                                    </>
                                  ) : (
                                    <div className="w-full">
                                      <div className="flex items-center gap-1.5">
                                        <FiCoffee className="text-amber-500 shrink-0 w-3.5 h-3.5" />
                                        <span className="text-sm font-medium">{segment.break?.type} Break</span>
                                      </div>
                                      <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                                        <span className="whitespace-nowrap">
                                          {format(new Date(segment.startTime), 'h:mm a')} - {
                                            segment.endTime ? format(new Date(segment.endTime), 'h:mm a') : 'Ongoing'
                                          }
                                        </span>
                                        <span>·</span>
                                        <span>{formatDuration(segment.duration)}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Work Logs */}
                              {isWork && segmentWorkLogs.length > 0 && (
                                <div className="p-2 space-y-1.5">
                                  {segmentWorkLogs.map((log) => (
                                    <div key={log.id} className="bg-white/40 backdrop-blur-sm rounded-md p-2 border border-white/20 hover:bg-white/60 transition-all duration-200">
                                      <div className="flex items-start gap-1.5">
                                        <FiFileText className="text-gray-500 mt-0.5 shrink-0 w-3.5 h-3.5" />
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm text-gray-700">{log.content}</p>
                                            <span className="text-xs text-gray-500 shrink-0 font-medium">
                                              {format(new Date(log.createdAt), 'h:mm a')}
                                            </span>
                                          </div>
                                          {log.links.map((link, idx) => (
                                            <a
                                              key={idx}
                                              href={link.startsWith('http') ? link : `https://${link}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-violet-600 hover:text-violet-700 hover:underline text-xs mt-1 transition-colors duration-200"
                                            >
                                              <FiLink className="w-3 h-3" />
                                              {link}
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        };

                        const renderProjectSegments = (projectGroup: any, allSegments: typeof session.segments) => {
                          // Get all segments that occurred between the first and last segments of this project
                          const projectStart = Math.min(...projectGroup.segments.map((s: any) => new Date(s.startTime).getTime()));
                          const projectEnd = Math.max(...projectGroup.segments.map((s: any) => s.endTime ? new Date(s.endTime).getTime() : Date.now()));

                          const relevantSegments = allSegments.filter(segment => {
                            const segmentTime = new Date(segment.startTime).getTime();
                            return segmentTime >= projectStart && segmentTime <= projectEnd;
                          });

                          return (
                            <div key={projectGroup.project.id} className="mb-4">
                              <div className="flex items-center gap-2 mb-3 bg-white/40 backdrop-blur-md rounded-lg px-3 py-2 shadow-sm border border-white/20">
                                <FiBriefcase className="text-violet-500 w-4 h-4" />
                                <div>
                                  <span className="font-semibold text-gray-700 block">{projectGroup.project.name}</span>
                                  <span className="text-sm text-gray-500">{formatDuration(projectGroup.totalDuration)}</span>
                                </div>
                              </div>

                              <div className="space-y-2 pl-6">
                                {relevantSegments.map((segment) => renderSegment(segment))}
                              </div>
                            </div>
                          );
                        };

                        return groupSegmentsByProject().map((projectGroup) =>
                          renderProjectSegments(projectGroup, session.segments)
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 