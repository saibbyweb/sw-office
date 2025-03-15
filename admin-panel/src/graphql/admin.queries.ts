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