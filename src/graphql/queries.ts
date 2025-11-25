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
      avatarUrl
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

export const TEAM_USERS_QUERY = gql`
  query GetTeamUsers {
    getUsers {
      id
      name
      email
      avatarUrl
      isOnline
      currentStatus
      activeSession {
        id
        startTime
        project {
          name
        }
        breaks {
          id
          endTime
        }
      }
    }
  }
`;

export const AVAILABLE_TASKS = gql`
  query AvailableTasks($skip: Int, $take: Int, $filters: TaskFiltersInput, $userId: String) {
    tasks(skip: $skip, take: $take, filters: $filters, userId: $userId) {
      tasks {
        id
        title
        description
        status
        priority
        category
        points
        estimatedHours
        actualHours
        dueDate
        startedDate
        completedDate
        assignedTo {
          id
          name
          email
          avatarUrl
        }
        project {
          id
          name
        }
        suggestedBy {
          id
          name
          avatarUrl
        }
        approvedBy {
          id
          name
          avatarUrl
        }
      }
      total
      hasMore
      myTasksCount
      availableTasksCount
      suggestedTasksCount
    }
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInputType!) {
    createTask(input: $input) {
      id
      title
      description
      status
      priority
      category
      points
      estimatedHours
      project {
        id
        name
      }
      suggestedBy {
        id
        name
      }
    }
  }
`;

export const SUGGEST_TASK = gql`
  mutation SuggestTask($input: CreateTaskInputType!) {
    suggestTask(input: $input) {
      id
      title
      description
      status
      priority
      category
      points
      estimatedHours
      project {
        id
        name
      }
      suggestedBy {
        id
        name
      }
    }
  }
`;

export const ASSIGN_TASK = gql`
  mutation AssignTask($taskId: String!, $userId: String) {
    assignTask(taskId: $taskId, userId: $userId) {
      id
      title
      status
      assignedTo {
        id
        name
        email
        avatarUrl
      }
    }
  }
`;

export const UPDATE_TASK_STATUS = gql`
  mutation UpdateTaskStatus($taskId: String!, $status: String!, $userId: String!) {
    updateTaskStatus(taskId: $taskId, status: $status, userId: $userId) {
      id
      title
      status
      startedDate
      completedDate
      assignedTo {
        id
        name
        email
        avatarUrl
      }
    }
  }
`;

export const SELF_APPROVE_TASK = gql`
  mutation SelfApproveTask($taskId: String!) {
    selfApproveTask(taskId: $taskId) {
      id
      title
      status
      approvedDate
      approvedBy {
        id
        name
        email
      }
      suggestedBy {
        id
        name
        email
      }
    }
  }
`;

export const GET_USER_PROFILE = gql`
  query GetUserProfile($userId: String!) {
    getUserProfile(userId: $userId) {
      id
      name
      email
      role
      avatarUrl
      isOnline
      currentStatus
      createdAt
      statistics {
        allottedTasks
        completedTasks
        inProgressTasks
      }
      activeSession {
        id
        startTime
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
        }
      }
      taskAssignments {
        id
        title
        status
        priority
        createdAt
        completedDate
        project {
          id
          name
        }
      }
    }
  }
`;

export const GET_USER_SESSION_DATES = gql`
  query GetUserSessionDates($userId: String!, $input: GetSessionDatesInput!) {
    getUserSessionDates(userId: $userId, input: $input) {
      startTime
      id
    }
  }
`; 