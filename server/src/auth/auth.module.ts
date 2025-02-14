import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtGuard } from './guards/jwt.guard';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [AuthService, AuthResolver, JwtGuard],
  exports: [AuthService, JwtGuard],
})
export class AuthModule {}
