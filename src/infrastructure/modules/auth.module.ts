import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { UsersModule } from './users.module';

// Domain — port tokens
import { IHashPort } from '@domain/ports/hash.port';
import {
  IAccessTokenPort,
  IRefreshTokenPort,
  ITokenPairFactory,
} from '@domain/ports/token.port';
import { IPasswordResetTokenPort } from '@domain/ports/password-reset-token.port';
import { IOtpService } from '@domain/ports/otp.port';

// Infrastructure — adapters
import { BcryptHashAdapter } from '@infrastructure/security/bcrypt-hash.adapter';
import { JwtAccessTokenAdapter } from '@infrastructure/security/jwt-access-token.adapter';
import { JwtRefreshTokenAdapter } from '@infrastructure/security/jwt-refresh-token.adapter';
import { JwtPasswordResetTokenAdapter } from '@infrastructure/security/jwt-password-reset-token.adapter';
import { TokenPairFactory } from '@infrastructure/security/token-pair.factory';
import { OtpAdapter } from '@infrastructure/security/otp.adapter';

// Use Cases
import { LoginUseCase } from '@/usecases/auth/login.use-case';
import { SignupUseCase } from '@/usecases/auth/signup.use-case';
import { RefreshTokensUseCase } from '@/usecases/auth/refresh-tokens.use-case';
import { ForgotPasswordUseCase } from '@/usecases/auth/forgot-password.use-case';
import { VerifyOtpUseCase } from '@/usecases/auth/verify-otp.use-case';
import { ResetPasswordUseCase } from '@/usecases/auth/reset-password.use-case';

// Presentation
import { AuthController } from '@infrastructure/http/auth/auth.controller';
import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@infrastructure/http/auth/guards/roles.guard';

// Repositories (auth use-cases depend on IUserRepository and IOtpRepository directly)
import { IUserRepository } from '@domain/repositories/user-repository.interface';
import { IOtpRepository } from '@domain/repositories/otp-repository.interface';
import { PrismaUserRepository } from '@infrastructure/database/repositories/prisma-user.repository';
import { PrismaOtpRepository } from '@infrastructure/database/repositories/prisma-otp.repository';

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
  ],
  controllers: [AuthController],
  providers: [
    // Repository bindings
    { provide: IUserRepository, useClass: PrismaUserRepository },
    { provide: IOtpRepository, useClass: PrismaOtpRepository },

    // Security adapters
    { provide: IHashPort, useClass: BcryptHashAdapter },
    { provide: IAccessTokenPort, useClass: JwtAccessTokenAdapter },
    { provide: IRefreshTokenPort, useClass: JwtRefreshTokenAdapter },
    {
      provide: IPasswordResetTokenPort,
      useClass: JwtPasswordResetTokenAdapter,
    },
    { provide: ITokenPairFactory, useClass: TokenPairFactory },
    { provide: IOtpService, useClass: OtpAdapter },

    // Use cases
    LoginUseCase,
    SignupUseCase,
    RefreshTokensUseCase,
    ForgotPasswordUseCase,
    VerifyOtpUseCase,
    ResetPasswordUseCase,

    // Guards
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
