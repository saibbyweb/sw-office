import React, { useState, useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useQuery } from '@apollo/client';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Briefcase, Coffee } from 'react-feather';
import { BillingCycleCalendar } from '../common/BillingCycleCalendar';
import { Button } from '../common';
import { Header } from '../common/Header';
import { Loader } from '../common/Loader';
import { UserProfileModal } from '../UserProfileModal';
import { gql } from '@apollo/client';

const Container = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 4fr 1fr;
  gap: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  flex: 1;
  overflow: hidden;
`;

const CalendarWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  height: calc(100vh - 140px);
`;

const CalendarContainer = styled.div`
  position: relative;
  width: 100%;
`;

const CalendarOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.background}80;
  backdrop-filter: blur(4px);
  border-radius: 16px;
`;

const CurrentMonthButton = styled(Button)`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  font-size: 0.875rem;
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.text}20;
  backdrop-filter: blur(8px);

  &:hover {
    background: ${props => props.theme.colors.background}CC;
    border-color: ${props => props.theme.colors.text}40;
  }
`;

const CalendarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  width: 100%;
`;

const CalendarActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const CalendarStats = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}80;
  border: 1px solid ${props => props.theme.colors.text}10;
  border-radius: 8px;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}CC;
  backdrop-filter: blur(8px);
`;

const StatsCount = styled.span`
  color: ${props => props.theme.colors.text};
  font-weight: 600;
`;

const SessionDetailsContainer = styled.div`
  background: ${props => props.theme.colors.background}30;
  border: 1px solid ${props => props.theme.colors.text}10;
  border-radius: 16px;
  padding: ${props => props.theme.spacing.xl};
  backdrop-filter: blur(12px);
  height: calc(100vh - 140px);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.background}20;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.text}20;
    border-radius: 4px;

    &:hover {
      background: ${props => props.theme.colors.text}30;
    }
  }
`;

const NoSessionsPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  color: ${props => props.theme.colors.text}60;
  font-size: 0.875rem;
  min-height: 300px;
  height: 100%;

  svg {
    color: ${props => props.theme.colors.text}40;
    margin-bottom: ${props => props.theme.spacing.sm};
  }
`;

const PlaceholderText = styled.div`
  font-size: 1rem;
  color: ${props => props.theme.colors.text}90;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const PlaceholderSubtext = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}60;
`;

const SessionHeader = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const SessionTime = styled.div`
  color: ${props => props.theme.colors.text}80;
  font-size: 0.875rem;
  margin-top: ${props => props.theme.spacing.xs};
`;

const ProjectName = styled.div`
  display: inline-block;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.primary}20;
  color: ${props => props.theme.colors.primary};
  border-radius: 4px;
  font-size: 0.875rem;
  margin-top: ${props => props.theme.spacing.sm};
`;

const WorkLogList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const WorkLogItem = styled.div`
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.background}80;
  border: 1px solid ${props => props.theme.colors.text}10;
  border-radius: 6px;
  margin-bottom: ${props => props.theme.spacing.xs};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const WorkLogContent = styled.div`
  white-space: pre-wrap;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const WorkLogTime = styled.div`
  color: ${props => props.theme.colors.text}60;
  font-size: 0.75rem;
`;

const SessionStats = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xl};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}40;
  border: 1px solid ${props => props.theme.colors.text}10;
  border-radius: 12px;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text}90;
  font-size: 0.875rem;

  svg {
    color: ${props => props.theme.colors.primary};
  }
`;

const ProjectSegment = styled.div`
  background: ${props => props.theme.colors.background}40;
  border: 1px solid ${props => props.theme.colors.text}10;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const ProjectHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.primary}10;
  border-bottom: 1px solid ${props => props.theme.colors.text}10;
`;

const ProjectTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.primary};
  font-weight: 500;
`;

const TimeSegment = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.text}10;
  
  &:last-child {
    border-bottom: none;
  }
`;

const TimeRange = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${props => props.theme.colors.text}90;
  font-size: 0.75rem;
`;

const Duration = styled.div`
  color: ${props => props.theme.colors.text}60;
  font-size: 0.875rem;
`;

const WorkLogsSection = styled.div`
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}20;
`;

// Add new styled components for breaks
const BreakSegment = styled(ProjectSegment)`
  background: ${props => props.theme.colors.background}30;
`;

const BreakHeader = styled(ProjectHeader)`
  background: ${props => props.theme.colors.warning}10;
  border-bottom: 1px solid ${props => props.theme.colors.warning}20;
`;

const BreakTitle = styled(ProjectTitle)`
  color: ${props => props.theme.colors.warning};
`;

// Add new timeline styled components
const TimelineContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md} 0;
`;

const TimelineItem = styled.div<{ isBreak?: boolean }>`
  position: relative;
  flex: ${props => props.isBreak ? '0 0 calc(50% - 8px)' : '0 0 100%'};
  min-width: 250px;
  
  @media (max-width: 768px) {
    flex: 0 0 100%;
  }
`;

const TimelineSegment = styled.div<{ isBreak?: boolean }>`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
  height: 100%;
  border: 1px solid ${({ isBreak }) => isBreak ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 255, 255, 0.1)'};

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }
`;

const SegmentHeader = styled.div<{ isBreak?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: ${({ isBreak }) => isBreak ? 'rgba(255, 193, 7, 0.1)' : 'rgba(99, 102, 241, 0.1)'};
  border-bottom: 1px solid ${({ isBreak }) => isBreak ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
`;

const SegmentTitle = styled.div<{ isBreak?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ isBreak }) => isBreak ? '#ffc107' : '#6366f1'};
  font-weight: 500;
  font-size: 0.875rem;
`;

const TimelineBody = styled.div`
  padding: 6px 12px;
`;

const TimelineFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-top: 1px solid ${props => props.theme.colors.text}10;
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text}60;
`;

const WorkLogsList = styled.div`
  margin-top: ${props => props.theme.spacing.sm};
  padding-top: ${props => props.theme.spacing.sm};
  border-top: 1px solid ${props => props.theme.colors.text}10;
`;

// Add new styled components for session tabs
const SessionTabs = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}40;
  border: 1px solid ${props => props.theme.colors.text}10;
  border-radius: 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.background}20;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.text}20;
    border-radius: 3px;

    &:hover {
      background: ${props => props.theme.colors.text}30;
    }
  }
`;

const SessionTab = styled.button<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background: ${props => props.isActive ? `${props.theme.colors.primary}15` : 'transparent'};
  border: 1px solid ${props => props.isActive ? `${props.theme.colors.primary}40` : `${props.theme.colors.text}10`};
  border-radius: 8px;
  color: ${props => props.isActive ? props.theme.colors.primary : `${props.theme.colors.text}90`};
  font-size: 0.9375rem;
  font-weight: ${props => props.isActive ? '500' : '400'};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => `${props.theme.colors.primary}10`};
    border-color: ${props => `${props.theme.colors.primary}30`};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

interface PastSessionsScreenProps {
  onBack: () => void;
}

interface SessionDate {
  startTime: string;
  id: string;
}

interface SessionDatesData {
  userSessionDates: SessionDate[];
}

interface Session {
  id: string;
  startTime: string;
  endTime: string | null;
  totalDuration: number;
  totalBreakTime: number;
  status: string;
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
    workLogs: Array<{
      id: string;
      content: string;
      createdAt: string;
      updatedAt: string;
    }>;
  }>;
  breaks: Array<{
    id: string;
    type: string;
    startTime: string;
    endTime: string | null;
    duration: number;
  }>;
}

interface WorkLog {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface SessionData {
  session: Session;
}

interface WorkLogsData {
  sessionWorkLogs: WorkLog[];
}

const GET_SESSION_DATES = gql`
  query GetSessionDates($input: GetSessionDatesInput!) {
    userSessionDates(input: $input) {
      startTime
      id
    }
  }
`;

const GET_SESSION = gql`
  query GetSession($id: ID!) {
    session(id: $id) {
      id
      startTime
      endTime
      totalDuration
      totalBreakTime
      status
      project {
        id
        name
      }
      segments {
        id
        type
        startTime
        endTime
        duration
        project {
          id
          name
        }
        break {
          id
          type
          startTime
          endTime
          duration
        }
      }
      breaks {
        id
        type
        startTime
        endTime
        duration
      }
    }
  }
`;

const GET_SESSION_WORKLOGS = gql`
  query GetSessionWorkLogs($sessionId: ID!) {
    sessionWorkLogs(sessionId: $sessionId) {
      id
      content
      createdAt
      updatedAt
    }
  }
`;

// Add ME query
const ME = gql`
  query Me {
    me {
      id
      name
      email
      avatarUrl
    }
  }
`;

interface CalendarProps {
  activeDates: Date[];
  onMonthChange: (startDate: Date, endDate: Date) => void;
  currentDate: Date;
  onDateClick?: (date: Date) => void;
  selectedDate?: Date | null;
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

// Helper function to get billing cycle start and end dates
const getBillingCycle = (referenceDate: Date, billingDay: number = 19) => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  let cycleStart: Date;
  let cycleEnd: Date;

  if (day >= billingDay) {
    cycleStart = new Date(year, month, billingDay);
    cycleEnd = new Date(year, month + 1, billingDay - 1);
  } else {
    cycleStart = new Date(year, month - 1, billingDay);
    cycleEnd = new Date(year, month, billingDay - 1);
  }

  return { cycleStart, cycleEnd };
};

export const PastSessionsScreen: React.FC<PastSessionsScreenProps> = ({ onBack }) => {
  const [currentCycleDate, setCurrentCycleDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const today = new Date();

  const { cycleStart, cycleEnd } = useMemo(() =>
    getBillingCycle(currentCycleDate, 19),
    [currentCycleDate]
  );

  // Add ME query
  const { data: userData } = useQuery(ME);

  const { data: sessionDatesData, loading: datesLoading } = useQuery<SessionDatesData>(GET_SESSION_DATES, {
    variables: {
      input: {
        startDate: new Date(cycleStart.setHours(0, 0, 0, 0)),
        endDate: new Date(cycleEnd.setHours(23, 59, 59, 999)),
      },
    },
    fetchPolicy: 'network-only',
  });

  const { data: sessionData, loading: sessionLoading } = useQuery<SessionData>(GET_SESSION, {
    variables: { id: selectedSessionId },
    skip: !selectedSessionId,
  });

  const { data: workLogsData, loading: workLogsLoading } = useQuery<WorkLogsData>(GET_SESSION_WORKLOGS, {
    variables: { sessionId: selectedSessionId },
    skip: !selectedSessionId,
  });

  // Set the most recent session only on initial load
  useEffect(() => {
    if (sessionDatesData?.userSessionDates && 
        sessionDatesData.userSessionDates.length > 0 && 
        !selectedDate && 
        !selectedSessionId) {
      const sortedDates = [...sessionDatesData.userSessionDates].sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      const mostRecent = sortedDates[0];
      setSelectedDate(new Date(mostRecent.startTime));
      setSelectedSessionId(mostRecent.id);
    }
  }, [sessionDatesData, selectedDate, selectedSessionId]);

  const handleCycleChange = useCallback((startDate: Date, endDate: Date) => {
    setCurrentCycleDate(startDate);
  }, []);

  const handleGoToCurrentCycle = useCallback(() => {
    setCurrentCycleDate(today);
  }, [today]);

  const isCurrentCycle = useMemo(() => {
    const { cycleStart: currentStart, cycleEnd: currentEnd } = getBillingCycle(today, 19);
    return cycleStart.getTime() === currentStart.getTime() && cycleEnd.getTime() === currentEnd.getTime();
  }, [cycleStart, cycleEnd, today]);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    const sessionDatesForDay = sessionDatesData?.userSessionDates.filter(
      sd => format(new Date(sd.startTime), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) || [];
    
    if (sessionDatesForDay.length > 0) {
      // Select the earliest session of the day
      setSelectedSessionId(sessionDatesForDay[0].id);
    } else {
      setSelectedSessionId(null);
    }
  }, [sessionDatesData]);

  const activeDates = sessionDatesData?.userSessionDates || [];
  const isLoading = datesLoading || (selectedSessionId && (sessionLoading || workLogsLoading));

  const renderSessionDetails = () => {
    if (sessionLoading) {
      return <Loader />;
    }

    if (!selectedDate) {
      return (
        <NoSessionsPlaceholder>
          <CalendarIcon size={48} />
          <PlaceholderText>Select a date to view session details</PlaceholderText>
          <PlaceholderSubtext>
            Click on any highlighted date in the calendar
          </PlaceholderSubtext>
        </NoSessionsPlaceholder>
      );
    }

    if (!selectedSessionId || !sessionData?.session) {
      return (
        <NoSessionsPlaceholder>
          <CalendarIcon size={48} />
          <PlaceholderText>
            No sessions on {format(selectedDate, 'MMMM d, yyyy')}
          </PlaceholderText>
          <PlaceholderSubtext>
            {activeDates.length === 0
              ? `There are no recorded sessions in ${format(cycleStart, 'MMM d')} - ${format(cycleEnd, 'MMM d, yyyy')}`
              : 'Select a highlighted date to view session details'
            }
          </PlaceholderSubtext>
        </NoSessionsPlaceholder>
      );
    }

    const session = sessionData.session;
    const sessionsForSelectedDate = sessionDatesData?.userSessionDates
      .filter(sd => format(new Date(sd.startTime), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) || [];
    
    // Combine work segments and breaks into a timeline
    const timeline = [
      ...session.segments.map(segment => ({
        ...segment,
        isBreak: segment.type === 'BREAK',
        time: new Date(segment.startTime).getTime()
      }))
    ].sort((a, b) => a.time - b.time);

    return (
      <>
        {sessionsForSelectedDate.length > 1 && (
          <SessionTabs>
            {sessionsForSelectedDate.map((sessionDate, index) => (
              <SessionTab
                key={sessionDate.id}
                isActive={sessionDate.id === selectedSessionId}
                onClick={() => setSelectedSessionId(sessionDate.id)}
              >
                <Clock size={16} />
                Session {index + 1} • {format(new Date(sessionDate.startTime), 'h:mm a')}
              </SessionTab>
            ))}
          </SessionTabs>
        )}

        <SessionHeader>
          <h2>Session Details</h2>
          <SessionTime>
            {format(new Date(session.startTime), 'MMMM d, yyyy')}
          </SessionTime>
        </SessionHeader>

        <SessionStats>
          <StatItem>
            <Clock size={16} />
            {format(new Date(session.startTime), 'h:mm a')} - {
              session.endTime 
                ? format(new Date(session.endTime), 'h:mm a')
                : 'Ongoing'
            }
          </StatItem>
          <StatItem>
            <Clock size={16} />
            Total Work: {formatDuration(session.totalDuration - session.totalBreakTime)}
          </StatItem>
          <StatItem>
            <Coffee size={16} />
            Total Break: {formatDuration(session.totalBreakTime)}
          </StatItem>
        </SessionStats>

        <TimelineContainer>
          {timeline.map((segment) => {
            const segmentWorkLogs = !segment.isBreak && workLogsData?.sessionWorkLogs
              ? workLogsData.sessionWorkLogs.filter(log => {
                  const logTime = new Date(log.createdAt).getTime();
                  const segmentStart = new Date(segment.startTime).getTime();
                  const segmentEnd = segment.endTime ? new Date(segment.endTime).getTime() : Date.now();
                  return logTime >= segmentStart && logTime <= segmentEnd;
                })
              : [];
            
            const hasWorkLogs = segmentWorkLogs.length > 0;
            
            return (
              <TimelineItem 
                key={segment.id} 
                isBreak={segment.isBreak || !hasWorkLogs}
              >
                <TimelineSegment isBreak={segment.isBreak}>
                  <SegmentHeader isBreak={segment.isBreak}>
                    <SegmentTitle isBreak={segment.isBreak}>
                      {segment.isBreak ? (
                        <>
                          <Coffee size={14} />
                          {segment.break?.type || 'Break'}
                        </>
                      ) : (
                        <>
                          <Briefcase size={14} />
                          {segment.project?.name || 'No Project'}
                        </>
                      )}
                    </SegmentTitle>
                    <Duration>{formatDuration(segment.duration)}</Duration>
                  </SegmentHeader>
                  <TimelineBody>
                    <TimeRange>
                      <Clock size={14} />
                      {format(new Date(segment.startTime), 'h:mm a')} - {
                        segment.endTime 
                          ? format(new Date(segment.endTime), 'h:mm a')
                          : 'Ongoing'
                      }
                    </TimeRange>
                    {hasWorkLogs && (
                      <WorkLogsList>
                        {segmentWorkLogs.map(log => (
                          <WorkLogItem key={log.id}>
                            {log.content}
                          </WorkLogItem>
                        ))}
                      </WorkLogsList>
                    )}
                  </TimelineBody>
                  <TimelineFooter>
                    <div>{format(new Date(segment.startTime), 'h:mm a')}</div>
                    <div>{formatDuration(segment.duration)}</div>
                  </TimelineFooter>
                </TimelineSegment>
              </TimelineItem>
            );
          })}
        </TimelineContainer>
      </>
    );
  };

  return (
    <Container>
      <Header
        userName={userData?.me?.name}
        userEmail={userData?.me?.email}
        onProfileEdit={() => {}}
        onLogout={onBack}
        showBackButton
        onBack={onBack}
        screenName="Session History"
        onUserClick={() => setSelectedProfileUserId(userData?.me?.id || null)}
      />

      <MainContent>
        <SessionDetailsContainer>
          {renderSessionDetails()}
        </SessionDetailsContainer>

        <CalendarWrapper>
          <CalendarStats>
            <StatsCount>{activeDates.length}</StatsCount> sessions in {format(cycleStart, 'MMM d')} - {format(cycleEnd, 'MMM d, yyyy')}
          </CalendarStats>
          <CalendarContainer>
            <BillingCycleCalendar
              activeDates={activeDates.map(date => new Date(date.startTime))}
              onCycleChange={handleCycleChange}
              currentDate={currentCycleDate}
              onDateClick={handleDateClick}
              selectedDate={selectedDate}
              billingDayOfMonth={19}
            />
            {datesLoading && (
              <CalendarOverlay>
                <Loader />
              </CalendarOverlay>
            )}
          </CalendarContainer>
          {!isCurrentCycle && (
            <CurrentMonthButton variant="secondary" onClick={handleGoToCurrentCycle}>
              Go to Current Cycle
            </CurrentMonthButton>
          )}
        </CalendarWrapper>
      </MainContent>
      {selectedProfileUserId && (
        <UserProfileModal
          userId={selectedProfileUserId}
          onClose={() => setSelectedProfileUserId(null)}
        />
      )}
    </Container>
  );
}; 