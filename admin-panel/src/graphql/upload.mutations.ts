import { gql } from '@apollo/client';

export const GET_UPLOAD_PRESIGNED_URL = gql`
  mutation GetUploadPresignedUrl(
    $fileName: String!
    $fileType: String!
  ) {
    getUploadPresignedUrl(
      fileName: $fileName
      fileType: $fileType
    ) {
      uploadUrl
      fileUrl
      key
    }
  }
`;
