import React from 'react';
import styled from 'styled-components';
import { Session } from '../../../graphql/types';

interface SegmentsListProps {
  segments: Session['segments'];
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
`;

const SegmentItem = styled.div`
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}80;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.secondary}20;
`;

const SegmentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const SegmentType = styled.span<{ type: 'WORK' | 'BREAK' }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  background: ${props => props.type === 'WORK' 
    ? props.theme.colors.primary + '20'
    : props.theme.colors.warning + '20'};
  color: ${props => props.type === 'WORK'
    ? props.theme.colors.primary
    : props.theme.colors.warning};
`;

const ProjectName = styled.span`
  color: ${props => props.theme.colors.text};
  font-weight: 500;
`;

const TimeInfo = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${props => props.theme.colors.text}80;
  font-size: 0.875rem;
`;

const Duration = styled.span`
  font-family: monospace;
  color: ${props => props.theme.colors.text};
`;

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

  return parts.join(' ') || '0s';
};

export const SegmentsList: React.FC<SegmentsListProps> = ({ segments }) => {
  return (
    <Container>
      {segments.map(segment => (
        <SegmentItem key={segment.id}>
          <SegmentHeader>
            <SegmentType type={segment.type}>
              {segment.type === 'WORK' ? 'Work' : 'Break'}
              {segment.break && ` - ${segment.break.type}`}
            </SegmentType>
            {segment.project && (
              <ProjectName>{segment.project.name}</ProjectName>
            )}
          </SegmentHeader>
          <TimeInfo>
            <div>
              {formatTime(segment.startTime)}
              {segment.endTime ? ` - ${formatTime(segment.endTime)}` : ' - Active'}
            </div>
            <Duration>{formatDuration(segment.duration)}</Duration>
          </TimeInfo>
        </SegmentItem>
      ))}
    </Container>
  );
}; 