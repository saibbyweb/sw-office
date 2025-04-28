import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useQuery, useMutation } from '@apollo/client';
import { SESSION_WORK_LOGS, DELETE_WORK_LOG } from '../../../graphql/queries';
import { SessionWorkLogsData, SessionWorkLogsVariables, WorkLog } from '../../../graphql/types';
import { AddWorkLogModal } from '../modals/AddWorkLogModal';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';
import { Button } from '../common';
import { localNotificationService } from '../../../services/LocalNotificationService';
import { gql } from '@apollo/client';

const GET_WORK_LOG_NOTIFICATION_CONFIG = gql`
  query GetWorkLogNotificationConfig {
    getWorkLogNotificationConfig {
      durationInSeconds
      title
      message
    }
  }
`;

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

const WorkLogActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-left: auto;
`;

const ActionButton = styled(Button)`
  padding: 4px 8px;
  font-size: 0.75rem;
  min-width: auto;

  &[data-variant="delete"] {
    color: ${props => props.theme.colors.text};
    border: 1px solid ${props => props.theme.colors.text}40;
    background: transparent;

    &:hover {
      background: ${props => props.theme.colors.text}10;
      border-color: ${props => props.theme.colors.text}60;
    }
  }
`;

const DeleteIcon = styled.span`
  color: ${props => props.theme.colors.error};
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
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
  const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | null>(null);
  const [deletingWorkLog, setDeletingWorkLog] = useState<WorkLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(Date.now());
  const [sessionStartTime] = useState<number>(Date.now());

  const { data: notificationData } = useQuery(GET_WORK_LOG_NOTIFICATION_CONFIG);
  const notificationConfig = notificationData?.getWorkLogNotificationConfig ?? {
    durationInSeconds: 1800,
    title: 'Work Log Reminder',
    message: 'You haven\'t added {hasLogs, select, true {a work log} false {any work logs}} in the last {duration} minutes'
  };

  const { data, loading, error } = useQuery<SessionWorkLogsData, SessionWorkLogsVariables>(
    SESSION_WORK_LOGS,
    {
      variables: { sessionId },
      skip: !sessionId
    }
  );

  useEffect(() => {
    if (!sessionId) return;

    const checkWorkLogInactivity = () => {
      const now = Date.now();
      const lastWorkLog = data?.sessionWorkLogs?.[0]; // Assuming sorted by latest first
      
      // If there's a work log, use its timestamp, otherwise use session start time
      const timeSinceLastActivity = lastWorkLog 
        ? now - new Date(lastWorkLog.createdAt).getTime() 
        : now - sessionStartTime;

      // Only show notification if:
      // 1. Time since last work log exceeds threshold
      // 2. Time since last notification exceeds threshold (to avoid spam)
      if (
        timeSinceLastActivity >= notificationConfig.durationInSeconds * 1000 && 
        now - lastNotificationTime >= notificationConfig.durationInSeconds * 1000
      ) {
        const minutes = Math.floor(timeSinceLastActivity / 1000 / 60);
        const message = notificationConfig.message
          .replace('{duration}', String(minutes))
          .replace('{hasLogs, select, true {a work log} false {any work logs}}', 
            lastWorkLog ? 'a work log' : 'any work logs');
          
        localNotificationService.showInfo({
          message,
          title: notificationConfig.title,
          silent: false,
          bounceDock: true
        });
        setLastNotificationTime(now);
      }
    };

    // Run check immediately
    checkWorkLogInactivity();

    // Then set up interval 
    const interval = setInterval(checkWorkLogInactivity, 2 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [sessionId, data?.sessionWorkLogs, notificationConfig, lastNotificationTime, sessionStartTime]);

  const [deleteWorkLogMutation] = useMutation(DELETE_WORK_LOG, {
    onCompleted: () => {
      setIsDeleting(false);
      setDeletingWorkLog(null);
    },
    onError: (error) => {
      console.error('Delete work log error:', error);
      setIsDeleting(false);
    },
    update: (cache, { data: mutationData }) => {
      if (!mutationData?.deleteWorkLog || !sessionId) return;

      const existingData = cache.readQuery<SessionWorkLogsData, SessionWorkLogsVariables>({
        query: SESSION_WORK_LOGS,
        variables: { sessionId }
      });

      if (!existingData?.sessionWorkLogs) return;

      cache.writeQuery<SessionWorkLogsData, SessionWorkLogsVariables>({
        query: SESSION_WORK_LOGS,
        variables: { sessionId },
        data: {
          sessionWorkLogs: existingData.sessionWorkLogs.filter(
            log => log.id !== deletingWorkLog?.id
          )
        }
      });
    }
  });

  const handleEdit = (workLog: WorkLog) => {
    setEditingWorkLog(workLog);
  };

  const handleCloseEdit = () => {
    setEditingWorkLog(null);
  };

  const handleDelete = (workLog: WorkLog) => {
    setDeletingWorkLog(workLog);
  };

  const handleConfirmDelete = async () => {
    if (!deletingWorkLog) return;

    try {
      setIsDeleting(true);
      await deleteWorkLogMutation({
        variables: { id: deletingWorkLog.id }
      });
    } catch (err) {
      console.error('Delete work log error:', err);
      setIsDeleting(false);
    }
  };

  const handleCloseDelete = () => {
    setDeletingWorkLog(null);
  };

  if (loading) {
    return <EmptyState>Loading work logs...</EmptyState>;
  }

  if (error) {
    return <EmptyState>Error loading work logs: {error.message}</EmptyState>;
  }

  return (
    <>
      <Container>
        {data?.sessionWorkLogs?.length ? (
          data.sessionWorkLogs.map((log: WorkLog) => (
            <WorkLogItem key={log.id}>
              <WorkLogHeader>
                <ProjectName>{log.project.name}</ProjectName>
                <WorkLogActions>
                  <ActionButton
                    variant="secondary"
                    size="small"
                    onClick={() => handleEdit(log)}
                  >
                    Edit
                  </ActionButton>
                  <ActionButton
                    data-variant="delete"
                    size="small"
                    onClick={() => handleDelete(log)}
                  >
                    🗑️
                  </ActionButton>
                  <Timestamp>{formatDate(log.createdAt)}</Timestamp>
                </WorkLogActions>
              </WorkLogHeader>
              <Content>{log.content}</Content>
              {log.links.length > 0 && (
                <LinksList>
                  {log.links.filter(link => link.trim()).map((link, index) => {
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
          ))
        ) : (
          <EmptyState>No work logs added yet</EmptyState>
        )}
      </Container>

      <AddWorkLogModal
        isOpen={!!editingWorkLog}
        onClose={handleCloseEdit}
        editWorkLog={editingWorkLog}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingWorkLog}
        onClose={handleCloseDelete}
        workLog={deletingWorkLog}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </>
  );
}; 