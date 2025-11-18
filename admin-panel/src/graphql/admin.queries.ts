import { gql } from '@apollo/client';

export const ADMIN_USERS_QUERY = gql`
  query AdminUsers {
    adminUsers {
      id
      name
      email
      avatarUrl
      isOnline
      currentStatus
      archived
    }
  }
`;

export const ADMIN_USER_SESSIONS_QUERY = gql`
  query AdminUserSessions($userId: ID!, $input: GetSessionsInput!) {
    adminUserSessions(userId: $userId, input: $input) {
      id
      startTime
      endTime
      status
      totalDuration
      totalBreakTime
      project {
        id
        name
      }
    }
  }
`;

export const ADMIN_SESSION_QUERY = gql`
  query AdminSession($sessionId: ID!) {
    adminSession(sessionId: $sessionId) {
      id
      startTime
      endTime
      status
      totalDuration
      totalBreakTime
      user {
        id
        name
        avatarUrl
        currentStatus
        isOnline
      }
      project {
        id
        name
      }
      segments {
        id
        type
        startTime
        endTime
        duration
        project {
          id
          name
        }
        break {
          id
          type
          startTime
          endTime
          duration
        }
      }
      breaks {
        id
        type
        startTime
        endTime
        duration
      }
    }
  }
`;

export const ADMIN_SESSION_WORK_LOGS_QUERY = gql`
  query AdminSessionWorkLogs($sessionId: ID!) {
    adminSessionWorkLogs(sessionId: $sessionId) {
      id
      content
      links
      createdAt
      project {
        id
        name
      }
    }
  }
`;