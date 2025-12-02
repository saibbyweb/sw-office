import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { IoWifi, IoVideocam } from 'react-icons/io5';
import { Info } from 'react-feather';
import { AvailabilityScoreInfoModal } from './modals/AvailabilityScoreInfoModal';

const MemberList = styled.div`
  padding: 0 16px 16px 16px;
`;

const MemberItem = styled.div<{
  isActive: boolean;
  isOnBreak: boolean;
}>`
  display: flex;
  align-items: center;
  padding: 10px 15px;
  border-radius: 8px;
  margin-bottom: 8px;
  background-color: ${(props) =>
    props.isActive
      ? props.isOnBreak
        ? 'rgba(255, 193, 7, 0.15)'
        : 'rgba(40, 167, 69, 0.15)'
      : 'rgba(255, 255, 255, 0.08)'};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  color: white;

  &:hover {
    background-color: ${(props) =>
      props.isActive
        ? props.isOnBreak
          ? 'rgba(255, 193, 7, 0.25)'
          : 'rgba(40, 167, 69, 0.25)'
        : 'rgba(255, 255, 255, 0.15)'};
  }

  gap: 10px;
`;

const MemberInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

const MemberName = styled.div`
  font-size: 14px;
  font-weight: 500;
`;

const ScoreContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
`;

const Score = styled.span<{ score: number }>`
  font-size: 12px;
  color: ${props => {
    if (props.score >= 90) return '#10b981';
    if (props.score >= 75) return '#f59e0b';
    return '#ef4444';
  }};
  font-weight: 600;
`;

const InfoButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text}60;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme.colors.text};
  }
`;

const MemberAvatar = styled.div<{ src?: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.src ? `url(${props.src})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 13px;
  flex-shrink: 0;
  position: relative;
`;

const StatusDot = styled.div<{ isActive: boolean; isOnBreak: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${(props) => {
    if (props.isOnBreak) return '#FFC107';
    if (props.isActive) return '#4CAF50';
    return '#9E9E9E';
  }};
  position: absolute;
  bottom: 0;
  right: -2px;
  border: 2px solid #1e2738;
  flex-shrink: 0;
`;

const ConnectedIndicator = styled.span`
  display: flex;
  align-items: center;
  margin-left: auto;
  margin-right: 8px;
  color: #7AFFB2;
`;

const CallButton = styled.button`
  background: none;
  border: none;
  color: #4dabff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(77, 171, 255, 0.2);
    color: #7bc9ff;
  }
`;

interface Break {
  id: string;
  endTime: string | null;
}

interface WorkException {
  id: string;
  type: string;
  date: string;
}

interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  activeSession?: {
    id: string;
    breaks?: Break[];
  } | null;
  availabilityScore?: number;
  workingDaysInCycle?: number;
  workExceptions?: WorkException[];
}

interface TeamMembersListProps {
  users: User[];
  connectedUsers: string[];
  currentUserId?: string;
  onMemberClick?: (userId: string) => void;
  onCallUser?: (userId: string, e: React.MouseEvent) => void;
}

export const TeamMembersList: React.FC<TeamMembersListProps> = ({
  users,
  connectedUsers,
  currentUserId,
  onMemberClick,
  onCallUser,
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <>
      <MemberList>
        {users.map((user: User) => {
          const isOnBreak = user.activeSession?.breaks?.some((breakItem: Break) => !breakItem.endTime);
          const isConnected = connectedUsers.includes(user.id);

          return (
            <MemberItem
              key={user.id}
              isActive={!!user.activeSession}
              isOnBreak={!!isOnBreak}
              onClick={() => onMemberClick?.(user.id)}
            >
              <MemberAvatar src={user.avatarUrl}>
                {!user.avatarUrl && user.name.charAt(0).toUpperCase()}
                <StatusDot
                  isActive={!!user.activeSession}
                  isOnBreak={!!isOnBreak}
                />
              </MemberAvatar>
              <MemberInfo>
                <MemberName>{user.name}</MemberName>
                {user.availabilityScore !== undefined && (
                  <ScoreContainer>
                    <Score score={user.availabilityScore}>
                      {user.availabilityScore.toFixed(1)}%
                    </Score>
                    <InfoButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(user);
                        setShowInfoModal(true);
                      }}
                      title="View availability score details"
                    >
                      <Info size={12} />
                    </InfoButton>
                  </ScoreContainer>
                )}
              </MemberInfo>
              {isConnected && (
                <ConnectedIndicator title="User is online">
                  <IoWifi size={16} color="#7AFFB2" />
                </ConnectedIndicator>
              )}
              {user.id !== currentUserId && isConnected && onCallUser && (
                <CallButton
                  onClick={(e) => onCallUser(user.id, e)}
                  title="Start video call"
                >
                  <IoVideocam size={18} />
                </CallButton>
              )}
            </MemberItem>
          );
        })}
      </MemberList>

      {selectedUser && showInfoModal && ReactDOM.createPortal(
        <AvailabilityScoreInfoModal
          isOpen={showInfoModal}
          onClose={() => {
            setShowInfoModal(false);
            setSelectedUser(null);
          }}
          currentScore={selectedUser.availabilityScore || 0}
          workingDays={selectedUser.workingDaysInCycle || 0}
          exceptions={selectedUser.workExceptions || []}
        />,
        document.body
      )}
    </>
  );
};
