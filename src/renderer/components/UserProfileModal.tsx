import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@apollo/client';
import { X, User as UserIcon, Clock, CheckCircle, TrendingUp, Calendar as CalendarIcon, List, Award, Info } from 'react-feather';
import { GET_USER_PROFILE, GET_USER_SESSION_DATES, ME, GET_USER_PAYOUT_DETAILS } from '../../graphql/queries';
import { BillingCycleCalendar } from './common/BillingCycleCalendar';
import { AvailabilityScoreInfoModal } from './modals/AvailabilityScoreInfoModal';
import { PayoutCard } from './PayoutCard';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContainer = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: 24px;
  width: 95%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes slideUp {
    from {
      transform: translateY(40px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  position: sticky;
  top: 0;
  background: ${props => props.theme.colors.background};
  padding: 0;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  z-index: 10;
  border-radius: 24px 24px 0 0;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
`;

const CloseButton = styled.button`
  background: ${props => props.theme.colors.cardBackground};
  border: 1px solid ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 0 24px 0 12px;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.colors.border};
    transform: scale(1.05);
  }
`;

const ModalContent = styled.div`
  padding: 24px;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  margin-bottom: 24px;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  background: none;
  border: none;
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.textLight};
  font-size: 0.95rem;
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  border-bottom: 2px solid ${props => props.active ? props.theme.colors.primary : 'transparent'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const TabContent = styled.div`
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const CalendarWrapper = styled.div`
  margin-top: 16px;
`;

const ProfileSection = styled.div`
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: -24px -24px 32px -24px;
  padding: 48px 40px 40px 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  border-radius: 24px 24px 0 0;
`;

const UserInfoSection = styled.div`
  display: flex;
  gap: 28px;
  flex: 1;
  align-items: center;
`;

const AvatarSection = styled.div`
  flex-shrink: 0;
  position: relative;
`;

const Avatar = styled.div`
  width: 140px;
  height: 140px;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15));
  border: 4px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  font-weight: 700;
  color: white;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const OnlineIndicator = styled.div<{ isOnline: boolean }>`
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${props => props.isOnline ? '#10b981' : '#6b7280'};
  border: 4px solid #667eea;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  animation: ${props => props.isOnline ? 'pulse 2s infinite' : 'none'};

  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
    }
  }
`;

const UserDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: white;
`;

const UserName = styled.h3`
  margin: 0;
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  line-height: 1.1;
`;

const UserEmail = styled.p`
  margin: 0;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 400;
  letter-spacing: 0.2px;
`;

const UserMeta = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
`;

const MetaBadge = styled.div<{ variant?: 'online' | 'offline' | 'role' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
`;

const StatusDot = styled.div<{ isOnline: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.isOnline ? '#10b981' : '#ef4444'};
  box-shadow: 0 0 8px ${props => props.isOnline ? '#10b981' : '#ef4444'};
`;

const StatsGrid = styled.div<{ inHeader?: boolean }>`
  display: grid;
  grid-template-columns: ${props => props.inHeader ? 'repeat(6, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))'};
  gap: ${props => props.inHeader ? '12px' : '16px'};
  margin-bottom: ${props => props.inHeader ? '0' : '32px'};
`;

const StatCard = styled.div<{ inHeader?: boolean }>`
  background: ${props => props.inHeader ? 'rgba(255, 255, 255, 0.15)' : props.theme.colors.cardBackground};
  border: ${props => props.inHeader ? '1px solid rgba(255, 255, 255, 0.2)' : `1px solid ${props.theme.colors.border}`};
  border-radius: ${props => props.inHeader ? '16px' : '12px'};
  padding: ${props => props.inHeader ? '12px' : '16px'};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.inHeader ? '8px' : '12px'};
  backdrop-filter: ${props => props.inHeader ? 'blur(10px)' : 'none'};
  transition: all 0.2s;

  &:hover {
    background: ${props => props.inHeader ? 'rgba(255, 255, 255, 0.25)' : props.theme.colors.cardBackground};
    transform: translateY(-2px);
  }
`;

const StatIcon = styled.div<{ color: string; inHeader?: boolean }>`
  width: ${props => props.inHeader ? '32px' : '40px'};
  height: ${props => props.inHeader ? '32px' : '40px'};
  border-radius: ${props => props.inHeader ? '12px' : '10px'};
  background: ${props => props.inHeader ? 'rgba(255, 255, 255, 0.2)' : `${props.color}20`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.inHeader ? 'white' : props.color};
`;

const StatInfo = styled.div<{ inHeader?: boolean }>`
  flex: 1;
  text-align: ${props => props.inHeader ? 'center' : 'left'};
  width: 100%;
`;

const StatLabel = styled.div<{ inHeader?: boolean }>`
  font-size: ${props => props.inHeader ? '0.7rem' : '0.8rem'};
  color: ${props => props.inHeader ? 'rgba(255, 255, 255, 0.85)' : `${props.theme.colors.text}80`};
  margin-bottom: ${props => props.inHeader ? '2px' : '4px'};
  font-weight: ${props => props.inHeader ? '500' : '400'};
`;

const StatValue = styled.div<{ inHeader?: boolean }>`
  font-size: ${props => props.inHeader ? '1.8rem' : '1.5rem'};
  font-weight: ${props => props.inHeader ? '800' : '700'};
  color: ${props => props.inHeader ? 'white' : props.theme.colors.text};
  text-shadow: ${props => props.inHeader ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none'};
`;

const InfoButton = styled.button<{ inHeader?: boolean }>`
  background: ${props => props.inHeader ? 'rgba(255, 255, 255, 0.15)' : 'none'};
  border: none;
  color: ${props => props.inHeader ? 'rgba(255, 255, 255, 0.7)' : `${props.theme.colors.text}60`};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${props => props.inHeader ? '8px' : '4px'};
  transition: all 0.2s ease;
  margin-left: ${props => props.inHeader ? '0' : 'auto'};
  position: ${props => props.inHeader ? 'absolute' : 'static'};
  top: ${props => props.inHeader ? '8px' : 'auto'};
  right: ${props => props.inHeader ? '8px' : 'auto'};

  &:hover {
    background: ${props => props.inHeader ? 'rgba(255, 255, 255, 0.3)' : `${props.theme.colors.text}10`};
    color: ${props => props.inHeader ? 'white' : props.theme.colors.primary};
  }
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h4`
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
`;

const TaskItem = styled.div`
  background: ${props => props.theme.colors.cardBackground};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateX(4px);
  }
`;

const TaskInfo = styled.div`
  flex: 1;
`;

const TaskTitle = styled.div`
  font-size: 0.95rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  margin-bottom: 4px;
`;

const TaskMeta = styled.div`
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text}70;
  align-items: center;
`;

const TaskStatus = styled.span<{ status: string }>`
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
    switch (props.status) {
      case 'COMPLETED': return '#10b98120';
      case 'IN_PROGRESS': return '#f59e0b20';
      case 'APPROVED': return '#3b82f620';
      case 'SUGGESTED': return '#8b5cf620';
      case 'BLOCKED': return '#ef444420';
      default: return props.theme.colors.border;
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'COMPLETED': return '#10b981';
      case 'IN_PROGRESS': return '#f59e0b';
      case 'APPROVED': return '#3b82f6';
      case 'SUGGESTED': return '#8b5cf6';
      case 'BLOCKED': return '#ef4444';
      default: return props.theme.colors.text;
    }
  }};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: ${props => props.theme.colors.text}80;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: ${props => props.theme.colors.error};
  gap: 12px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: ${props => props.theme.colors.text}60;
  font-size: 0.9rem;
`;

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

// Helper function to get billing cycle start and end dates
const getBillingCycle = (referenceDate: Date, billingDay: number = 19) => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const day = referenceDate.getDate();

  let cycleStart: Date;
  let cycleEnd: Date;

  if (day >= billingDay) {
    cycleStart = new Date(year, month, billingDay);
    cycleEnd = new Date(year, month + 1, billingDay - 1);
  } else {
    cycleStart = new Date(year, month - 1, billingDay);
    cycleEnd = new Date(year, month, billingDay - 1);
  }

  return { cycleStart, cycleEnd };
};

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, onClose }) => {
  const [currentTime, setCurrentTime] = React.useState(Date.now());
  const [activeTab, setActiveTab] = React.useState<'overview' | 'history'>('overview');
  const [currentCycleDate, setCurrentCycleDate] = React.useState(new Date());
  const [showAvailabilityInfo, setShowAvailabilityInfo] = React.useState(false);

  const { cycleStart, cycleEnd } = React.useMemo(() =>
    getBillingCycle(currentCycleDate, 19),
    [currentCycleDate]
  );

  // Get current logged-in user
  const { data: meData } = useQuery(ME);
  const loggedInUserId = meData?.me?.id;
  const isOwnProfile = loggedInUserId === userId;

  const { data, loading, error } = useQuery(GET_USER_PROFILE, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'no-cache',
  });

  const { data: sessionDatesData, loading: datesLoading } = useQuery(GET_USER_SESSION_DATES, {
    variables: {
      userId,
      input: {
        startDate: new Date(cycleStart.setHours(0, 0, 0, 0)),
        endDate: new Date(cycleEnd.setHours(23, 59, 59, 999)),
      },
    },
    skip: !userId || activeTab !== 'history',
    fetchPolicy: 'network-only',
  });

  // Helper to calculate billing cycles (19th to 18th) - same as admin panel
  const getBillingCycles = React.useMemo(() => {
    const cycles: { label: string; startDate: string; endDate: string }[] = [];
    const today = new Date();
    const dayOfMonth = today.getDate();

    // Payout system started from November 2025
    const PAYOUT_START_MONTH = 10; // November (0-indexed)
    const PAYOUT_START_YEAR = 2025;

    // Determine current cycle month
    let currentCycleMonth = today.getMonth();
    let currentCycleYear = today.getFullYear();

    // If we're before the 19th, the current cycle started last month
    if (dayOfMonth < 19) {
      currentCycleMonth -= 1;
      if (currentCycleMonth < 0) {
        currentCycleMonth = 11;
        currentCycleYear -= 1;
      }
    }

    // Generate billing cycles from current cycle back to November 2025
    for (let i = 0; i < 24; i++) {
      let cycleMonth = currentCycleMonth - i;
      let cycleYear = currentCycleYear;

      while (cycleMonth < 0) {
        cycleMonth += 12;
        cycleYear -= 1;
      }

      // Stop if we've gone before November 2025
      if (
        cycleYear < PAYOUT_START_YEAR ||
        (cycleYear === PAYOUT_START_YEAR && cycleMonth < PAYOUT_START_MONTH)
      ) {
        break;
      }

      // Start date: 19th at 00:00:00
      const startDate = new Date(cycleYear, cycleMonth, 19, 0, 0, 0, 0);
      // End date: 18th at 23:59:59.999 (to include the full day)
      const endDate = new Date(cycleYear, cycleMonth + 1, 18, 23, 59, 59, 999);

      const label = `${startDate.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })} (${startDate.getDate()}th - ${endDate.getDate()}th)`;

      cycles.push({
        label,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    }

    return cycles;
  }, []);

  // State for payout card blur - persisted across billing cycle changes
  const [payoutCardBlurred, setPayoutCardBlurred] = React.useState(true);
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);

  // State for selected billing cycle index - persisted across data refreshes
  const [selectedCycleIndex, setSelectedCycleIndex] = React.useState(0);

  // Get the current cycle based on selected index - same pattern as admin panel
  const currentCycle = getBillingCycles[selectedCycleIndex];

  // Get payout details for logged-in user only
  const { data: payoutData, loading: payoutLoading, error: payoutError } = useQuery(GET_USER_PAYOUT_DETAILS, {
    variables: {
      startDate: currentCycle?.startDate,
      endDate: currentCycle?.endDate,
    },
    skip: !isOwnProfile,
    fetchPolicy: 'no-cache',
  });

  // Keep the last valid payout data to prevent unmounting during refetches
  const lastValidPayoutData = React.useRef<any>(null);
  if (payoutData) {
    lastValidPayoutData.current = payoutData;
  }

  // Debug logging
  console.log('PayoutCard Debug:', {
    isOwnProfile,
    selectedCycleIndex,
    currentCycle,
    hasPayoutData: !!payoutData,
    payoutLoading,
    payoutError: payoutError?.message,
    getTeamUsers: payoutData?.getTeamUsers,
  });

  // Handler for when PayoutCard cycle changes
  const handlePayoutCycleChange = (startDate: string, endDate: string) => {
    // Not needed anymore - we just track the index
    console.log('Cycle changed to:', startDate, endDate);
  };

  // Handler for payout card blur toggle
  const handlePayoutBlurToggle = async () => {
    if (!payoutCardBlurred) {
      // If already unblurred, just blur it again
      setPayoutCardBlurred(true);
      return;
    }

    // Check if ipcRenderer is available
    let ipcRenderer: any = null;
    try {
      ipcRenderer = window.require('electron').ipcRenderer;
    } catch (error) {
      console.error('ipcRenderer not available:', error);
      // Silent fail - system authentication not available
      return;
    }

    // Request system authentication
    setIsAuthenticating(true);

    try {
      const result = await ipcRenderer.invoke('authenticate-system');

      if (result.success) {
        setPayoutCardBlurred(false);
      } else {
        // User cancelled or authentication failed - just log it, don't show error
        console.log('Authentication cancelled or failed');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      // Silent fail - user cancelled authentication
    } finally {
      setIsAuthenticating(false);
    }
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Debug logging
  React.useEffect(() => {
    console.log('UserProfileModal Debug:', {
      isOwnProfile,
      loggedInUserId,
      userId,
      hasPayoutData: !!payoutData,
      payoutData
    });
  }, [isOwnProfile, loggedInUserId, userId, payoutData]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const calculateTotalDuration = (segments: any[], type: 'WORK' | 'BREAK'): number => {
    if (!segments) return 0;
    return segments
      .filter(segment => segment.type === type)
      .reduce((total: number, segment: any) => {
        if (segment.endTime) {
          return total + segment.duration;
        }
        const startTime = new Date(segment.startTime).getTime();
        return total + Math.floor((currentTime - startTime) / 1000);
      }, 0);
  };

  if (loading) {
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContainer onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>User Profile</ModalTitle>
            <CloseButton onClick={onClose}>
              <X size={24} />
            </CloseButton>
          </ModalHeader>
          <ModalContent>
            <LoadingContainer>Loading profile...</LoadingContainer>
          </ModalContent>
        </ModalContainer>
      </ModalOverlay>
    );
  }

  if (error || !data?.getUserProfile) {
    console.error('User profile error:', error);
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContainer onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>User Profile</ModalTitle>
            <CloseButton onClick={onClose}>
              <X size={24} />
            </CloseButton>
          </ModalHeader>
          <ModalContent>
            <ErrorContainer>
              <UserIcon size={48} />
              <div>Failed to load user profile</div>
              {error && <div style={{ fontSize: '0.85rem', marginTop: '8px' }}>{error.message}</div>}
            </ErrorContainer>
          </ModalContent>
        </ModalContainer>
      </ModalOverlay>
    );
  }

  const user = data.getUserProfile;

  const activeDates = sessionDatesData?.getUserSessionDates?.map((session: any) => new Date(session.startTime)) || [];

  const handleCycleChange = (startDate: Date, endDate: Date) => {
    setCurrentCycleDate(startDate);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </ModalHeader>
        <ModalContent>
          <ProfileSection>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
              <UserInfoSection>
                <AvatarSection>
                  {user.avatarUrl ? (
                    <Avatar as="img" src={user.avatarUrl} alt={user.name} />
                  ) : (
                    <Avatar>{getInitials(user.name)}</Avatar>
                  )}
                  <OnlineIndicator isOnline={user.isOnline} />
                </AvatarSection>
                <UserDetails>
                  <UserName>{user.name}</UserName>
                  <UserEmail>{user.email}</UserEmail>
                  <UserMeta>
                    <MetaBadge>
                      <StatusDot isOnline={user.isOnline} />
                      {user.isOnline ? 'Online' : 'Offline'}
                    </MetaBadge>
                    <MetaBadge variant="role">
                      <UserIcon size={16} />
                      {user.role}
                    </MetaBadge>
                  </UserMeta>
                </UserDetails>
              </UserInfoSection>
              {isOwnProfile && (() => {
                // Use current data or fall back to last valid data
                const displayData = payoutData || lastValidPayoutData.current;

                // Show a placeholder only on very first load (no data at all)
                if (!displayData && payoutLoading) {
                  return (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '20px',
                      color: '#666'
                    }}>
                      Loading payout details...
                    </div>
                  );
                }

                if (!displayData) {
                  return null;
                }

                console.log('=== PayoutCard Rendering ===');
                console.log('displayData:', displayData);
                console.log('displayData.getTeamUsers:', displayData.getTeamUsers);
                console.log('userId:', userId);

                // Find current user in team users array
                const currentUserData = displayData.getTeamUsers?.find((u: any) => u.id === userId);

                console.log('currentUserData found:', currentUserData);

                if (!currentUserData) {
                  console.log('No current user data - returning null');
                  return null;
                }

                console.log('Rendering PayoutCard component');
                return (
                  <PayoutCard
                    compensation={displayData.me.compensationINR || 0}
                    monthlyOutputScore={currentUserData.monthlyOutputScore}
                    availabilityScore={currentUserData.availabilityScore}
                    stabilityScore={currentUserData.stabilityScore}
                    onCycleChange={handlePayoutCycleChange}
                    isBlurred={payoutCardBlurred}
                    onBlurToggle={handlePayoutBlurToggle}
                    selectedCycleIndex={selectedCycleIndex}
                    onCycleIndexChange={setSelectedCycleIndex}
                    loading={payoutLoading}
                  />
                );
              })()}
            </div>

            {user.statistics && (
              <StatsGrid inHeader>
                <StatCard inHeader>
                  <StatIcon color="#3b82f6" inHeader>
                    <List size={16} />
                  </StatIcon>
                  <StatInfo inHeader>
                    <StatValue inHeader>{user.statistics.allottedTasks}</StatValue>
                    <StatLabel inHeader>Allotted</StatLabel>
                  </StatInfo>
                </StatCard>
                <StatCard inHeader>
                  <StatIcon color="#10b981" inHeader>
                    <CheckCircle size={16} />
                  </StatIcon>
                  <StatInfo inHeader>
                    <StatValue inHeader>{user.statistics.completedTasks}</StatValue>
                    <StatLabel inHeader>Completed</StatLabel>
                  </StatInfo>
                </StatCard>
                <StatCard inHeader>
                  <StatIcon color="#f59e0b" inHeader>
                    <TrendingUp size={16} />
                  </StatIcon>
                  <StatInfo inHeader>
                    <StatValue inHeader>{user.statistics.inProgressTasks}</StatValue>
                    <StatLabel inHeader>In Progress</StatLabel>
                  </StatInfo>
                </StatCard>
                <StatCard inHeader style={{ position: 'relative' }}>
                  <StatIcon color="#10b981" inHeader>
                    <Award size={16} />
                  </StatIcon>
                  <StatInfo inHeader>
                    <StatValue inHeader>{user.statistics.availabilityScore.toFixed(1)}</StatValue>
                    <StatLabel inHeader>Availability</StatLabel>
                  </StatInfo>
                  <InfoButton
                    inHeader
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAvailabilityInfo(true);
                    }}
                    title="View calculation details"
                  >
                    <Info size={14} />
                  </InfoButton>
                </StatCard>
                <StatCard inHeader>
                  <StatIcon color="#8b5cf6" inHeader>
                    <Award size={16} />
                  </StatIcon>
                  <StatInfo inHeader>
                    <StatValue inHeader>{user.statistics.stabilityScore.toFixed(1)}</StatValue>
                    <StatLabel inHeader>Stability</StatLabel>
                  </StatInfo>
                </StatCard>
                <StatCard inHeader>
                  <StatIcon color="#10b981" inHeader>
                    <Award size={16} />
                  </StatIcon>
                  <StatInfo inHeader>
                    <StatValue inHeader>{user.statistics.monthlyOutputScore.toFixed(1)}</StatValue>
                    <StatLabel inHeader>Output</StatLabel>
                  </StatInfo>
                </StatCard>
              </StatsGrid>
            )}
          </ProfileSection>

          <TabsContainer>
            <Tab active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
              <List size={16} />
              Overview
            </Tab>
            <Tab active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
              <CalendarIcon size={16} />
              History
            </Tab>
          </TabsContainer>

          {activeTab === 'overview' && (
            <TabContent>
          <Section>
            <SectionTitle>
              <CheckCircle size={18} />
              Recent Tasks
            </SectionTitle>
            <TaskList>
              {user.taskAssignments && user.taskAssignments.length > 0 ? (
                user.taskAssignments.slice(0, 10).map((task: any) => (
                  <TaskItem key={task.id}>
                    <TaskInfo>
                      <TaskTitle>{task.title}</TaskTitle>
                      <TaskMeta>
                        <TaskStatus status={task.status}>
                          {task.status.replace(/_/g, ' ')}
                        </TaskStatus>
                        {task.project && (
                          <>
                            <span>•</span>
                            <span>{task.project.name}</span>
                          </>
                        )}
                        {task.completedDate && (
                          <>
                            <span>•</span>
                            <span>Completed {formatDate(task.completedDate)}</span>
                          </>
                        )}
                      </TaskMeta>
                    </TaskInfo>
                  </TaskItem>
                ))
              ) : (
                <EmptyState>No tasks assigned yet</EmptyState>
              )}
            </TaskList>
          </Section>
            </TabContent>
          )}

          {activeTab === 'history' && (
            <TabContent>
              <CalendarWrapper>
                <BillingCycleCalendar
                  activeDates={activeDates}
                  onCycleChange={handleCycleChange}
                  currentDate={currentCycleDate}
                  billingDayOfMonth={19}
                />
              </CalendarWrapper>
            </TabContent>
          )}
        </ModalContent>
      </ModalContainer>

      {showAvailabilityInfo && user.statistics && (
        <AvailabilityScoreInfoModal
          isOpen={showAvailabilityInfo}
          onClose={() => setShowAvailabilityInfo(false)}
          currentScore={user.statistics.availabilityScore}
          workingDays={user.statistics.workingDaysInCycle}
          exceptions={user.workExceptions || []}
        />
      )}
    </ModalOverlay>
  );
};
