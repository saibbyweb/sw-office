import { FiClock, FiFileText, FiCoffee, FiLink, FiCalendar, FiBriefcase } from 'react-icons/fi';
import { format } from 'date-fns';
import { useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { ADMIN_SESSION_QUERY } from '../graphql/admin.queries';
import { AdminSession } from '../types/admin.types';

interface AdminSessionData {
  adminSession: AdminSession;
}

export default function WorkflowView() {
  const { sessionId } = useParams();
  const { data, loading, error } = useQuery<AdminSessionData>(ADMIN_SESSION_QUERY, {
    variables: { sessionId },
    skip: !sessionId,
  });

  const session = data?.adminSession;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading session data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        Error: {error.message}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        No session data found
      </div>
    );
  }

  // Debug information
  console.log('Session:', session);
  console.log('Segments:', session.segments);
  console.log('Breaks:', session.breaks);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Group segments by project with debug logging
  const workSegments = session.segments.filter(segment => segment.type === 'WORK' && segment.project);
  console.log('Work segments:', workSegments);

  const projectGroups = workSegments.reduce((groups: Record<string, typeof session.segments>, segment) => {
    if (segment.project) {
      const projectId = segment.project.id;
      if (!groups[projectId]) {
        groups[projectId] = [];
      }
      groups[projectId].push(segment);
    }
    return groups;
  }, {});

  console.log('Project groups:', projectGroups);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Session Header */}
      <div className="bg-white/40 backdrop-blur-md rounded-lg shadow-sm p-4 mb-6 border border-white/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FiCalendar className="w-5 h-5 text-gray-500" />
            <div>
              <div className="text-lg font-medium">
                {format(new Date(session.startTime), 'MMMM d, yyyy')}
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FiClock className="text-violet-500 w-5 h-5" />
              <span className="text-sm font-medium">
                Total: {formatDuration(session.totalDuration)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FiCoffee className="text-amber-500 w-5 h-5" />
              <span className="text-sm font-medium">
                Breaks: {formatDuration(session.totalBreakTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-medium mb-2">Debug Information:</h3>
        <div className="space-y-1 text-sm">
          <div>Session ID: {session.id}</div>
          <div>Number of segments: {session.segments.length}</div>
          <div>Number of work segments: {workSegments.length}</div>
          <div>Number of project groups: {Object.keys(projectGroups).length}</div>
          <div>Number of breaks: {session.breaks.length}</div>
        </div>
      </div>

      {/* Project Groups */}
      {Object.keys(projectGroups).length === 0 ? (
        <div className="bg-white/40 backdrop-blur-md rounded-lg shadow-sm p-4 text-center text-gray-500">
          No work segments found in this session
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(projectGroups).map(([projectId, segments]) => {
            const project = segments[0].project!;
            return (
              <div key={projectId} className="bg-white/40 backdrop-blur-md rounded-lg shadow-sm overflow-hidden border border-white/20">
                <div className="p-4 border-b border-white/10 bg-purple-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiBriefcase className="w-5 h-5 text-purple-600" />
                      <div className="font-medium text-purple-900">{project.name}</div>
                    </div>
                    <div className="text-sm text-purple-700">
                      {formatDuration(segments.reduce((total, s) => total + s.duration, 0))}
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-100/20">
                  {segments.map((segment) => (
                    <div key={segment.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <FiClock className="w-5 h-5 text-gray-500" />
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
                        <div className="text-sm text-gray-600">
                          {formatDuration(segment.duration)}
                        </div>
                      </div>

                      {segment.workLogs && segment.workLogs.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {segment.workLogs.map((log) => (
                            <div key={log.id} className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                              <div className="flex items-start gap-3">
                                <FiFileText className="w-4 h-4 text-gray-500 mt-1" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-gray-700">{log.content}</div>
                                  {log.links.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {log.links.map((link, i) => (
                                        <a
                                          key={i}
                                          href={link.startsWith('http') ? link : `https://${link}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
                                        >
                                          <FiLink className="w-3 h-3" />
                                          {link.replace(/^https?:\/\//, '')}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                  <div className="mt-1 text-xs text-gray-400">
                                    {format(new Date(log.createdAt), 'h:mm a')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Break Indicators */}
      {session.breaks && session.breaks.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Breaks</h3>
          <div className="bg-white/40 backdrop-blur-md rounded-lg shadow-sm divide-y divide-amber-50/20 border border-white/20">
            {session.breaks.map((breakSegment) => (
              <div key={breakSegment.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiCoffee className="w-5 h-5 text-amber-500" />
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
                  <div className="text-sm text-gray-600">
                    {formatDuration(breakSegment.duration)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 bg-white/40 backdrop-blur-md rounded-lg shadow-sm p-4 text-center text-gray-500">
          No breaks recorded in this session
        </div>
      )}
    </div>
  );
} 