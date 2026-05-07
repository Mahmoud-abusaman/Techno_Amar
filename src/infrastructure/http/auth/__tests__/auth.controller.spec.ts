import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from '../auth.controller';
import { LoginUseCase } from '@/usecases/auth/login.use-case';
import { SignupUseCase } from '@/usecases/auth/signup.use-case';
import { RefreshTokensUseCase } from '@/usecases/auth/refresh-tokens.use-case';
import { ForgotPasswordUseCase } from '@/usecases/auth/forgot-password.use-case';
import { VerifyOtpUseCase } from '@/usecases/auth/verify-otp.use-case';
import { ResetPasswordUseCase } from '@/usecases/auth/reset-password.use-case';
import { ResponseInterceptor } from '@infrastructure/http/common/interceptors/response.interceptor';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@/generated/prisma/enums';

// ---------------------------------------------------------------------------
// Shared stubs
// ---------------------------------------------------------------------------

const ACCESS_TOKEN = 'access.token.jwt';
const REFRESH_TOKEN = 'refresh.token.jwt';
const RESET_TOKEN = 'reset.token.jwt';
const EXPIRES_AT = new Date('2099-01-01T00:00:00.000Z');

const userStub = {
  id: 1n,
  email: 'ahmed@example.com',
  full_name: 'Ahmed Al-Masri',
  role: UserRole.CITIZEN,
};

const tokenPairStub = {
  accessToken: ACCESS_TOKEN,
  refreshToken: REFRESH_TOKEN,
  expiresAt: EXPIRES_AT,
};

const authResultStub = { tokens: tokenPairStub, user: userStub };

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

describe('AuthController (integration)', () => {
  let app: INestApplication;

  let loginUseCase: jest.Mocked<Pick<LoginUseCase, 'execute'>>;
  let signupUseCase: jest.Mocked<Pick<SignupUseCase, 'execute'>>;
  let refreshTokensUseCase: jest.Mocked<Pick<RefreshTokensUseCase, 'execute'>>;
  let forgotPasswordUseCase: jest.Mocked<Pick<ForgotPasswordUseCase, 'execute'>>;
  let verifyOtpUseCase: jest.Mocked<Pick<VerifyOtpUseCase, 'execute'>>;
  let resetPasswordUseCase: jest.Mocked<Pick<ResetPasswordUseCase, 'execute'>>;

  beforeEach(async () => {
    loginUseCase = { execute: jest.fn() };
    signupUseCase = { execute: jest.fn() };
    refreshTokensUseCase = { execute: jest.fn() };
    forgotPasswordUseCase = { execute: jest.fn() };
    verifyOtpUseCase = { execute: jest.fn() };
    resetPasswordUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: LoginUseCase, useValue: loginUseCase },
        { provide: SignupUseCase, useValue: signupUseCase },
        { provide: RefreshTokensUseCase, useValue: refreshTokensUseCase },
        { provide: ForgotPasswordUseCase, useValue: forgotPasswordUseCase },
        { provide: VerifyOtpUseCase, useValue: verifyOtpUseCase },
        { provide: ResetPasswordUseCase, useValue: resetPasswordUseCase },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // -------------------------------------------------------------------------
  // POST /auth/login
  // -------------------------------------------------------------------------

  describe('POST /auth/login', () => {
    const validBody = { email: 'ahmed@example.com', password: 'SecurePass@2024' };

    it('200 — returns tokens and user on valid credentials', async () => {
      loginUseCase.execute.mockResolvedValue(authResultStub as any);

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(validBody)
        .expect(200);

      expect(body.data).toMatchObject({
        access_token: ACCESS_TOKEN,
        refresh_token: REFRESH_TOKEN,
        user: { email: userStub.email, full_name: userStub.full_name, role: userStub.role },
      });
    });

    it('401 — propagates UnauthorizedException on invalid credentials', async () => {
      loginUseCase.execute.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(validBody)
        .expect(401);
    });

    it('401 — propagates UnauthorizedException when account is disabled', async () => {
      loginUseCase.execute.mockRejectedValue(new UnauthorizedException('Account is disabled'));

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(validBody)
        .expect(401);
    });

    it('400 — rejects a missing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'SecurePass@2024' })
        .expect(400);

      expect(loginUseCase.execute).not.toHaveBeenCalled();
    });

    it('400 — rejects an invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email', password: 'SecurePass@2024' })
        .expect(400);
    });

    it('400 — rejects a password shorter than 6 characters', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'ahmed@example.com', password: '123' })
        .expect(400);
    });

    it('whitelist — strips unknown fields before calling the use case', async () => {
      loginUseCase.execute.mockResolvedValue(authResultStub as any);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ ...validBody, role: 'ADMIN', injected: 'evil' })
        .expect(200);

      const callArg = loginUseCase.execute.mock.calls[0][0];
      expect(callArg).not.toHaveProperty('role');
      expect(callArg).not.toHaveProperty('injected');
    });
  });

  // -------------------------------------------------------------------------
  // POST /auth/signup
  // -------------------------------------------------------------------------

  describe('POST /auth/signup', () => {
    const validBody = {
      full_name: 'Ahmed Al-Masri',
      email: 'ahmed@example.com',
      password: 'SecurePass@2024',
      national_id: '123456789',
      phone: '+970591234567',
      city: 'GAZA',
    };

    it('201 — returns tokens and user on successful registration', async () => {
      signupUseCase.execute.mockResolvedValue(authResultStub as any);

      const { body } = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(validBody)
        .expect(201);

      expect(body.data).toMatchObject({
        access_token: ACCESS_TOKEN,
        user: { role: UserRole.CITIZEN },
      });
    });

    it('409 — propagates ConflictException on duplicate national_id', async () => {
      signupUseCase.execute.mockRejectedValue(
        new ConflictException('A user with this national_id already exists'),
      );

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(validBody)
        .expect(409);
    });

    it('400 — rejects missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: 'ahmed@example.com' })
        .expect(400);

      expect(signupUseCase.execute).not.toHaveBeenCalled();
    });

    it('400 — rejects invalid city enum value', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ ...validBody, city: 'INVALID_CITY' })
        .expect(400);
    });

    it('whitelist — strips role field so it cannot be set by the client', async () => {
      signupUseCase.execute.mockResolvedValue(authResultStub as any);

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ ...validBody, role: 'ADMIN' })
        .expect(201);

      const callArg = signupUseCase.execute.mock.calls[0][0];
      expect(callArg).not.toHaveProperty('role');
    });

    it('whitelist — strips employee_id field so it cannot be set at signup', async () => {
      signupUseCase.execute.mockResolvedValue(authResultStub as any);

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ ...validBody, employee_id: 'EMP-00142' })
        .expect(201);

      const callArg = signupUseCase.execute.mock.calls[0][0];
      expect(callArg).not.toHaveProperty('employee_id');
    });
  });

  // -------------------------------------------------------------------------
  // POST /auth/refresh
  // -------------------------------------------------------------------------

  describe('POST /auth/refresh', () => {
    it('200 — returns new token pair on valid refresh token', async () => {
      refreshTokensUseCase.execute.mockResolvedValue(authResultStub as any);

      const { body } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: REFRESH_TOKEN })
        .expect(200);

      expect(body.data).toMatchObject({ access_token: ACCESS_TOKEN });
    });

    it('401 — propagates UnauthorizedException on invalid refresh token', async () => {
      refreshTokensUseCase.execute.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: 'bad.token' })
        .expect(401);
    });

    it('400 — rejects a missing refresh_token field', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400);

      expect(refreshTokensUseCase.execute).not.toHaveBeenCalled();
    });

    it('passes only the refresh_token string to the use case', async () => {
      refreshTokensUseCase.execute.mockResolvedValue(authResultStub as any);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: REFRESH_TOKEN })
        .expect(200);

      expect(refreshTokensUseCase.execute).toHaveBeenCalledWith(REFRESH_TOKEN);
    });
  });

  // -------------------------------------------------------------------------
  // POST /auth/forgot-password
  // -------------------------------------------------------------------------

  describe('POST /auth/forgot-password', () => {
    it('200 — returns the safe message', async () => {
      forgotPasswordUseCase.execute.mockResolvedValue({
        message: 'If an account exists with this identifier, an OTP has been sent',
      });

      const { body } = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ identifier: '+970591234567' })
        .expect(200);

      expect(body.data.message).toBe(
        'If an account exists with this identifier, an OTP has been sent',
      );
    });

    it('400 — propagates BadRequestException during cooldown', async () => {
      forgotPasswordUseCase.execute.mockRejectedValue(
        new BadRequestException('Please wait 45 seconds before requesting a new code.'),
      );

      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ identifier: '+970591234567' })
        .expect(400);
    });

    it('400 — rejects a missing identifier field', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({})
        .expect(400);

      expect(forgotPasswordUseCase.execute).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // POST /auth/verify-otp
  // -------------------------------------------------------------------------

  describe('POST /auth/verify-otp', () => {
    const validBody = { identifier: '+970591234567', code: '1234' };

    it('200 — returns reset_token on valid OTP', async () => {
      verifyOtpUseCase.execute.mockResolvedValue({
        resetToken: RESET_TOKEN,
        message: 'OTP verified successfully. Use the reset token to change your password.',
      });

      const { body } = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send(validBody)
        .expect(200);

      expect(body.data).toMatchObject({ reset_token: RESET_TOKEN });
    });

    it('404 — propagates NotFoundException when user is not found', async () => {
      verifyOtpUseCase.execute.mockRejectedValue(new NotFoundException('User not found'));

      await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send(validBody)
        .expect(404);
    });

    it('400 — propagates BadRequestException on invalid or expired OTP', async () => {
      verifyOtpUseCase.execute.mockRejectedValue(new BadRequestException('Invalid code'));

      await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send(validBody)
        .expect(400);
    });

    it('400 — rejects a code shorter than 4 characters', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ identifier: '+970591234567', code: '12' })
        .expect(400);

      expect(verifyOtpUseCase.execute).not.toHaveBeenCalled();
    });

    it('400 — rejects missing identifier', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ code: '1234' })
        .expect(400);
    });
  });

  // -------------------------------------------------------------------------
  // POST /auth/reset-password
  // -------------------------------------------------------------------------

  describe('POST /auth/reset-password', () => {
    const validBody = { reset_token: RESET_TOKEN, new_password: 'NewPass@2024' };

    it('200 — returns success message on valid reset', async () => {
      resetPasswordUseCase.execute.mockResolvedValue({
        message: 'Password has been reset successfully',
      });

      const { body } = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(validBody)
        .expect(200);

      expect(body.data.message).toBe('Password has been reset successfully');
    });

    it('401 — propagates UnauthorizedException on invalid reset token', async () => {
      resetPasswordUseCase.execute.mockRejectedValue(
        new UnauthorizedException('Invalid or expired reset token'),
      );

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(validBody)
        .expect(401);
    });

    it('404 — propagates NotFoundException when user does not exist', async () => {
      resetPasswordUseCase.execute.mockRejectedValue(new NotFoundException('User not found'));

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(validBody)
        .expect(404);
    });

    it('400 — rejects a new_password shorter than 6 characters', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ reset_token: RESET_TOKEN, new_password: '123' })
        .expect(400);

      expect(resetPasswordUseCase.execute).not.toHaveBeenCalled();
    });

    it('400 — rejects a missing reset_token', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ new_password: 'NewPass@2024' })
        .expect(400);
    });
  });
});
