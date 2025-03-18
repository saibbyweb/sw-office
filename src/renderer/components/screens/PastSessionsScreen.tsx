import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useQuery } from '@apollo/client';
import { startOfMonth, endOfMonth, format, isSameMonth } from 'date-fns';
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
  display: flex;
  justify-content: center;
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

interface PastSessionsScreenProps {
  onBack: () => void;
}

interface SessionDate {
  startTime: string;
}

interface SessionDatesData {
  userSessionDates: SessionDate[];
}

const GET_SESSION_DATES = gql`
  query GetSessionDates($input: GetSessionDatesInput!) {
    userSessionDates(input: $input) {
      startTime
    }
  }
`;

export const PastSessionsScreen: React.FC<PastSessionsScreenProps> = ({ onBack }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date(); // Reference to today's date

  const { data: sessionDatesData, loading } = useQuery<SessionDatesData>(GET_SESSION_DATES, {
    variables: {
      input: {
        startDate: new Date(startOfMonth(currentMonth).setHours(0, 0, 0, 0)),
        endDate: new Date(endOfMonth(currentMonth).setHours(23, 59, 59, 999)),
      },
    },
    fetchPolicy: 'network-only',
  });

  const handleMonthChange = useCallback((startDate: Date, endDate: Date) => {
    setCurrentMonth(startDate);
  }, []);

  const handleGoToCurrentMonth = useCallback(() => {
    setCurrentMonth(today);
  }, [today]);

  const activeDates = sessionDatesData?.userSessionDates || [];
  const isCurrentMonth = isSameMonth(currentMonth, today);

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
        <CalendarWrapper>
          <CalendarStats>
            <StatsCount>{activeDates.length}</StatsCount> sessions in {format(currentMonth, 'MMMM yyyy')}
          </CalendarStats>
          <CalendarContainer>
            <Calendar 
              activeDates={activeDates.map(date => new Date(date.startTime))} 
              onMonthChange={handleMonthChange}
              currentDate={currentMonth}
            />
            {loading && (
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