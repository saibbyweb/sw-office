import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { format, addMonths, subMonths, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addDays, setDate } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'react-feather';

const CalendarContainer = styled.div`
  background: ${props => props.theme.colors.background}30;
  border: 1px solid ${props => props.theme.colors.text}10;
  border-radius: 16px;
  padding: ${props => props.theme.spacing.md};
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 24px ${props => props.theme.colors.text}10;
  width: 100%;
  max-width: 500px;
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

const DayCell = styled.div<{
  isInCycle: boolean;
  isActive?: boolean;
  isToday?: boolean;
  isSelected?: boolean;
  hasMultipleSessions?: boolean;
}>`
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  border-radius: 50%;
  cursor: pointer;
  background: ${props => {
    if (props.isSelected) return props.theme.colors.primary;
    if (props.isActive) return props.theme.colors.primary + '40';
    return 'transparent';
  }};
  color: ${props => {
    if (props.isSelected) return 'white';
    if (props.isActive) return props.theme.colors.primary;
    if (!props.isInCycle) return props.theme.colors.text + '30';
    return props.theme.colors.text;
  }};
  border: ${props => props.isToday ? `2px solid ${props.theme.colors.primary}` : 'none'};
  opacity: ${props => props.isInCycle ? 1 : 0.5};
  transition: all 0.2s ease;
  padding: 4px;
  position: relative;

  &:hover {
    background: ${props => props.isSelected ? props.theme.colors.primary : props.theme.colors.primary + '20'};
    transform: translateY(-1px);
  }

  ${props => props.hasMultipleSessions && `
    &::after {
      content: '';
      position: absolute;
      bottom: 2px;
      width: 4px;
      height: 4px;
      background: ${props.isSelected ? 'white' : props.theme.colors.primary};
      border-radius: 50%;
      opacity: 0.8;
    }
  `}
`;

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface BillingCycleCalendarProps {
  activeDates: Date[];
  currentDate: Date;
  onCycleChange: (startDate: Date, endDate: Date) => void;
  onDateClick?: (date: Date) => void;
  selectedDate?: Date | null;
  billingDayOfMonth?: number; // Default is 19
}

// Helper function to get billing cycle start and end dates
const getBillingCycle = (referenceDate: Date, billingDay: number = 19) => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  let cycleStart: Date;
  let cycleEnd: Date;

  if (day >= billingDay) {
    // We're in the current month's cycle (e.g., Nov 19 - Dec 18)
    cycleStart = new Date(year, month, billingDay);
    cycleEnd = new Date(year, month + 1, billingDay - 1);
  } else {
    // We're in the previous month's cycle (e.g., Oct 19 - Nov 18)
    cycleStart = new Date(year, month - 1, billingDay);
    cycleEnd = new Date(year, month, billingDay - 1);
  }

  return { cycleStart, cycleEnd };
};

const isDateInCycle = (date: Date, cycleStart: Date, cycleEnd: Date) => {
  const dateTime = date.getTime();
  return dateTime >= cycleStart.getTime() && dateTime <= cycleEnd.getTime();
};

export const BillingCycleCalendar: React.FC<BillingCycleCalendarProps> = React.memo(({
  activeDates,
  currentDate,
  onCycleChange,
  onDateClick,
  selectedDate,
  billingDayOfMonth = 19
}) => {
  const { cycleStart, cycleEnd } = useMemo(() =>
    getBillingCycle(currentDate, billingDayOfMonth),
    [currentDate, billingDayOfMonth]
  );

  const handlePreviousCycle = useCallback(() => {
    // Go back one billing cycle (one month)
    const newDate = subMonths(currentDate, 1);
    const { cycleStart, cycleEnd } = getBillingCycle(newDate, billingDayOfMonth);
    onCycleChange(cycleStart, cycleEnd);
  }, [currentDate, onCycleChange, billingDayOfMonth]);

  const handleNextCycle = useCallback(() => {
    // Go forward one billing cycle (one month)
    const newDate = addMonths(currentDate, 1);
    const { cycleStart, cycleEnd } = getBillingCycle(newDate, billingDayOfMonth);
    onCycleChange(cycleStart, cycleEnd);
  }, [currentDate, onCycleChange, billingDayOfMonth]);

  const handleDateClick = useCallback((day: Date) => {
    onDateClick?.(day);
  }, [onDateClick]);

  // Get all dates to display (including dates from weeks that span the cycle)
  const { calendarDays, cycleTitle } = useMemo(() => {
    const calendarStart = startOfWeek(cycleStart);
    const calendarEnd = endOfWeek(cycleEnd);

    return {
      calendarDays: eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
      }),
      cycleTitle: `${format(cycleStart, 'MMM d')} - ${format(cycleEnd, 'MMM d, yyyy')}`
    };
  }, [cycleStart, cycleEnd]);

  // Function to check if a date has multiple sessions
  const getSessionsForDate = useCallback((date: Date) => {
    return activeDates.filter(activeDate =>
      format(activeDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    ).length;
  }, [activeDates]);

  return (
    <CalendarContainer>
      <CalendarHeader>
        <MonthTitle>
          {cycleTitle}
        </MonthTitle>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <NavigationButton onClick={handlePreviousCycle}>
            <ChevronLeft size={18} />
          </NavigationButton>
          <NavigationButton onClick={handleNextCycle}>
            <ChevronRight size={18} />
          </NavigationButton>
        </div>
      </CalendarHeader>
      <CalendarGrid>
        {weekDays.map(day => (
          <WeekDay key={day}>{day}</WeekDay>
        ))}
        {calendarDays.map((day) => {
          const sessionsCount = getSessionsForDate(day);
          const inCycle = isDateInCycle(day, cycleStart, cycleEnd);
          return (
            <DayCell
              key={`${format(day, 'yyyy-MM-dd')}`}
              isInCycle={inCycle}
              isActive={sessionsCount > 0}
              isToday={isSameDay(day, new Date())}
              isSelected={selectedDate ? isSameDay(day, selectedDate) : false}
              hasMultipleSessions={sessionsCount > 1}
              onClick={() => handleDateClick(day)}
            >
              {format(day, 'd')}
            </DayCell>
          );
        })}
      </CalendarGrid>
    </CalendarContainer>
  );
});
