import { useQuery } from '@apollo/client';
import { format, subDays } from 'date-fns';
import { useState, useMemo } from 'react';
import { FiClock, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { ADMIN_USERS_QUERY, ADMIN_USER_SESSIONS_QUERY } from '../graphql/admin.queries';
import { AdminUser, AdminSession } from '../types/admin.types';

interface AdminUsersData {
  adminUsers: AdminUser[];
}

interface AdminUserSessionsData {
  adminUserSessions: AdminSession[];
}

export default function AdminDashboard() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Memoize the date range to prevent unnecessary re-renders
  const dateRange = useMemo(() => ({
    startDate: subDays(new Date(), 27),
    endDate: new Date(),
  }), []); // Empty dependency array as we want this to be stable

  const { data: usersData, loading: usersLoading } = useQuery<AdminUsersData>(ADMIN_USERS_QUERY);
  
  const { data: sessionsData, loading: sessionsLoading } = useQuery<AdminUserSessionsData>(
    ADMIN_USER_SESSIONS_QUERY,
    {
      variables: {
        userId: selectedUserId,
        input: dateRange
      },
      skip: !selectedUserId,
      // Add fetchPolicy to prevent unnecessary refetches
      fetchPolicy: 'cache-and-network',
    }
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* User Sidebar */}
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FiUser className="w-5 h-5" />
            Users
          </h2>
        </div>
        <div className="divide-y">
          {usersLoading ? (
            // Loading skeleton for users
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
              </div>
            ))
          ) : (
            usersData?.adminUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                  selectedUserId === user.id ? 'bg-gray-50' : ''
                }`}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <FiUser className="w-5 h-5 text-gray-500" />
                  </div>
                )}
                <div className="flex-1 text-left">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  user.isOnline ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedUserId ? (
          <>
            <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
            <div className="grid gap-4">
              {sessionsLoading ? (
                // Loading skeleton for sessions
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded bg-gray-200 animate-pulse" />
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
                          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                        </div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
                  </div>
                ))
              ) : sessionsData?.adminUserSessions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No sessions found in the last 7 days
                </div>
              ) : (
                sessionsData?.adminUserSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FiClock className="w-5 h-5 text-gray-500" />
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
                      {session.project && (
                        <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {session.project.name}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex gap-4 text-sm text-gray-500">
                        <div>Total Duration: {Math.round(session.totalDuration / 60)}m</div>
                        <div>Break Time: {Math.round(session.totalBreakTime / 60)}m</div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/workflow/${session.id}`}
                          className="px-3 py-1.5 text-sm bg-violet-100 text-violet-700 rounded hover:bg-violet-200 transition-colors"
                        >
                          View Details
                        </Link>
                        <Link
                          to={`/workflow-v2/${session.id}`}
                          className="px-3 py-1.5 text-sm bg-fuchsia-100 text-fuchsia-700 rounded hover:bg-fuchsia-200 transition-colors"
                        >
                          View Timeline
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a user to view their sessions
          </div>
        )}
      </div>
    </div>
  );
} 