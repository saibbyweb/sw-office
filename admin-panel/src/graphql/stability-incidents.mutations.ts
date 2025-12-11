import { gql } from '@apollo/client';

export const CREATE_STABILITY_INCIDENT_MUTATION = gql`
  mutation CreateStabilityIncident($input: CreateStabilityIncidentInput!) {
    createStabilityIncident(input: $input) {
      id
      userId
      type
      severity
      title
      description
      taskId
      incidentDate
      resolvedAt
      resolutionNotes
      rootCause
      preventionPlan
      adminNotes
      screenshots
      logLinks
      user {
        id
        name
        email
        avatarUrl
      }
      task {
        id
        title
      }
      reportedBy {
        id
        name
        email
      }
      resolutionTask {
        id
        title
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_STABILITY_INCIDENT_MUTATION = gql`
  mutation UpdateStabilityIncident($id: String!, $input: UpdateStabilityIncidentInput!) {
    updateStabilityIncident(id: $id, input: $input) {
      id
      userId
      type
      severity
      title
      description
      taskId
      incidentDate
      resolvedAt
      resolutionNotes
      rootCause
      preventionPlan
      adminNotes
      screenshots
      logLinks
      user {
        id
        name
        email
        avatarUrl
      }
      task {
        id
        title
      }
      reportedBy {
        id
        name
        email
      }
      resolutionTask {
        id
        title
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_STABILITY_INCIDENT_MUTATION = gql`
  mutation DeleteStabilityIncident($id: String!) {
    deleteStabilityIncident(id: $id)
  }
`;

export const RESOLVE_STABILITY_INCIDENT_MUTATION = gql`
  mutation ResolveStabilityIncident($id: String!, $resolutionNotes: String!, $resolvedAt: Int!, $resolutionTaskId: String) {
    resolveStabilityIncident(id: $id, resolutionNotes: $resolutionNotes, resolvedAt: $resolvedAt, resolutionTaskId: $resolutionTaskId) {
      id
      resolvedAt
      resolutionNotes
      resolutionTaskId
      resolutionTask {
        id
        title
      }
    }
  }
`;

export const UNRESOLVE_STABILITY_INCIDENT_MUTATION = gql`
  mutation UnresolveStabilityIncident($id: String!) {
    unresolveStabilityIncident(id: $id) {
      id
      resolvedAt
      resolutionNotes
    }
  }
`;

export const STABILITY_INCIDENTS_QUERY = gql`
  query StabilityIncidents($filters: IncidentFiltersInput) {
    stabilityIncidents(filters: $filters) {
      id
      userId
      type
      severity
      title
      description
      taskId
      incidentDate
      resolvedAt
      resolutionNotes
      rootCause
      preventionPlan
      adminNotes
      screenshots
      logLinks
      user {
        id
        name
        email
        avatarUrl
      }
      task {
        id
        title
      }
      reportedBy {
        id
        name
        email
      }
      resolutionTask {
        id
        title
      }
      createdAt
      updatedAt
    }
  }
`;

export const STABILITY_INCIDENT_QUERY = gql`
  query StabilityIncident($id: String!) {
    stabilityIncident(id: $id) {
      id
      userId
      type
      severity
      title
      description
      taskId
      incidentDate
      resolvedAt
      resolutionNotes
      rootCause
      preventionPlan
      adminNotes
      screenshots
      logLinks
      user {
        id
        name
        email
        avatarUrl
      }
      task {
        id
        title
      }
      reportedBy {
        id
        name
        email
      }
      resolutionTask {
        id
        title
      }
      createdAt
      updatedAt
    }
  }
`;
