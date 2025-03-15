import { FiClock, FiFileText, FiCoffee, FiLink, FiCalendar, FiBriefcase, FiCode, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { format } from 'date-fns';
import { useQuery } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { ADMIN_SESSION_QUERY, ADMIN_SESSION_WORK_LOGS_QUERY } from '../graphql/admin.queries';
import { AdminSession, WorkLog } from '../types/admin.types';
import { useState } from 'react';

interface AdminSessionData {
  adminSession: AdminSession;
}

interface AdminSessionWorkLogsData {
  adminSessionWorkLogs: WorkLog[];
}

export default function WorkflowView() {
  const [showJson, setShowJson] = useState(false);
  const { sessionId } = useParams();
  
  const { data: sessionData, loading: sessionLoading } = useQuery<AdminSessionData>(ADMIN_SESSION_QUERY, {
    variables: { sessionId },
    skip: !sessionId,
  });

  const { data: workLogsData } = useQuery<AdminSessionWorkLogsData>(ADMIN_SESSION_WORK_LOGS_QUERY, {
    variables: { sessionId },
    skip: !sessionId,
  });

  const session = sessionData?.adminSession;
  const workLogs = workLogsData?.adminSessionWorkLogs || [];

  if (sessionLoading || !session) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading session data...
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const renderWorkLog = (log: WorkLog) => (
    <div key={log.id} className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/20">
      <div className="flex items-start gap-3">
        <FiFileText className="w-4 h-4 text-gray-500 mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm text-gray-700">{log.content}</div>
            {log.project && (
              <div className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full whitespace-nowrap">
                {log.project.name}
              </div>
            )}
          </div>
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
  );

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

      {/* Project Groups */}
      <div className="space-y-8">
        {Object.entries(projectGroups).map(([projectId, segments]) => {
          const project = segments[0].project!;
          const projectWorkLogs = workLogsByProject[projectId] || [];
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
                    <div className="flex items-center justify-between">
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
                  </div>
                ))}
              </div>

              {projectWorkLogs.length > 0 && (
                <div className="border-t border-white/10 p-4">
                  <div className="space-y-2">
                    {projectWorkLogs.map(renderWorkLog)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Unassigned Work Logs */}
      {workLogsByProject['unassigned']?.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Additional Work Logs</h3>
          <div className="space-y-2">
            {workLogsByProject['unassigned'].map(renderWorkLog)}
          </div>
        </div>
      )}

      {/* Break Indicators */}
      {session.breaks.length > 0 && (
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
      )}

      {/* JSON View */}
      <div className="mt-8">
        <button
          onClick={() => setShowJson(!showJson)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-2"
        >
          {showJson ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
          <FiCode className="w-4 h-4" />
          <span>Raw Session Data</span>
        </button>
        {showJson && (
          <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
            <pre className="text-gray-100 text-sm font-mono whitespace-pre-wrap">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 