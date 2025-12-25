import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UploadService } from './upload.service';
import { PresignedUrlResponse } from './dto/presigned-url-response.dto';

@Resolver()
export class UploadResolver {
  constructor(private readonly uploadService: UploadService) {}

  @Mutation(() => PresignedUrlResponse)
  async getUploadPresignedUrl(
    @Args('fileName') fileName: string,
    @Args('fileType') fileType: string,
  ): Promise<PresignedUrlResponse> {
    const result = await this.uploadService.getPresignedUrl(
      fileName,
      fileType,
    );

    return {
      uploadUrl: result.uploadUrl,
      fileUrl: result.fileUrl,
      key: result.key,
    };
  }
}
