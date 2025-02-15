import React, { useState } from 'react';
import styled from 'styled-components';
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
  padding: ${props => props.theme.spacing.xl};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const Title = styled.h1`
  margin: 0;
  color: ${props => props.theme.colors.text};
  font-size: 2rem;
  font-weight: 600;
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
  flex-wrap: wrap;
`;

const SessionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const SessionCard = styled.div`
  background: ${props => props.theme.colors.background}80;
  border: 1px solid ${props => props.theme.colors.secondary}40;
  border-radius: 12px;
  padding: ${props => props.theme.spacing.lg};
`;

const SessionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const SessionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const SessionDate = styled.div`
  font-size: 1.25rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`;

const ProjectName = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.primary};
`;

const SessionStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text}80;
`;

const StatValue = styled.div`
  font-size: 1rem;
  color: ${props => props.theme.colors.text};
  font-weight: 500;
`;

const DateInput = styled.input`
  padding: 0.5rem;
  border: 1px solid ${props => props.theme.colors.secondary}40;
  border-radius: 8px;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid ${props => props.theme.colors.secondary}40;
  border-radius: 8px;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
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

export const PastSessionsScreen: React.FC<PastSessionsScreenProps> = ({ onBack }) => {
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Header>
        <Title>Past Sessions</Title>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </Header>

      <FiltersContainer>
        <DateInput
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start Date"
        />
        <DateInput
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="End Date"
        />
        <Select
          multiple
          value={selectedProjects}
          onChange={(e) => {
            const options = Array.from(e.target.selectedOptions, (option) => option.value);
            setSelectedProjects(options);
          }}
        >
          {projectsData?.projects.map((project: Project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
        <Select
          multiple
          value={selectedStatuses}
          onChange={(e) => {
            const options = Array.from(e.target.selectedOptions, (option) => option.value);
            setSelectedStatuses(options as SessionStatus[]);
          }}
        >
          <option value={SessionStatus.COMPLETED}>Completed</option>
          <option value={SessionStatus.TERMINATED}>Terminated</option>
        </Select>
      </FiltersContainer>

      <SessionsList>
        {sessionsData?.userSessions.map((session: SessionWithStats) => (
          <SessionCard key={session.id}>
            <SessionHeader>
              <SessionInfo>
                <SessionDate>{formatDate(session.startTime)}</SessionDate>
                <ProjectName>{session.project?.name || 'No Project'}</ProjectName>
              </SessionInfo>
              <div>{session.status}</div>
            </SessionHeader>
            <SessionStats>
              <StatItem>
                <StatLabel>Total Duration</StatLabel>
                <StatValue>{formatDuration(session.totalDuration)}</StatValue>
              </StatItem>
              <StatItem>
                <StatLabel>Active Work Time</StatLabel>
                <StatValue>
                  {formatDuration(session.totalDuration - session.totalBreakTime)}
                </StatValue>
              </StatItem>
              <StatItem>
                <StatLabel>Break Time</StatLabel>
                <StatValue>{formatDuration(session.totalBreakTime)}</StatValue>
              </StatItem>
              <StatItem>
                <StatLabel>Work Logs</StatLabel>
                <StatValue>{session.workLogs.length}</StatValue>
              </StatItem>
            </SessionStats>
          </SessionCard>
        ))}
      </SessionsList>
    </Container>
  );
}; 