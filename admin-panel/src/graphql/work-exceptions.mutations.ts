import { gql } from '@apollo/client';

export const CREATE_WORK_EXCEPTION_MUTATION = gql`
  mutation CreateWorkException(
    $userId: String!
    $type: ExceptionType!
    $date: String!
    $scheduledTime: String
    $actualTime: String
    $reason: String
    $notes: String
    $compensationDate: String
  ) {
    createWorkException(
      userId: $userId
      type: $type
      date: $date
      scheduledTime: $scheduledTime
      actualTime: $actualTime
      reason: $reason
      notes: $notes
      compensationDate: $compensationDate
    ) {
      id
      userId
      type
      date
      scheduledTime
      actualTime
      reason
      notes
      compensationDate
      user {
        id
        name
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_WORK_EXCEPTION_MUTATION = gql`
  mutation UpdateWorkException(
    $id: String!
    $type: ExceptionType
    $date: String
    $scheduledTime: String
    $actualTime: String
    $reason: String
    $notes: String
    $compensationDate: String
  ) {
    updateWorkException(
      id: $id
      type: $type
      date: $date
      scheduledTime: $scheduledTime
      actualTime: $actualTime
      reason: $reason
      notes: $notes
      compensationDate: $compensationDate
    ) {
      id
      userId
      type
      date
      scheduledTime
      actualTime
      reason
      notes
      compensationDate
      user {
        id
        name
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_WORK_EXCEPTION_MUTATION = gql`
  mutation DeleteWorkException($id: String!) {
    deleteWorkException(id: $id) {
      id
    }
  }
`;

export const WORK_EXCEPTIONS_QUERY = gql`
  query WorkExceptions(
    $userId: String
    $startDate: String
    $endDate: String
    $type: ExceptionType
  ) {
    workExceptions(
      userId: $userId
      startDate: $startDate
      endDate: $endDate
      type: $type
    ) {
      id
      userId
      type
      date
      scheduledTime
      actualTime
      reason
      notes
      compensationDate
      user {
        id
        name
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const WORK_EXCEPTION_STATS_QUERY = gql`
  query WorkExceptionStats($userId: String, $startDate: String, $endDate: String) {
    workExceptionStats(userId: $userId, startDate: $startDate, endDate: $endDate) {
      total
      fullDayLeaves
      halfDayLeaves
      lateArrivals
      earlyExits
      workFromHome
      sickLeaves
      emergencyLeaves
    }
  }
`;
