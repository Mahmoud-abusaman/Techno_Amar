import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

import { ApiResponseDto } from '@shared/common/dto/api-response.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { SignupDto, SignupResponseDto } from './dto/signup.dto';
import {
  RefreshTokenDto,
  RefreshTokenResponseDto,
} from './dto/refresh-token.dto';
import {
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
  VerifyOtpDto,
  VerifyOtpResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
} from './dto/forgot-password.dto';
import { SEED } from '@shared/common/constants/seed-examples';

// ── Wrapped response shapes — derived from ApiResponseDto so they stay in sync with UnifiedApiResponse<T> ──

class WrappedLoginResponse extends ApiResponseDto(LoginResponseDto) {}
class WrappedSignupResponse extends ApiResponseDto(SignupResponseDto) {}
class WrappedRefreshResponse extends ApiResponseDto(RefreshTokenResponseDto) {}
class WrappedForgotPasswordResponse extends ApiResponseDto(
  ForgotPasswordResponseDto,
) {}
class WrappedVerifyOtpResponse extends ApiResponseDto(VerifyOtpResponseDto) {}
class WrappedResetPasswordResponse extends ApiResponseDto(
  ResetPasswordResponseDto,
) {}

// ── Composed endpoint decorators ──

export const LoginDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Login with ID and password',
      description:
        'Public. Use national_id for citizens, employee_id for employees/managers. Returns access + refresh tokens.',
    }),
    ApiBody({
      type: LoginDto,
      examples: {
        admin: {
          summary: 'Admin',
          value: { identifier: SEED.admin.employee_id, password: SEED.admin.password },
        },
        citizen: {
          summary: 'Citizen',
          value: { identifier: SEED.citizen.national_id, password: SEED.citizen.password },
        },
        employee: {
          summary: 'Employee',
          value: { identifier: SEED.employee.employee_id, password: SEED.employee.password },
        },
        manager: {
          summary: 'Manager',
          value: { identifier: SEED.manager.employee_id, password: SEED.manager.password },
        },
      },
    }),
    ApiResponse({ status: 200, type: WrappedLoginResponse }),
    ApiResponse({
      status: 401,
      description: 'Invalid credentials or account disabled',
    }),
  );

export const SignupDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Register as a citizen (public)',
      description:
        'Open to all. Creates a CITIZEN account in PENDING_VERIFICATION status. ' +
        'Upload the national ID PDF and a selfie holding the ID to ImageKit first (see GET /auth/imagekit/upload-auth), ' +
        'then include both in verification_documents. No tokens are issued until an admin approves the account.',
    }),
    ApiBody({
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
            verification_documents: {
              id_document: {
                file_name: 'National ID Copy.pdf',
                file_type: 'application/pdf',
                file_url: 'https://ik.imagekit.io/TechnoAmar/citizens/id.pdf',
                file_id: 'file_abc123',
              },
              id_selfie: {
                file_name: 'Selfie with ID.jpg',
                file_type: 'image/jpeg',
                file_url: 'https://ik.imagekit.io/TechnoAmar/citizens/selfie.jpg',
                file_id: 'file_selfie123',
              },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 201, type: WrappedSignupResponse }),
    ApiResponse({
      status: 409,
      description: 'A user with this national_id already exists',
    }),
  );

export const ImageKitUploadAuthDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get ImageKit upload auth for registration (public)',
      description:
        'Public endpoint for citizen registration. Upload PDF and image files directly to ImageKit ' +
        'from the client, then pass the returned file metadata in POST /auth/signup.',
    }),
    ApiResponse({ status: 200, description: 'ImageKit upload authentication parameters' }),
  );

export const RefreshDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Refresh access token',
      description:
        'Public. Rotates refresh token on each call (old token is revoked).',
    }),
    ApiBody({ type: RefreshTokenDto }),
    ApiResponse({ status: 200, type: WrappedRefreshResponse }),
    ApiResponse({
      status: 401,
      description: 'Invalid or expired refresh token',
    }),
  );

export const ForgotPasswordDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Request password reset OTP',
      description:
        'Public. Accepts phone number, national ID, or employee ID. Always returns the same message to prevent user enumeration.',
    }),
    ApiBody({ type: ForgotPasswordRequestDto }),
    ApiResponse({ status: 200, type: WrappedForgotPasswordResponse }),
    ApiResponse({
      status: 400,
      description: 'OTP cooldown active — wait before requesting again',
    }),
  );

export const VerifyOtpDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Verify OTP and get reset token',
      description:
        'Public. Max 5 attempts per code. Returns a short-lived reset token to use in /reset-password.',
    }),
    ApiBody({ type: VerifyOtpDto }),
    ApiResponse({ status: 200, type: WrappedVerifyOtpResponse }),
    ApiResponse({
      status: 400,
      description: 'Invalid code / expired / too many attempts',
    }),
    ApiResponse({ status: 404, description: 'User not found' }),
  );

export const ResetPasswordDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Reset password using reset token',
      description:
        'Public. Use the reset_token from /verify-otp. Token is single-use.',
    }),
    ApiBody({ type: ResetPasswordDto }),
    ApiResponse({ status: 200, type: WrappedResetPasswordResponse }),
    ApiResponse({ status: 401, description: 'Invalid or expired reset token' }),
    ApiResponse({ status: 404, description: 'User not found' }),
  );
