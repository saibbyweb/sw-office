import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class PresignedUrlResponse {
  @Field()
  uploadUrl: string;

  @Field()
  fileUrl: string;

  @Field()
  key: string;
}
