import React, { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { useQuery } from '@apollo/client';
import { GET_USER_SESSIONS, GET_PROJECTS } from '../../../graphql/queries';
import { Session, Project } from '../../../graphql/types';
import { Button } from '../common';

enum SessionStatus {
  COMPLETED = 'COMPLETED',
  TERMINATED = 'TERMINATED'
}

interface SessionWithStats extends Session {
  totalDuration: number;
  totalBreakTime: number;
  workLogs: any[];
  project: Project | null;
}

interface PastSessionsScreenProps {
  onBack: () => void;
}

const Container = styled.div`
  height: 100vh;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  padding: ${props => props.theme.spacing.xl};
  overflow-y: auto;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xl};
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

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

const SearchInput = styled.input`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.secondary}40;
  background: ${props => props.theme.colors.background}80;
  color: ${props => props.theme.colors.text};
  width: 300px;
  font-size: 0.875rem;

  &::placeholder {
    color: ${props => props.theme.colors.text}60;
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${props => props.theme.spacing.xl};
`;

const ActivitySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;

const Card = styled.div`
  background: ${props => props.theme.colors.background}15;
  border-radius: 16px;
  padding: ${props => props.theme.spacing.xl};
  border: 1px solid ${props => props.theme.colors.secondary}20;
`;

const CardTitle = styled.h2`
  margin: 0 0 ${props => props.theme.spacing.lg};
  font-size: 1.25rem;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const GraphContainer = styled.div`
  height: 200px;
  margin: ${props => props.theme.spacing.md} 0;
  position: relative;
`;

const Graph = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  gap: 2px;
`;

const GraphBar = styled.div<{ height: number; isActive?: boolean }>`
  flex: 1;
  height: ${props => props.height}%;
  background: ${props => props.isActive 
    ? props.theme.colors.primary 
    : props.theme.colors.secondary}40;
  border-radius: 4px;
  transition: height 0.3s ease;
  cursor: pointer;

  &:hover {
    background: ${props => props.theme.colors.primary};
  }
`;

const CalendarCard = styled(Card)`
  padding: ${props => props.theme.spacing.lg};
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const CalendarTitle = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  color: ${props => props.theme.colors.text};
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${props => props.theme.spacing.xs};
`;

const WeekDay = styled.div`
  text-align: center;
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text}60;
  padding: ${props => props.theme.spacing.xs};
`;

const DayCell = styled.div<{ isActive?: boolean; isToday?: boolean }>`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  border-radius: 50%;
  cursor: pointer;
  background: ${props => props.isActive ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.isActive ? 'white' : props.theme.colors.text};
  border: ${props => props.isToday ? `2px solid ${props.theme.colors.primary}` : 'none'};

  &:hover {
    background: ${props => props.theme.colors.primary}40;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const StatCard = styled.div`
  background: ${props => props.theme.colors.background}20;
  border-radius: 12px;
  padding: ${props => props.theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}60;
`;

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const PastSessionsScreen: React.FC<PastSessionsScreenProps> = ({ onBack }) => {
  const theme = useTheme();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<SessionStatus[]>([]);

  const { data: projectsData } = useQuery(GET_PROJECTS);
  const { data: sessionsData, loading } = useQuery<{ userSessions: SessionWithStats[] }>(GET_USER_SESSIONS, {
    variables: {
      input: {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        projectIds: selectedProjects.length ? selectedProjects : undefined,
        statuses: selectedStatuses.length ? selectedStatuses : undefined,
        sortDescending: true,
      },
    },
  });

  const totalWorkTime = sessionsData?.userSessions.reduce(
    (total, session) => total + (session.totalDuration - session.totalBreakTime),
    0
  ) || 0;

  const totalBreakTime = sessionsData?.userSessions.reduce(
    (total, session) => total + session.totalBreakTime,
    0
  ) || 0;

  const totalSessions = sessionsData?.userSessions.length || 0;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <TopBar>
        <Title>
          <MainTitle>Activity Overview</MainTitle>
          <Subtitle>Track your work sessions and productivity</Subtitle>
        </Title>
        <SearchBar>
          <SearchInput placeholder="Search activities..." />
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        </SearchBar>
      </TopBar>

      <StatsGrid>
        <StatCard>
          <StatValue>{formatDuration(totalWorkTime)}</StatValue>
          <StatLabel>Total Work Time</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{formatDuration(totalBreakTime)}</StatValue>
          <StatLabel>Total Break Time</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{totalSessions}</StatValue>
          <StatLabel>Total Sessions</StatLabel>
        </StatCard>
      </StatsGrid>

      <MainContent>
        <ActivitySection>
          <Card>
            <CardTitle>
              <span role="img" aria-label="activity">📊</span>
              Physical Activity
            </CardTitle>
            <GraphContainer>
              <Graph>
                {Array.from({ length: 24 }, (_, i) => (
                  <GraphBar 
                    key={i} 
                    height={Math.random() * 100} 
                    isActive={i === 12}
                  />
                ))}
              </Graph>
            </GraphContainer>
          </Card>

          {sessionsData?.userSessions.map((session: SessionWithStats) => (
            <Card key={session.id}>
              <CardTitle>
                {formatDate(session.startTime)}
                <span style={{ 
                  marginLeft: 'auto', 
                  fontSize: '0.875rem', 
                  color: theme.colors.text + '60' 
                }}>
                  {session.project?.name || 'No Project'}
                </span>
              </CardTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div>
                  <StatLabel>Total Duration</StatLabel>
                  <StatValue>{formatDuration(session.totalDuration)}</StatValue>
                </div>
                <div>
                  <StatLabel>Active Work</StatLabel>
                  <StatValue>{formatDuration(session.totalDuration - session.totalBreakTime)}</StatValue>
                </div>
                <div>
                  <StatLabel>Break Time</StatLabel>
                  <StatValue>{formatDuration(session.totalBreakTime)}</StatValue>
                </div>
              </div>
            </Card>
          ))}
        </ActivitySection>

        <CalendarCard>
          <CalendarHeader>
            <CalendarTitle>Your Active Days</CalendarTitle>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="secondary" size="small">◀</Button>
              <Button variant="secondary" size="small">▶</Button>
            </div>
          </CalendarHeader>
          <CalendarGrid>
            {weekDays.map(day => (
              <WeekDay key={day}>{day}</WeekDay>
            ))}
            {Array.from({ length: 35 }, (_, i) => (
              <DayCell 
                key={i} 
                isActive={Math.random() > 0.7}
                isToday={i === 15}
              >
                {i + 1}
              </DayCell>
            ))}
          </CalendarGrid>
        </CalendarCard>
      </MainContent>
    </Container>
  );
}; 