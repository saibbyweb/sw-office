import React from 'react';
import styled from 'styled-components';

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
  box-shadow: 0 4px 6px -1px ${props => props.bgColor || props.theme.colors.background}10,
              0 2px 4px -1px ${props => props.bgColor || props.theme.colors.background}06;
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px ${props => props.bgColor || props.theme.colors.background}10,
                0 4px 6px -2px ${props => props.bgColor || props.theme.colors.background}05;
  }
`;

const Title = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}80;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const Value = styled.div<{ color: string }>`
  font-size: 1.75rem;
  font-weight: 600;
  color: ${props => props.color};
  margin: ${props => props.theme.spacing.xs} 0;
`;

const Subtitle = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text}60;
`;

interface StatsCardProps {
  title: string;
  value: string | number;
  color: string;
  icon?: React.ReactNode;
  subtitle?: string;
  children?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  color,
  icon,
  subtitle,
  children
}) => {
  return (
    <Card bgColor={color}>
      <Title>
        {icon}
        {title}
      </Title>
      <Value color={color}>{value}</Value>
      {subtitle && <Subtitle>{subtitle}</Subtitle>}
      {children}
    </Card>
  );
}; 