import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput, RegisterInput } from '../users/dto/auth.input';
import { AuthPayload } from './dto/auth.payload';

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

  @Mutation(() => Boolean)
  async logout() {
    // TODO: Implement token blacklisting if needed
    return true;
  }
}
