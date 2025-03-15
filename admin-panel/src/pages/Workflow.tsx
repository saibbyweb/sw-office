import { FiClock, FiFileText, FiCoffee, FiPlay, FiCheck, FiX, FiLink, FiCalendar, FiBriefcase } from 'react-icons/fi';
import { format } from 'date-fns';

interface WorkLog {
  id: number;
  content: string;
  links: string[];
  createdAt: Date;
}

interface Project {
  id: number;
  name: string;
  isActive: boolean;
}

interface Segment {
  id: number;
  type: 'WORK' | 'BREAK';
  startTime: Date;
  endTime: Date | null;
  duration: number;
  project?: Project;
  workLogs?: WorkLog[];
  breakType?: string;
}

interface ProjectGroup {
  project: Project;
  segments: Segment[];
  totalDuration: number;
}

// Updated dummy data to match TypeScript types
const workflowData = {
  users: [{
    id: 1,
    name: 'Sarah K.',
    avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+K',
    currentStatus: 'Active',
    isOnline: true,
    sessions: [{
      id: 1,
      startTime: new Date('2024-03-15T09:00:00'),
      endTime: null,
      totalDuration: 28800,
      totalBreakTime: 4500,
      status: 'ACTIVE',
      segments: [
        // Website Redesign - Morning
        {
          id: 1,
          type: 'WORK' as const,
          startTime: new Date('2024-03-15T09:00:00'),
          endTime: new Date('2024-03-15T10:30:00'),
          duration: 5400,
          project: { id: 1, name: 'Website Redesign', isActive: true },
          workLogs: [
            { id: 1, content: 'Updated homepage layout', links: ['figma.com/file/123'], createdAt: new Date('2024-03-15T09:30:00') },
            { id: 2, content: 'Implemented responsive design', links: ['github.com/pr/456'], createdAt: new Date('2024-03-15T10:15:00') }
          ]
        },
        // Morning Break
        {
          id: 2,
          type: 'BREAK' as const,
          breakType: 'SHORT',
          startTime: new Date('2024-03-15T10:30:00'),
          endTime: new Date('2024-03-15T10:45:00'),
          duration: 900
        },
        // Mobile App - Morning
        {
          id: 3,
          type: 'WORK' as const,
          startTime: new Date('2024-03-15T10:45:00'),
          endTime: new Date('2024-03-15T12:00:00'),
          duration: 4500,
          project: { id: 2, name: 'Mobile App', isActive: true },
          workLogs: [
            { id: 3, content: 'Setup authentication flow', links: ['github.com/pr/789'], createdAt: new Date('2024-03-15T11:15:00') },
            { id: 4, content: 'Implemented OAuth integration', links: ['github.com/pr/790'], createdAt: new Date('2024-03-15T11:45:00') }
          ]
        },
        // Lunch Break
        {
          id: 4,
          type: 'BREAK' as const,
          breakType: 'LUNCH',
          startTime: new Date('2024-03-15T12:00:00'),
          endTime: new Date('2024-03-15T13:00:00'),
          duration: 3600
        },
        // Website Redesign - Early Afternoon
        {
          id: 5,
          type: 'WORK' as const,
          startTime: new Date('2024-03-15T13:00:00'),
          endTime: new Date('2024-03-15T14:15:00'),
          duration: 4500,
          project: { id: 1, name: 'Website Redesign', isActive: true },
          workLogs: [
            { id: 5, content: 'Added dark mode support', links: ['github.com/pr/791'], createdAt: new Date('2024-03-15T13:30:00') },
            { id: 6, content: 'Implemented theme switcher', links: ['github.com/pr/792'], createdAt: new Date('2024-03-15T14:00:00') }
          ]
        },
        // Mobile App - Mid Afternoon
        {
          id: 6,
          type: 'WORK' as const,
          startTime: new Date('2024-03-15T14:15:00'),
          endTime: new Date('2024-03-15T15:30:00'),
          duration: 4500,
          project: { id: 2, name: 'Mobile App', isActive: true },
          workLogs: [
            { id: 7, content: 'Added biometric authentication', links: ['github.com/pr/793'], createdAt: new Date('2024-03-15T14:45:00') },
            { id: 8, content: 'Implemented secure storage', links: ['github.com/pr/794'], createdAt: new Date('2024-03-15T15:15:00') }
          ]
        },
        // Afternoon Break
        {
          id: 7,
          type: 'BREAK' as const,
          breakType: 'PRAYER',
          startTime: new Date('2024-03-15T15:30:00'),
          endTime: new Date('2024-03-15T15:45:00'),
          duration: 900
        },
        // Website Redesign - Late Afternoon
        {
          id: 8,
          type: 'WORK' as const,
          startTime: new Date('2024-03-15T15:45:00'),
          endTime: new Date('2024-03-15T17:00:00'),
          duration: 4500,
          project: { id: 1, name: 'Website Redesign', isActive: true },
          workLogs: [
            { id: 9, content: 'Optimized performance', links: ['github.com/pr/795'], createdAt: new Date('2024-03-15T16:15:00') },
            { id: 10, content: 'Added analytics integration', links: ['github.com/pr/796'], createdAt: new Date('2024-03-15T16:45:00') }
          ]
        },
        // Mobile App - Evening
        {
          id: 9,
          type: 'WORK' as const,
          startTime: new Date('2024-03-15T17:00:00'),
          endTime: null,
          duration: 1800,
          project: { id: 2, name: 'Mobile App', isActive: true },
          workLogs: [
            { id: 11, content: 'Working on push notifications', links: ['github.com/pr/797'], createdAt: new Date('2024-03-15T17:15:00') }
          ]
        }
      ]
    }]
  }]
};

export default function WorkflowView() {
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

  const groupSegmentsByProject = (segments: Segment[]): ProjectGroup[] => {
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

  const renderSegment = (segment: Segment) => {
    const isWork = segment.type === 'WORK';
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
                      {format(segment.startTime, 'h:mm a')} - {segment.endTime ? format(segment.endTime, 'h:mm a') : 'Ongoing'}
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
                  <span className="text-sm font-medium">{segment.breakType} Break</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                  <FiCalendar className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">
                    {format(segment.startTime, 'h:mm a')} - {segment.endTime ? format(segment.endTime, 'h:mm a') : 'Ongoing'}
                  </span>
                </div>
                <span className="text-xs text-gray-500 mt-0.5 block">{formatDuration(segment.duration)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Work Logs */}
        {isWork && segment.workLogs && (
          <div className="p-2.5 space-y-2">
            {segment.workLogs.map((log) => (
              <div key={log.id} className="bg-white/40 backdrop-blur-sm rounded-md p-2.5 border border-white/20 hover:bg-white/60 transition-all duration-200">
                <div className="flex items-start gap-2">
                  <FiFileText className="text-gray-500 mt-0.5 shrink-0 w-4 h-4" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-gray-700">{log.content}</p>
                      <span className="text-xs text-gray-500 shrink-0 font-medium">
                        {format(log.createdAt, 'h:mm a')}
                      </span>
                    </div>
                    {log.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={`https://${link}`}
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

  const renderProjectSegments = (projectGroup: ProjectGroup, allSegments: Segment[]) => {
    // Get all segments that occurred between the first and last segments of this project
    const projectStart = Math.min(...projectGroup.segments.map(s => s.startTime.getTime()));
    const projectEnd = Math.max(...projectGroup.segments.map(s => (s.endTime?.getTime() || new Date().getTime())));
    
    const relevantSegments = allSegments.filter(segment => {
      const segmentTime = segment.startTime.getTime();
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
          Today's Workflow
        </h1>
        <p className="text-gray-500 mt-1">Visual representation of ongoing work and activities</p>
      </div>

      <div className="space-y-12 sm:space-y-16">
        {workflowData.users.map((user) => (
          <div key={user.id} className="relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* User Info */}
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/40 backdrop-blur-md p-1 shadow-lg border border-white/20 hover:shadow-xl hover:border-white/40 transition-all duration-300">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full rounded-full ring-2 ring-white/50"
                  />
                </div>
                <span className={`absolute -bottom-1 right-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white ${
                  user.isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                }`} />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap text-center">
                  <span className="text-sm sm:text-base font-medium text-gray-700 block">{user.name}</span>
                  <span className={`text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full inline-block mt-1 sm:mt-1.5 ${
                    user.currentStatus === 'Active'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {user.currentStatus}
                  </span>
                </div>
              </div>

              {/* Sessions Timeline */}
              <div className="flex-1 pt-12 sm:pt-4 w-full">
                {user.sessions.map((session) => (
                  <div key={session.id} className="relative">
                    {/* Session Header */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
                      <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md rounded-full px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm border border-white/20">
                        {getStatusIcon(session.status)}
                        <span className="text-sm sm:text-base font-medium text-gray-700">Session</span>
                        <span className="text-xs sm:text-sm text-gray-500">
                          {format(session.startTime, 'h:mm a')} - {session.endTime ? format(session.endTime, 'h:mm a') : 'Ongoing'}
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
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 