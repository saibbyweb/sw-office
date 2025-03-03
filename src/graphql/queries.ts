import { gql } from '@apollo/client';

export const LATEST_APP_VERSION = gql`
  query LatestAppVersion {
    latestAppVersion
  }
`;

export const GET_RELEASE_URL = gql`
  query GetReleaseUrl($version: String!) {
    getReleaseUrl(version: $version)
  }
`;

export const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      name
      isActive
      slug
    }
  }
`;

export const ME = gql`
  query Me {
    me {
      id
      email
      name
    }
  }
`;

export const ACTIVE_SESSION = gql`
  query ActiveSession {
    activeSession {
      id
      startTime
      endTime
      status
      projectId
      project {
        id
        name
      }
      totalDuration
      totalBreakTime
      breaks {
        id
        type
        startTime
        endTime
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
        }
      }
      workLogs {
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
  }
`;

export const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      isActive
      slug
    }
  }
`;

export const START_SESSION = gql`
  mutation StartSession($input: StartSessionInput!) {
    startSession(input: $input) {
      id
      startTime
      endTime
      status
      totalDuration
      totalBreakTime
      userId
      projectId
      project {
        id
        name
      }
    }
  }
`;

export const START_BREAK = gql`
  mutation StartBreak($input: StartBreakInput!) {
    startBreak(input: $input) {
      id
      type
      startTime
      endTime
      duration
      sessionId
    }
  }
`;

export const END_BREAK = gql`
  mutation EndBreak($breakId: ID!) {
    endBreak(breakId: $breakId) {
      id
      endTime
      duration
    }
  }
`;

export const SWITCH_PROJECT = gql`
  mutation SwitchProject($input: SwitchProjectInput!) {
    switchProject(input: $input) {
      id
      projectId
      project {
        id
        name
      }
    }
  }
`;

export const SESSION_WORK_LOGS = gql`
  query SessionWorkLogs($sessionId: ID!) {
    sessionWorkLogs(sessionId: $sessionId) {
      id
      content
      links
      createdAt
      project {
        id
        name
      }
      user {
        id
        name
      }
    }
  }
`;

export const ADD_WORK_LOG = gql`
  mutation AddWorkLog($input: AddWorkLogInput!) {
    addWorkLog(input: $input) {
      id
      content
      links
      createdAt
      project {
        id
        name
        isActive
      }
      user {
        id
        name
      }
      session {
        id
      }
    }
  }
`;

export const UPDATE_WORK_LOG = gql`
  mutation UpdateWorkLog($input: UpdateWorkLogInput!) {
    updateWorkLog(input: $input) {
      id
      content
      links
      createdAt
      project {
        id
        name
      }
      user {
        id
        name
      }
    }
  }
`;

export const DELETE_WORK_LOG = gql`
  mutation DeleteWorkLog($id: ID!) {
    deleteWorkLog(id: $id)
  }
`;

export const END_SESSION = gql`
  mutation EndSession($id: ID!) {
    endSession(id: $id) {
      id
      endTime
      status
      totalDuration
      totalBreakTime
    }
  }
`;

export const GET_USER_SESSIONS = gql`
  query GetUserSessions($input: GetSessionsInput!) {
    userSessions(input: $input) {
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
      workLogs {
        id
        content
        createdAt
        project {
          id
          name
        }
      }
    }
  }
`; 