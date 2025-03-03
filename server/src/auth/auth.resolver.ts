import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput, RegisterInput } from '../users/dto/auth.input';
import { AuthPayload } from './dto/auth.payload';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }

  @Mutation(() => AuthPayload)
  async register(@Args('input') input: RegisterInput) {
    return this.authService.register(input);
  }

  @Mutation(() => String)
  async hashPassword(@Args('password') password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
  }

  @Mutation(() => AuthPayload, { name: 'registerSeedUser' })
  async registerSeedUser() {
    try {
      return await this.authService.register({
        email: 'xyz@gmail.com',
        password: 'password123',
        name: 'Seed User',
      });
    } catch (error) {
      // If user already exists, try to log them in instead
      if (
        error instanceof UnauthorizedException &&
        error.message === 'Email already registered'
      ) {
        return await this.authService.login({
          email: 'xyz@gmail.com',
          password: 'password123',
        });
      }
      throw error;
    }
  }

  @Mutation(() => Boolean)
  logout() {
    // TODO: Implement token blacklisting if needed
    return true;
  }
}
