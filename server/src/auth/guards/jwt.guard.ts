import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GqlExecutionContext } from '@nestjs/graphql';

interface JwtPayload {
  sub: string;
}

interface RequestWithUser {
  headers: {
    authorization?: string;
  };
  user?: {
    id: string;
  };
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req as RequestWithUser;

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer') {
      throw new UnauthorizedException('Invalid token type');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      req.user = { id: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
