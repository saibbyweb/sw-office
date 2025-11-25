import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class SlackUserProfile {
  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  real_name?: string;

  @Field({ nullable: true })
  display_name?: string;

  @Field({ nullable: true })
  image_24?: string;

  @Field({ nullable: true })
  image_32?: string;

  @Field({ nullable: true })
  image_48?: string;

  @Field({ nullable: true })
  image_72?: string;

  @Field({ nullable: true })
  image_192?: string;

  @Field({ nullable: true })
  image_512?: string;
}

@ObjectType()
export class SlackUserOutput {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  real_name: string;

  @Field(() => SlackUserProfile)
  profile: SlackUserProfile;

  @Field()
  deleted: boolean;

  @Field()
  is_bot: boolean;
}
