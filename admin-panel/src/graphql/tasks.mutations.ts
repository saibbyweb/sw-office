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
      createdAt
      updatedAt
    }
  }
`;
