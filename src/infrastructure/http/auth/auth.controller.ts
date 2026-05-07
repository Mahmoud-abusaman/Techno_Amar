import { Controller, Post, Body, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

import { LoginUseCase } from '@/usecases/auth/login.use-case';
import { SignupUseCase } from '@/usecases/auth/signup.use-case';
import { RefreshTokensUseCase } from '@/usecases/auth/refresh-tokens.use-case';
import { ForgotPasswordUseCase } from '@/usecases/auth/forgot-password.use-case';
import { VerifyOtpUseCase } from '@/usecases/auth/verify-otp.use-case';
import { ResetPasswordUseCase } from '@/usecases/auth/reset-password.use-case';

import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { SignupDto, SignupResponseDto } from './dto/signup.dto';
import { RefreshTokenDto, RefreshTokenResponseDto } from './dto/refresh-token.dto';
import {
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
  VerifyOtpDto,
  VerifyOtpResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
} from './dto/forgot-password.dto';

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
  @ApiOperation({ summary: 'Login with email and password', description: 'Public. Returns access + refresh tokens.' })
  @ApiBody({
    type: LoginDto,
    examples: {
      admin: { summary: 'Admin', value: { email: 'admin@technoamar.ps', password: 'Admin@1234' } },
      citizen: { summary: 'Citizen', value: { email: 'citizen@technoamar.ps', password: 'Citizen@1234' } },
      employee: { summary: 'Employee', value: { email: 'employee@technoamar.ps', password: 'Employee@1234' } },
      manager: { summary: 'Manager', value: { email: 'manager@technoamar.ps', password: 'Manager@1234' } },
    },
  })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account disabled' })
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
  @ApiOperation({ summary: 'Register as a citizen (public)', description: 'Open to all. Always creates a CITIZEN account.' })
  @ApiBody({
    type: SignupDto,
    examples: {
      citizen: {
        summary: 'Citizen registration',
        value: {
          full_name: 'Ahmed Al-Masri',
          email: 'ahmed.almasri@example.com',
          password: 'SecurePass@2024',
          national_id: '987654321',
          phone: '+970591234567',
          address: 'Al-Rimal, Gaza City',
          city: 'GAZA',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: SignupResponseDto })
  @ApiResponse({ status: 409, description: 'A user with this national_id already exists' })
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
  @ApiOperation({ summary: 'Refresh access token', description: 'Public. Rotates refresh token on each call (old token is revoked).' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, type: RefreshTokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
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
  @ApiOperation({ summary: 'Request password reset OTP', description: 'Public. Accepts phone number, national ID, or employee ID. Always returns the same message to prevent user enumeration.' })
  @ApiBody({ type: ForgotPasswordRequestDto })
  @ApiResponse({ status: 200, type: ForgotPasswordResponseDto })
  @ApiResponse({ status: 400, description: 'OTP cooldown active — wait before requesting again' })
  async forgotPassword(@Body() dto: ForgotPasswordRequestDto) {
    return this.forgotPasswordUseCase.execute(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and get reset token', description: 'Public. Max 5 attempts per code. Returns a short-lived reset token to use in /reset-password.' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, type: VerifyOtpResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid code / expired / too many attempts' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const { resetToken, message } = await this.verifyOtpUseCase.execute(dto);
    return { reset_token: resetToken, message };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using reset token', description: 'Public. Use the reset_token from /verify-otp. Token is single-use.' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, type: ResetPasswordResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired reset token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute(dto);
  }
}
