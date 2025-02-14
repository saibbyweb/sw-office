import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@apollo/client';
import { SESSION_WORK_LOGS } from '../../../graphql/queries';
import { SessionWorkLogsData, SessionWorkLogsVariables, WorkLog } from '../../../graphql/types';

interface WorkLogListProps {
  sessionId: string;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const WorkLogItem = styled.div`
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}80;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.secondary}20;
`;

const WorkLogHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const ProjectName = styled.span`
  color: ${props => props.theme.colors.primary};
  font-weight: 500;
`;

const Timestamp = styled.span`
  color: ${props => props.theme.colors.text}80;
  font-size: 0.875rem;
`;

const Content = styled.p`
  margin: ${props => props.theme.spacing.sm} 0;
  color: ${props => props.theme.colors.text};
  white-space: pre-wrap;
`;

const LinksList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.sm};
`;

const Link = styled.a`
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  font-size: 0.875rem;

  &:hover {
    text-decoration: underline;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.text}80;
  font-style: italic;
`;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
};

const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return true;
  } catch (err) {
    return false;
  }
};

const getDisplayUrl = (urlString: string): string => {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch (err) {
    // If URL parsing fails, return a truncated version of the original string
    return urlString.length > 30 ? `${urlString.substring(0, 30)}...` : urlString;
  }
};

export const WorkLogList: React.FC<WorkLogListProps> = ({ sessionId }) => {
  const { data, loading, error } = useQuery<SessionWorkLogsData, SessionWorkLogsVariables>(
    SESSION_WORK_LOGS,
    {
      variables: { sessionId },
      skip: !sessionId
    }
  );

  if (loading) {
    return <EmptyState>Loading work logs...</EmptyState>;
  }

  if (error) {
    return <EmptyState>Error loading work logs: {error.message}</EmptyState>;
  }

  if (!data?.sessionWorkLogs?.length) {
    return <EmptyState>No work logs added yet</EmptyState>;
  }

  return (
    <Container>
      {data.sessionWorkLogs.map((log: WorkLog) => (
        <WorkLogItem key={log.id}>
          <WorkLogHeader>
            <ProjectName>{log.project.name}</ProjectName>
            <Timestamp>{formatDate(log.createdAt)}</Timestamp>
          </WorkLogHeader>
          <Content>{log.content}</Content>
          {log.links.length > 0 && (
            <LinksList>
              {log.links.filter(link => link.trim()).map((link, index) => {
                // Only render valid URLs or show as plain text
                const validUrl = isValidUrl(link);
                return validUrl ? (
                  <Link 
                    key={index} 
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {getDisplayUrl(link)}
                  </Link>
                ) : (
                  <span key={index} style={{ fontSize: '0.875rem', color: '#666' }}>
                    {getDisplayUrl(link)}
                  </span>
                );
              })}
            </LinksList>
          )}
        </WorkLogItem>
      ))}
    </Container>
  );
}; 