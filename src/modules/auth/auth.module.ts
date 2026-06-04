import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { UsersModule } from '@users/users.module';
import { OrgModule } from '@org/org.module';

import { IHashPort } from '@auth/domain/ports/hash.port';
import {
  IAccessTokenPort,
  IRefreshTokenPort,
  ITokenPairFactory,
} from '@auth/domain/ports/token.port';
import { IPasswordResetTokenPort } from '@auth/domain/ports/password-reset-token.port';
import { IOtpService } from '@auth/domain/ports/otp.port';
import { IOtpRepository } from '@auth/domain/repositories/otp-repository.interface';

import { BcryptHashAdapter } from '@auth/infrastructure/bcrypt-hash.adapter';
import { JwtAccessTokenAdapter } from '@auth/infrastructure/jwt-access-token.adapter';
import { JwtRefreshTokenAdapter } from '@auth/infrastructure/jwt-refresh-token.adapter';
import { JwtPasswordResetTokenAdapter } from '@auth/infrastructure/jwt-password-reset-token.adapter';
import { TokenPairFactory } from '@auth/infrastructure/token-pair.factory';
import { OtpAdapter } from '@auth/infrastructure/otp.adapter';
import { PrismaOtpRepository } from '@auth/infrastructure/prisma-otp.repository';

import { LoginUseCase } from '@auth/application/login.use-case';
import { SignupUseCase } from '@auth/application/signup.use-case';
import { RefreshTokensUseCase } from '@auth/application/refresh-tokens.use-case';
import { ForgotPasswordUseCase } from '@auth/application/forgot-password.use-case';
import { VerifyOtpUseCase } from '@auth/application/verify-otp.use-case';
import { ResetPasswordUseCase } from '@auth/application/reset-password.use-case';

import { AuthController } from '@auth/presentation/auth.controller';
import { JwtAuthGuard } from '@auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/presentation/guards/roles.guard';

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
    forwardRef(() => OrgModule),
  ],
  controllers: [AuthController],
  providers: [
    { provide: IOtpRepository, useClass: PrismaOtpRepository },

    { provide: IHashPort, useClass: BcryptHashAdapter },
    { provide: IAccessTokenPort, useClass: JwtAccessTokenAdapter },
    { provide: IRefreshTokenPort, useClass: JwtRefreshTokenAdapter },
    {
      provide: IPasswordResetTokenPort,
      useClass: JwtPasswordResetTokenAdapter,
    },
    { provide: ITokenPairFactory, useClass: TokenPairFactory },
    { provide: IOtpService, useClass: OtpAdapter },

    LoginUseCase,
    SignupUseCase,
    RefreshTokensUseCase,
    ForgotPasswordUseCase,
    VerifyOtpUseCase,
    ResetPasswordUseCase,

    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    IHashPort,
    IAccessTokenPort,
    IRefreshTokenPort,
    IPasswordResetTokenPort,
    ITokenPairFactory,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
