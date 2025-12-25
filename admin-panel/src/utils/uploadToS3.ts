import { ApolloClient } from '@apollo/client';
import { GET_UPLOAD_PRESIGNED_URL } from '../graphql/upload.mutations';

export async function uploadFileToS3(
  file: File,
  apolloClient: ApolloClient<any>,
): Promise<string> {
  try {
    // Step 1: Get presigned URL from backend
    const { data } = await apolloClient.mutate({
      mutation: GET_UPLOAD_PRESIGNED_URL,
      variables: {
        fileName: file.name,
        fileType: file.type,
      },
    });

    const { uploadUrl, fileUrl } = data.getUploadPresignedUrl;

    // Step 2: Upload file directly to S3 using presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to S3');
    }

    // Step 3: Return the permanent file URL
    return fileUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}
