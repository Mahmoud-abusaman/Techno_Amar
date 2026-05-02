import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { UsersModule } from './users.module';

// Domain — port tokens
import { IHashPort } from 'src/domain/ports/hash.port';
import { IAccessTokenPort, IRefreshTokenPort, ITokenPairFactory } from 'src/domain/ports/token.port';
import { IPasswordResetTokenPort } from 'src/domain/ports/password-reset-token.port';

// Infrastructure — adapters
import { BcryptHashAdapter } from 'src/infrastructure/security/bcrypt-hash.adapter';
import { JwtAccessTokenAdapter } from 'src/infrastructure/security/jwt-access-token.adapter';
import { JwtRefreshTokenAdapter } from 'src/infrastructure/security/jwt-refresh-token.adapter';
import { JwtPasswordResetTokenAdapter } from 'src/infrastructure/security/jwt-password-reset-token.adapter';
import { TokenPairFactory } from 'src/infrastructure/security/token-pair.factory';

// Use Cases
import { LoginUseCase } from 'src/usecases/auth/login.use-case';
import { SignupUseCase } from 'src/usecases/auth/signup.use-case';
import { RefreshTokensUseCase } from 'src/usecases/auth/refresh-tokens.use-case';
import { ForgotPasswordUseCase } from 'src/usecases/auth/forgot-password.use-case';
import { VerifyOtpUseCase } from 'src/usecases/auth/verify-otp.use-case';
import { ResetPasswordUseCase } from 'src/usecases/auth/reset-password.use-case';

// Presentation
import { AuthController } from 'src/infrastructure/http/auth/auth.controller';
import { JwtAuthGuard } from 'src/infrastructure/http/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/infrastructure/http/auth/guards/roles.guard';

// Repositories (auth use-cases depend on IUserRepository and IOtpRepository directly)
import { IUserRepository } from 'src/domain/repositories/user-repository.interface';
import { IOtpRepository } from 'src/domain/repositories/otp-repository.interface';
import { PrismaUserRepository } from 'src/infrastructure/database/repositories/prisma-user.repository';
import { PrismaOtpRepository } from 'src/infrastructure/database/repositories/prisma-otp.repository';

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
    { provide: IPasswordResetTokenPort, useClass: JwtPasswordResetTokenAdapter },
    { provide: ITokenPairFactory, useClass: TokenPairFactory },

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
