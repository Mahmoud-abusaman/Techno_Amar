import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { OtpModule } from 'src/otp/otp.module';
import {
  IHashProvider,
  ITokenProvider,
  IRefreshTokenProvider,
  IPasswordResetProvider,
} from './providers';
import {
  BcryptHashProvider,
  JwtTokenProvider,
  JwtRefreshTokenProvider,
  JwtPasswordResetProvider,
} from './providers';
import { JwtAuthGuard, RolesGuard } from './guards';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('app.jwt.secret'),
        signOptions: { expiresIn: config.get('app.jwt.accessTokenTtl') },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => UsersModule),
    OtpModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: IHashProvider,
      useClass: BcryptHashProvider,
    },
    {
      provide: ITokenProvider,
      useClass: JwtTokenProvider,
    },
    {
      provide: IRefreshTokenProvider,
      useClass: JwtRefreshTokenProvider,
    },
    {
      provide: IPasswordResetProvider,
      useClass: JwtPasswordResetProvider,
    },
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    IHashProvider,
    ITokenProvider,
    IRefreshTokenProvider,
    IPasswordResetProvider,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
