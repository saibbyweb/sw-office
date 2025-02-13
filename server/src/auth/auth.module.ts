import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtGuard } from './guards/jwt.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRATION', '30d'),
        },
      }),
    }),
  ],
  providers: [JwtGuard],
  exports: [JwtModule, JwtGuard],
})
export class AuthModule {}
