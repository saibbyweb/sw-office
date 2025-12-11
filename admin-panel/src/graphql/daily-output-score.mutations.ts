import { gql } from '@apollo/client';

export const CREATE_OR_UPDATE_DAILY_SCORE_MUTATION = gql`
  mutation CreateOrUpdateDailyScore($input: CreateDailyScoreInput!) {
    createOrUpdateDailyScore(input: $input) {
      id
      userId
      date
      score
      tasksCompleted
      taskDifficulty
      initiativeCount
      qualityRating
      availabilityRating
      notes
      user {
        id
        name
        email
        avatarUrl
      }
      assignedBy {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_DAILY_SCORE_MUTATION = gql`
  mutation UpdateDailyScore($id: String!, $input: UpdateDailyScoreInput!) {
    updateDailyScore(id: $id, input: $input) {
      id
      userId
      date
      score
      tasksCompleted
      taskDifficulty
      initiativeCount
      qualityRating
      availabilityRating
      notes
      user {
        id
        name
        email
        avatarUrl
      }
      assignedBy {
        id
        name
      }
      updatedAt
    }
  }
`;

export const DELETE_DAILY_SCORE_MUTATION = gql`
  mutation DeleteDailyScore($id: String!) {
    deleteDailyScore(id: $id) {
      id
    }
  }
`;

export const DAILY_SCORES_BY_USER_QUERY = gql`
  query DailyScoresByUser($userId: String!, $startDate: String, $endDate: String) {
    dailyScoresByUser(userId: $userId, startDate: $startDate, endDate: $endDate) {
      id
      userId
      date
      score
      tasksCompleted
      taskDifficulty
      initiativeCount
      qualityRating
      availabilityRating
      notes
      user {
        id
        name
        email
        avatarUrl
      }
      assignedBy {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const DAILY_SCORES_BY_DATE_QUERY = gql`
  query DailyScoresByDate($date: String!) {
    dailyScoresByDate(date: $date) {
      id
      userId
      date
      score
      tasksCompleted
      taskDifficulty
      initiativeCount
      qualityRating
      availabilityRating
      notes
      user {
        id
        name
        email
        avatarUrl
      }
      assignedBy {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const DAILY_SCORE_BY_USER_AND_DATE_QUERY = gql`
  query DailyScoreByUserAndDate($userId: String!, $date: String!) {
    dailyScoreByUserAndDate(userId: $userId, date: $date) {
      id
      userId
      date
      score
      tasksCompleted
      taskDifficulty
      initiativeCount
      qualityRating
      availabilityRating
      notes
      user {
        id
        name
        email
        avatarUrl
      }
      assignedBy {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const ALL_DAILY_SCORES_QUERY = gql`
  query AllDailyScores($startDate: String, $endDate: String) {
    allDailyScores(startDate: $startDate, endDate: $endDate) {
      id
      userId
      date
      score
      tasksCompleted
      taskDifficulty
      initiativeCount
      qualityRating
      availabilityRating
      notes
      user {
        id
        name
        email
        avatarUrl
      }
      assignedBy {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const TASKS_COMPLETED_ON_DATE_QUERY = gql`
  query TasksCompletedOnDate($date: String!, $userId: String) {
    tasksCompletedOnDate(date: $date, userId: $userId) {
      id
      title
      description
      category
      priority
      points
      status
      difficulty
      suggestedById
      assignedToId
      completedAt
      completedSessionId
      completedDate
      assignedTo {
        id
        name
        email
      }
      suggestedBy {
        id
        name
      }
      completedSession {
        id
        startTime
        endTime
      }
      createdAt
      updatedAt
    }
  }
`;

export const USER_DAILY_SCORES_QUERY = gql`
  query UserDailyScores($startDate: String, $endDate: String) {
    userDailyScores(startDate: $startDate, endDate: $endDate) {
      userId
      userName
      totalTasks
      scoredTasks
      averageScore
    }
  }
`;

export const COMPLETED_TASKS_BY_USER_QUERY = gql`
  query CompletedTasksByUser($userId: String!, $startDate: String, $endDate: String) {
    completedTasksByUser(userId: $userId, startDate: $startDate, endDate: $endDate) {
      id
      title
      description
      category
      priority
      status
      points
      score
      estimatedHours
      actualHours
      completedDate
      prLinks
      project {
        id
        name
      }
      assignedTo {
        id
        name
        email
      }
      suggestedBy {
        id
        name
        email
      }
      approvedBy {
        id
        name
      }
    }
  }
`;

export const UPDATE_TASK_SCORE_MUTATION = gql`
  mutation UpdateTaskScore($taskId: String!, $score: Float!) {
    updateTaskScore(taskId: $taskId, score: $score) {
      id
      score
    }
  }
`;
