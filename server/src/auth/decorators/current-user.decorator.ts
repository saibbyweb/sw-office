import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

interface RequestWithUser {
  user: {
    id: string;
  };
}

interface GqlContext {
  req: RequestWithUser;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext();
    return gqlContext.req.user.id;
  },
);
