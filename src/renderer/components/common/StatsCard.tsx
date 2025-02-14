import React from 'react';
import styled from 'styled-components';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: string;
  progress?: number;
  children?: React.ReactNode;
}

const Card = styled.div<{ bgColor?: string }>`
  background: ${props => props.bgColor || props.theme.colors.background}15;
  border-radius: 16px;
  padding: ${props => props.theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  position: relative;
  overflow: hidden;
  border: 1px solid ${props => props.bgColor || props.theme.colors.background}30;
`;

const Title = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}80;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const Value = styled.div`
  font-size: 1.75rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const Subtitle = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text}60;
`;

const ProgressBar = styled.div<{ progress: number; color?: string }>`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: ${props => props.progress}%;
  background: ${props => props.color || props.theme.colors.primary};
  transition: width 0.3s ease;
`;

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  color,
  icon,
  progress,
  children
}) => {
  return (
    <Card bgColor={color}>
      <Title>
        {icon && <span role="img" aria-label={title}>{icon}</span>}
        {title}
      </Title>
      <Value>{value}</Value>
      {subtitle && <Subtitle>{subtitle}</Subtitle>}
      {children}
      {progress !== undefined && (
        <ProgressBar progress={progress} color={color} />
      )}
    </Card>
  );
}; 