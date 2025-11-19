import { gql } from '@apollo/client';

export const CREATE_TASK_MUTATION = gql`
  mutation CreateTask($input: CreateTaskInputType!) {
    createTask(input: $input) {
      id
      title
      description
      category
      priority
      status
      points
      estimatedHours
      project {
        id
        name
      }
      createdAt
    }
  }
`;

export const TASKS_QUERY = gql`
  query Tasks {
    tasks {
      id
      title
      description
      category
      priority
      status
      points
      estimatedHours
      actualHours
      project {
        id
        name
      }
      assignedTo {
        id
        name
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const ASSIGN_TASK_MUTATION = gql`
  mutation AssignTask($taskId: String!, $userId: String) {
    assignTask(taskId: $taskId, userId: $userId) {
      id
      assignedTo {
        id
        name
        email
      }
    }
  }
`;

export const APPROVE_TASK_MUTATION = gql`
  mutation ApproveTask($taskId: String!, $approvedById: String!) {
    approveTask(taskId: $taskId, approvedById: $approvedById) {
      id
      status
      approvedDate
      approvedBy {
        id
        name
      }
    }
  }
`;

export const UNAPPROVE_TASK_MUTATION = gql`
  mutation UnapproveTask($taskId: String!) {
    unapproveTask(taskId: $taskId) {
      id
      status
      approvedDate
      approvedBy {
        id
        name
      }
    }
  }
`;
