import { Controller, Post, Body, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { LoginUseCase } from '@/usecases/auth/login.use-case';
import { SignupUseCase } from '@/usecases/auth/signup.use-case';
import { RefreshTokensUseCase } from '@/usecases/auth/refresh-tokens.use-case';
import { ForgotPasswordUseCase } from '@/usecases/auth/forgot-password.use-case';
import { VerifyOtpUseCase } from '@/usecases/auth/verify-otp.use-case';
import { ResetPasswordUseCase } from '@/usecases/auth/reset-password.use-case';

import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  ForgotPasswordRequestDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from './dto/forgot-password.dto';
import {
  LoginDocs,
  SignupDocs,
  RefreshDocs,
  ForgotPasswordDocs,
  VerifyOtpDocs,
  ResetPasswordDocs,
} from './auth.controller.doc';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(LoginUseCase) private readonly loginUseCase: LoginUseCase,
    @Inject(SignupUseCase) private readonly signupUseCase: SignupUseCase,
    @Inject(RefreshTokensUseCase) private readonly refreshTokensUseCase: RefreshTokensUseCase,
    @Inject(ForgotPasswordUseCase) private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    @Inject(VerifyOtpUseCase) private readonly verifyOtpUseCase: VerifyOtpUseCase,
    @Inject(ResetPasswordUseCase) private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @LoginDocs()
  async login(@Body() dto: LoginDto) {
    const { tokens, user } = await this.loginUseCase.execute(dto);
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: tokens.expiresAt,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    };
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @SignupDocs()
  async signup(@Body() dto: SignupDto) {
    const { tokens, user } = await this.signupUseCase.execute(dto);
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: tokens.expiresAt,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @RefreshDocs()
  async refresh(@Body() dto: RefreshTokenDto) {
    const { tokens, user } = await this.refreshTokensUseCase.execute(dto.refresh_token);
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: tokens.expiresAt,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ForgotPasswordDocs()
  async forgotPassword(@Body() dto: ForgotPasswordRequestDto) {
    return this.forgotPasswordUseCase.execute(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @VerifyOtpDocs()
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const { resetToken, message } = await this.verifyOtpUseCase.execute(dto);
    return { reset_token: resetToken, message };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ResetPasswordDocs()
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute(dto);
  }
}
