import { gql } from '@apollo/client';

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