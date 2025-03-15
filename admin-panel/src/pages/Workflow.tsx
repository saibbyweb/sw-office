import { FiClock, FiFileText, FiCoffee, FiPlay, FiCheck, FiX, FiLink, FiCalendar, FiBriefcase } from 'react-icons/fi';
import { format } from 'date-fns';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { ADMIN_SESSION_QUERY, ADMIN_SESSION_WORK_LOGS_QUERY } from '../graphql/admin.queries';

interface AdminSessionData {
  adminSession: {
    id: string;
    startTime: string;
    endTime: string | null;
    status: string;
    totalDuration: number;
    totalBreakTime: number;
    user: {
      id: string;
      name: string;
      avatarUrl: string | null;
      currentStatus: string;
      isOnline: boolean;
    };
    segments: Array<{
      id: string;
      type: 'WORK' | 'BREAK';
      startTime: string;
      endTime: string | null;
      duration: number;
      project?: {
        id: string;
        name: string;
      };
      break?: {
        id: string;
        type: string;
        startTime: string;
        endTime: string | null;
        duration: number;
      };
    }>;
  };
}

interface AdminSessionWorkLogsData {
  adminSessionWorkLogs: Array<{
    id: string;
    content: string;
    links: string[];
    createdAt: string;
    project?: {
      id: string;
      name: string;
    };
  }>;
}

interface ProjectGroup {
  project: {
    id: string;
    name: string;
  };
  segments: Array<{
    id: string;
    type: 'WORK' | 'BREAK';
    startTime: string;
    endTime: string | null;
    duration: number;
    project?: {
      id: string;
      name: string;
    };
    break?: {
      id: string;
      type: string;
      startTime: string;
      endTime: string | null;
      duration: number;
    };
  }>;
  totalDuration: number;
}

export default function Workflow() {
  const { sessionId } = useParams();
  const { data: sessionData, loading: sessionLoading } = useQuery<AdminSessionData>(
    ADMIN_SESSION_QUERY,
    {
      variables: { sessionId },
      skip: !sessionId,
    }
  );

  const { data: workLogsData } = useQuery<AdminSessionWorkLogsData>(
    ADMIN_SESSION_WORK_LOGS_QUERY,
    {
      variables: { sessionId },
      skip: !sessionId,
    }
  );

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
    return `${hours}h ${minutes}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <FiPlay className="text-emerald-500" />;
      case 'COMPLETED':
        return <FiCheck className="text-blue-500" />;
      case 'TERMINATED':
        return <FiX className="text-red-500" />;
      default:
        return null;
    }
  };

  const groupSegmentsByProject = (segments: AdminSessionData['adminSession']['segments']): ProjectGroup[] => {
    const workSegments = segments.filter(s => s.type === 'WORK' && s.project);
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

  const renderSegment = (segment: AdminSessionData['adminSession']['segments'][0]) => {
    const isWork = segment.type === 'WORK';
    const segmentWorkLogs = workLogs.filter(log => {
      const logTime = new Date(log.createdAt).getTime();
      const segmentStart = new Date(segment.startTime).getTime();
      const segmentEnd = segment.endTime ? new Date(segment.endTime).getTime() : Date.now();
      return logTime >= segmentStart && logTime <= segmentEnd && 
             (!segment.project || !log.project || segment.project.id === log.project.id);
    });

    return (
      <div className={`rounded-lg border transition-all duration-200 ${
        isWork 
          ? 'bg-white/10 border-white/20 shadow-lg hover:shadow-xl backdrop-blur-md hover:bg-white/20' 
          : 'bg-amber-50/80 border-amber-100'
      }`}>
        {/* Segment Header */}
        <div className={`p-3 ${isWork ? 'border-b border-white/10' : 'border-b border-amber-100/50'}`}>
          <div className="flex items-center justify-between gap-3">
            {isWork ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <FiClock className="text-violet-500 shrink-0 w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiCalendar className="text-gray-400 w-3.5 h-3.5" />
                    <span className="text-sm text-gray-600 whitespace-nowrap">
                      {format(new Date(segment.startTime), 'h:mm a')} - {
                        segment.endTime ? format(new Date(segment.endTime), 'h:mm a') : 'Ongoing'
                      }
                    </span>
                  </div>
                </div>
                <span className="text-sm text-violet-600 font-medium whitespace-nowrap">
                  {formatDuration(segment.duration)}
                </span>
              </>
            ) : (
              <div className="w-full">
                <div className="flex items-center gap-2">
                  <FiCoffee className="text-amber-500 shrink-0 w-4 h-4" />
                  <span className="text-sm font-medium">{segment.break?.type} Break</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                  <FiCalendar className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">
                    {format(new Date(segment.startTime), 'h:mm a')} - {
                      segment.endTime ? format(new Date(segment.endTime), 'h:mm a') : 'Ongoing'
                    }
                  </span>
                </div>
                <span className="text-xs text-gray-500 mt-0.5 block">{formatDuration(segment.duration)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Work Logs */}
        {isWork && segmentWorkLogs.length > 0 && (
          <div className="p-2.5 space-y-2">
            {segmentWorkLogs.map((log) => (
              <div key={log.id} className="bg-white/40 backdrop-blur-sm rounded-md p-2.5 border border-white/20 hover:bg-white/60 transition-all duration-200">
                <div className="flex items-start gap-2">
                  <FiFileText className="text-gray-500 mt-0.5 shrink-0 w-4 h-4" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
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
                        className="flex items-center gap-1.5 text-violet-600 hover:text-violet-700 hover:underline text-xs mt-1.5 transition-colors duration-200"
                      >
                        <FiLink className="w-3.5 h-3.5" />
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

  const renderProjectSegments = (projectGroup: ProjectGroup, allSegments: AdminSessionData['adminSession']['segments']) => {
    // Get all segments that occurred between the first and last segments of this project
    const projectStart = Math.min(...projectGroup.segments.map(s => new Date(s.startTime).getTime()));
    const projectEnd = Math.max(...projectGroup.segments.map(s => s.endTime ? new Date(s.endTime).getTime() : Date.now()));
    
    const relevantSegments = allSegments.filter(segment => {
      const segmentTime = new Date(segment.startTime).getTime();
      return segmentTime >= projectStart && segmentTime <= projectEnd;
    });

    return (
      <div key={projectGroup.project.id} className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md rounded-full px-4 py-2 shadow-sm border border-white/20">
            <FiBriefcase className="text-violet-500 w-5 h-5" />
            <div>
              <span className="text-base font-semibold text-gray-700 block">{projectGroup.project.name}</span>
              <span className="text-sm text-gray-500">{formatDuration(projectGroup.totalDuration)}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pl-4">
          {relevantSegments.map((segment, idx, arr) => (
            <div key={segment.id} className="relative">
              <div className="relative w-full">
                {renderSegment(segment)}
                {/* Connector Line (if not last segment) */}
                {idx !== arr.length - 1 && (
                  <div className={`absolute top-8 -right-4 w-4 h-px hidden lg:block ${
                    segment.type === 'WORK' && arr[idx + 1].type === 'WORK'
                      ? 'bg-gradient-to-r from-violet-200 to-violet-400'
                      : segment.type === 'BREAK' && arr[idx + 1].type === 'BREAK'
                      ? 'bg-gradient-to-r from-amber-200 to-amber-400'
                      : 'bg-gradient-to-r from-violet-200 to-amber-400'
                  }`} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold font-outfit text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text">
          Session Timeline
        </h1>
        <p className="text-gray-500 mt-1">Visual representation of ongoing work and activities</p>
      </div>

      <div className="space-y-12 sm:space-y-16">
        <div className="relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* User Info */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/40 backdrop-blur-md p-1 shadow-lg border border-white/20 hover:shadow-xl hover:border-white/40 transition-all duration-300">
                <img
                  src={session.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}`}
                  alt={session.user.name}
                  className="w-full h-full rounded-full ring-2 ring-white/50"
                />
              </div>
              <span className={`absolute -bottom-1 right-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white ${
                session.user.isOnline ? 'bg-emerald-500' : 'bg-gray-400'
              }`} />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap text-center">
                <span className="text-sm sm:text-base font-medium text-gray-700 block">{session.user.name}</span>
                <span className={`text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full inline-block mt-1 sm:mt-1.5 ${
                  session.user.currentStatus === 'Active'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-amber-50 text-amber-600'
                }`}>
                  {session.user.currentStatus}
                </span>
              </div>
            </div>

            {/* Session Timeline */}
            <div className="flex-1 pt-12 sm:pt-4 w-full">
              <div className="relative">
                {/* Session Header */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
                  <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md rounded-full px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm border border-white/20">
                    {getStatusIcon(session.status)}
                    <span className="text-sm sm:text-base font-medium text-gray-700">Session</span>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {format(new Date(session.startTime), 'h:mm a')} - {
                        session.endTime ? format(new Date(session.endTime), 'h:mm a') : 'Ongoing'
                      }
                    </span>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 sm:ml-auto">
                    <div className="flex items-center gap-2">
                      <FiClock className="text-violet-500 w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base text-gray-700">{formatDuration(session.totalDuration)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiCoffee className="text-amber-500 w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base text-gray-700">{formatDuration(session.totalBreakTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Project Groups */}
                <div className="space-y-6">
                  {groupSegmentsByProject(session.segments).map((projectGroup) => 
                    renderProjectSegments(projectGroup, session.segments)
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 