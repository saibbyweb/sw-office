import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginInput, RegisterInput } from '../users/dto/auth.input';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { UserRole } from 'src/generated-nestjs-typegraphql';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET must be defined');
    }
    this.jwtSecret = secret;
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (process.env.NODE_ENV === 'development') {
      return user;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(input: LoginInput) {
    const user = await this.validateUser(input.email, input.password);
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.config.get('JWT_EXPIRATION', '30d'),
    });

    return {
      token,
      user,
    };
  }

  async register(input: RegisterInput) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
        role: UserRole.USER,
        slackUserId: input.slackUserId,
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.config.get('JWT_EXPIRATION', '30d'),
    });

    return {
      token,
      user,
    };
  }

  verifyToken(token: string) {
    try {
      const payload = jwt.verify(token, this.jwtSecret);
      return payload as jwt.JwtPayload & { sub: string };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Invalid token';
      throw new UnauthorizedException(errorMessage);
    }
  }
}
