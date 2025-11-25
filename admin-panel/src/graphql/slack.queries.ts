import { gql } from '@apollo/client';

export const LIST_SLACK_USERS_QUERY = gql`
  query ListSlackUsers {
    listSlackUsers {
      id
      name
      real_name
      profile {
        email
        real_name
        display_name
        image_48
        image_72
        image_192
      }
      deleted
      is_bot
    }
  }
`;
