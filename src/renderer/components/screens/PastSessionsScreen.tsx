import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useQuery } from '@apollo/client';
import { startOfMonth, endOfMonth, format, isSameMonth } from 'date-fns';
import { Calendar as CalendarIcon } from 'react-feather';
import { Calendar } from '../common/Calendar';
import { Button } from '../common';
import { Loader } from '../common/Loader';
import { gql } from '@apollo/client';

const Container = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  padding: ${props => props.theme.spacing.xl};
  overflow-y: auto;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto ${props => props.theme.spacing.xl};
  padding: 0 ${props => props.theme.spacing.md};
`;

const Title = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const MainTitle = styled.h1`
  margin: 0;
  color: ${props => props.theme.colors.text};
  font-size: 2rem;
  font-weight: 600;
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${props => props.theme.colors.text}80;
  font-size: 0.875rem;
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: ${props => props.theme.spacing.xl};
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${props => props.theme.spacing.md};
`;

const CalendarWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.xl} 0;
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
  height: calc(100vh - 200px);
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
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}80;
  border: 1px solid ${props => props.theme.colors.text}10;
  border-radius: 8px;
`;

const WorkLogContent = styled.div`
  white-space: pre-wrap;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const WorkLogTime = styled.div`
  color: ${props => props.theme.colors.text}60;
  font-size: 0.75rem;
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
  project: {
    id: string;
    name: string;
  };
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
      project {
        id
        name
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

interface CalendarProps {
  activeDates: Date[];
  onMonthChange: (startDate: Date, endDate: Date) => void;
  currentDate: Date;
  onDateClick?: (date: Date) => void;
  selectedDate?: Date | null;
}

export const PastSessionsScreen: React.FC<PastSessionsScreenProps> = ({ onBack }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const today = new Date();

  const { data: sessionDatesData, loading: datesLoading } = useQuery<SessionDatesData>(GET_SESSION_DATES, {
    variables: {
      input: {
        startDate: new Date(startOfMonth(currentMonth).setHours(0, 0, 0, 0)),
        endDate: new Date(endOfMonth(currentMonth).setHours(23, 59, 59, 999)),
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

  const handleMonthChange = useCallback((startDate: Date, endDate: Date) => {
    setCurrentMonth(startDate);
  }, []);

  const handleGoToCurrentMonth = useCallback(() => {
    setCurrentMonth(today);
  }, [today]);

  const handleDateClick = useCallback((date: Date) => {
    const sessionDate = sessionDatesData?.userSessionDates.find(
      sd => format(new Date(sd.startTime), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    setSelectedDate(date);
    if (sessionDate) {
      setSelectedSessionId(sessionDate.id);
    } else {
      setSelectedSessionId(null);
    }
  }, [sessionDatesData]);

  const activeDates = sessionDatesData?.userSessionDates || [];
  const isCurrentMonth = isSameMonth(currentMonth, today);
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
              ? `There are no recorded sessions in ${format(currentMonth, 'MMMM yyyy')}`
              : 'Select a highlighted date to view session details'
            }
          </PlaceholderSubtext>
        </NoSessionsPlaceholder>
      );
    }

    return (
      <>
        <SessionHeader>
          <h2>Session Details</h2>
          <SessionTime>
            {format(new Date(sessionData.session.startTime), 'PPpp')}
            {sessionData.session.endTime && (
              <>
                {' '}to{' '}
                {format(new Date(sessionData.session.endTime), 'PPpp')}
              </>
            )}
          </SessionTime>
          <ProjectName>{sessionData.session.project.name}</ProjectName>
        </SessionHeader>

        <h3>Work Logs</h3>
        {workLogsLoading ? (
          <Loader />
        ) : (
          <WorkLogList>
            {workLogsData?.sessionWorkLogs.map(log => (
              <WorkLogItem key={log.id}>
                <WorkLogContent>{log.content}</WorkLogContent>
                <WorkLogTime>
                  {format(new Date(log.createdAt), 'PPpp')}
                  {log.updatedAt !== log.createdAt && ' (edited)'}
                </WorkLogTime>
              </WorkLogItem>
            ))}
            {workLogsData?.sessionWorkLogs.length === 0 && (
              <div>No work logs for this session</div>
            )}
          </WorkLogList>
        )}
      </>
    );
  };

  return (
    <Container>
      <TopBar>
        <Title>
          <MainTitle>Activity Calendar</MainTitle>
          <Subtitle>View your work session history</Subtitle>
        </Title>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </TopBar>

      <MainContent>
        <SessionDetailsContainer>
          {renderSessionDetails()}
        </SessionDetailsContainer>

        <CalendarWrapper>
          <CalendarStats>
            <StatsCount>{activeDates.length}</StatsCount> sessions in {format(currentMonth, 'MMMM yyyy')}
          </CalendarStats>
          <CalendarContainer>
            <Calendar 
              activeDates={activeDates.map(date => new Date(date.startTime))} 
              onMonthChange={handleMonthChange}
              currentDate={currentMonth}
              onDateClick={handleDateClick}
              selectedDate={selectedDate}
            />
            {datesLoading && (
              <CalendarOverlay>
                <Loader />
              </CalendarOverlay>
            )}
          </CalendarContainer>
          {!isCurrentMonth && (
            <CurrentMonthButton variant="secondary" onClick={handleGoToCurrentMonth}>
              Go to Current Month
            </CurrentMonthButton>
          )}
        </CalendarWrapper>
      </MainContent>
    </Container>
  );
}; 