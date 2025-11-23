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
        completedDate
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
        createdAt
        updatedAt
      }
      total
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

export const UPDATE_TASK_MUTATION = gql`
  mutation UpdateTask($taskId: String!, $input: UpdateTaskInputType!) {
    updateTask(taskId: $taskId, input: $input) {
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
    }
  }
`;

export const COMPLETE_TASK_MUTATION = gql`
  mutation CompleteTask($taskId: String!) {
    completeTask(taskId: $taskId) {
      id
      status
      completedDate
    }
  }
`;

export const UNCOMPLETE_TASK_MUTATION = gql`
  mutation UncompleteTask($taskId: String!) {
    uncompleteTask(taskId: $taskId) {
      id
      status
      completedDate
    }
  }
`;

export const COMPLETED_TASKS_QUERY = gql`
  query CompletedTasks($startDate: String, $endDate: String) {
    completedTasks(startDate: $startDate, endDate: $endDate) {
      id
      title
      description
      category
      priority
      status
      points
      estimatedHours
      actualHours
      completedDate
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
      createdAt
      updatedAt
    }
  }
`;
