import { gql } from '@apollo/client';

export const PROJECTS_QUERY = gql`
  query Projects {
    projects {
      id
      name
      slug
      isActive
    }
  }
`;
