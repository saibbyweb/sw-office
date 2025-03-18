import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'react-feather';

const CalendarContainer = styled.div`
  background: ${props => props.theme.colors.background}30;
  border: 1px solid ${props => props.theme.colors.text}10;
  border-radius: 16px;
  padding: ${props => props.theme.spacing.md};
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 24px ${props => props.theme.colors.text}10;
  width: 100%;
  max-width: 400px;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const MonthTitle = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  color: ${props => props.theme.colors.text};
  font-weight: 600;
`;

const NavigationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: ${props => props.theme.colors.primary}20;
  color: ${props => props.theme.colors.primary};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.primary}30;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

const WeekDay = styled.div`
  text-align: center;
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text}60;
  padding: ${props => props.theme.spacing.xs};
  font-weight: 500;
`;

const DayCell = styled.div<{ isCurrentMonth: boolean; isActive?: boolean; isToday?: boolean }>`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  border-radius: 50%;
  cursor: pointer;
  background: ${props => props.isActive ? props.theme.colors.primary : 'transparent'};
  color: ${props => {
    if (props.isActive) return 'white';
    if (!props.isCurrentMonth) return props.theme.colors.text + '30';
    return props.theme.colors.text;
  }};
  border: ${props => props.isToday ? `2px solid ${props.theme.colors.primary}` : 'none'};
  opacity: ${props => props.isCurrentMonth ? 1 : 0.5};
  transition: all 0.2s ease;
  padding: 4px;

  &:hover {
    background: ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.primary + '20'};
    transform: translateY(-1px);
  }
`;

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarProps {
  activeDates: Date[];
  currentDate: Date;
  onMonthChange: (startDate: Date, endDate: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = React.memo(({ activeDates, currentDate, onMonthChange }) => {
  const handlePreviousMonth = useCallback(() => {
    const newDate = subMonths(currentDate, 1);
    console.log('Calendar: Previous Month clicked:', format(newDate, 'MMMM yyyy'));
    onMonthChange(startOfMonth(newDate), endOfMonth(newDate));
  }, [currentDate, onMonthChange]);

  const handleNextMonth = useCallback(() => {
    const newDate = addMonths(currentDate, 1);
    console.log('Calendar: Next Month clicked:', format(newDate, 'MMMM yyyy'));
    onMonthChange(startOfMonth(newDate), endOfMonth(newDate));
  }, [currentDate, onMonthChange]);

  // Get all dates to display (including dates from previous/next month to fill the calendar)
  const { calendarDays, monthTitle } = useMemo(() => {
    console.log('Calendar: Recalculating calendar days for:', format(currentDate, 'MMMM yyyy'));
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return {
      calendarDays: eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
      }),
      monthTitle: format(currentDate, 'MMMM yyyy')
    };
  }, [currentDate]);

  return (
    <CalendarContainer>
      <CalendarHeader>
        <MonthTitle>
          {monthTitle}
        </MonthTitle>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <NavigationButton onClick={handlePreviousMonth}>
            <ChevronLeft size={18} />
          </NavigationButton>
          <NavigationButton onClick={handleNextMonth}>
            <ChevronRight size={18} />
          </NavigationButton>
        </div>
      </CalendarHeader>
      <CalendarGrid>
        {weekDays.map(day => (
          <WeekDay key={day}>{day}</WeekDay>
        ))}
        {calendarDays.map((day) => (
          <DayCell
            key={`${format(day, 'yyyy-MM-dd')}`}
            isCurrentMonth={isSameMonth(day, currentDate)}
            isActive={activeDates.some(activeDate => isSameDay(activeDate, day))}
            isToday={isSameDay(day, new Date())}
          >
            {format(day, 'd')}
          </DayCell>
        ))}
      </CalendarGrid>
    </CalendarContainer>
  );
}); 