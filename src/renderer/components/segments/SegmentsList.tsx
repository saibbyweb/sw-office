import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Session } from '../../../graphql/types';
import { localNotificationService } from '../../../services/LocalNotificationService';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_BREAK_NOTIFICATION_DURATION = gql`
  query GetBreakNotificationDuration {
    getBreakNotificationDuration
  }
`;

interface SegmentsListProps {
  segments: Session['segments'];
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const GroupContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const GroupTitle = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}80;
  font-weight: 500;
`;

const TotalDuration = styled.div<{ type: 'WORK' | 'BREAK' }>`
  font-size: 0.875rem;
  font-family: monospace;
  color: ${props => props.type === 'WORK' 
    ? props.theme.colors.primary 
    : props.theme.colors.warning};
  font-weight: 500;
`;

const SegmentsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
`;

const SegmentChip = styled.div<{ type: 'WORK' | 'BREAK'; isActive?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => {
    if (props.isActive) {
      return props.type === 'WORK' 
        ? props.theme.colors.primary + '30'
        : props.theme.colors.warning + '30';
    }
    return props.type === 'WORK' 
      ? props.theme.colors.primary + '15'
      : props.theme.colors.warning + '15';
  }};
  border: 1px solid ${props => {
    if (props.isActive) {
      return props.type === 'WORK'
        ? props.theme.colors.primary
        : props.theme.colors.warning;
    }
    return props.type === 'WORK'
      ? props.theme.colors.primary + '30'
      : props.theme.colors.warning + '30';
  }};
  border-radius: 20px;
  font-size: 0.875rem;
  position: relative;
  
  ${props => props.isActive && `
    &::after {
      content: '';
      position: absolute;
      right: 8px;
      top: 8px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${props.type === 'WORK' 
        ? props.theme.colors.primary 
        : props.theme.colors.warning};
      animation: pulse 2s infinite;
    }
  `}

  @keyframes pulse {
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 ${props => props.type === 'WORK' 
        ? props.theme.colors.primary + '70'
        : props.theme.colors.warning + '70'};
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 6px ${props => props.type === 'WORK'
        ? props.theme.colors.primary + '00'
        : props.theme.colors.warning + '00'};
    }
    100% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 ${props => props.type === 'WORK'
        ? props.theme.colors.primary + '00'
        : props.theme.colors.warning + '00'};
    }
  }
`;

const Type = styled.span<{ type: 'WORK' | 'BREAK' }>`
  color: ${props => props.type === 'WORK'
    ? props.theme.colors.primary
    : props.theme.colors.warning};
  font-weight: 500;
`;

const Project = styled.span`
  color: ${props => props.theme.colors.text}80;
  font-size: 0.75rem;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Duration = styled.span`
  color: ${props => props.theme.colors.text};
  font-family: monospace;
  font-size: 0.75rem;
`;

const Separator = styled.span`
  color: ${props => props.theme.colors.text}40;
  margin: 0 ${props => props.theme.spacing.xs};
`;

const calculateSegmentDuration = (segment: Session['segments'][0], now: number): number => {
  if (segment.endTime) {
    return segment.duration;
  }
  // For active segment, calculate duration up to current time
  const startTime = new Date(segment.startTime).getTime();
  return Math.floor((now - startTime) / 1000);
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${remainingSeconds}s`);
  
  return parts.join(' ');
};

export const SegmentsList: React.FC<SegmentsListProps> = ({ segments }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const workSegments = segments.filter(s => s.type === 'WORK');
  const breakSegments = segments.filter(s => s.type === 'BREAK');
  const [notifiedSegments] = useState(new Set<string>());
  
  const { data: breakNotificationData } = useQuery(GET_BREAK_NOTIFICATION_DURATION);
  const notificationThreshold = breakNotificationData?.getBreakNotificationDuration ?? 16; // Default to 15 minutes if query hasn't loaded

  // Update current time every second for active segment
  useEffect(() => {
    const activeSegment = segments.find(s => !s.endTime);
    
    if (!activeSegment) return;

    const interval = setInterval(() => {
      if (activeSegment.type === "BREAK") {
        const duration = calculateSegmentDuration(activeSegment, Date.now());
        if (duration >= notificationThreshold && !notifiedSegments.has(activeSegment.id)) {
          localNotificationService.showInfo(
            `Your break has exceeded ${Math.floor(notificationThreshold / 60)} minutes`, 
            'Break Duration Alert', 
            false
          );
          notifiedSegments.add(activeSegment.id);
        }
      }
    
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [segments, notificationThreshold]);

  const calculateTotalDuration = (segments: Session['segments']) => {
    return segments.reduce((total, segment) => {
      return total + calculateSegmentDuration(segment, currentTime);
    }, 0);
  };

  const totalWorkDuration = calculateTotalDuration(workSegments);
  const totalBreakDuration = calculateTotalDuration(breakSegments);

  const renderSegment = (segment: Session['segments'][0]) => (
    <SegmentChip 
      key={segment.id} 
      type={segment.type as 'WORK' | 'BREAK'}
      isActive={!segment.endTime}
    >
      <Type type={segment.type as 'WORK' | 'BREAK'}>
        {segment.type === 'WORK' ? '💻' : '☕️'}
      </Type>
      {segment.project && (
        <>
          <Separator>·</Separator>
          <Project>{segment.project.name}</Project>
        </>
      )}
      {segment.break && (
        <>
          <Separator>·</Separator>
          <Project>{segment.break.type}</Project>
        </>
      )}
      <Separator>·</Separator>
      <Duration>
        {formatDuration(calculateSegmentDuration(segment, currentTime))}
      </Duration>
    </SegmentChip>
  );

  return (
    <Container>
      {workSegments.length > 0 && (
        <GroupContainer>
          <GroupHeader>
            <GroupTitle>Work Segments</GroupTitle>
            <TotalDuration type="WORK">
              Total: {formatDuration(totalWorkDuration)}
            </TotalDuration>
          </GroupHeader>
          <SegmentsRow>
            {workSegments.map(renderSegment)}
          </SegmentsRow>
        </GroupContainer>
      )}
      
      {breakSegments.length > 0 && (
        <GroupContainer>
          <GroupHeader>
            <GroupTitle>Break Segments</GroupTitle>
            <TotalDuration type="BREAK">
              Total: {formatDuration(totalBreakDuration)}
            </TotalDuration>
          </GroupHeader>
          <SegmentsRow>
            {breakSegments.map(renderSegment)}
          </SegmentsRow>
        </GroupContainer>
      )}
    </Container>
  );
}; 