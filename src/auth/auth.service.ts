import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UsersService } from 'src/users/users.service';
import { OtpService } from 'src/otp/otp.service';
import { OtpType } from 'generated/prisma/enums';
import { SideEffectQueue } from 'src/common/utils/side-effects';
import { IHashProvider } from './providers/interfaces/hash-provider.interface';
import {
  ITokenProvider,
  IRefreshTokenProvider,
  TokenPayload,
  RefreshTokenPayload,
} from './providers/interfaces/token-provider.interface';
import { IPasswordResetProvider } from './providers/interfaces/password-reset.interface';
import {
  ForgotPasswordRequestDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_at: Date;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersService) private readonly usersService: UsersService,
    @Inject(OtpService) private readonly otpService: OtpService,
    @Inject(IHashProvider) private readonly hashProvider: IHashProvider,
    @Inject(ITokenProvider) private readonly tokenProvider: ITokenProvider,
    @Inject(IRefreshTokenProvider)
    private readonly refreshTokenProvider: IRefreshTokenProvider,
    @Inject(IPasswordResetProvider)
    private readonly passwordResetProvider: IPasswordResetProvider,
  ) {}

  private async generateTokenPair(user: {
    id: bigint;
    email: string;
    role: string;
  }): Promise<TokenPair> {
    const accessPayload: TokenPayload = {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: user.id.toString(),
      tokenId: randomUUID(),
    };

    const [access_token, refreshResult] = await Promise.all([
      this.tokenProvider.generate(accessPayload),
      this.refreshTokenProvider.generate(refreshPayload),
    ]);

    return {
      access_token,
      refresh_token: refreshResult.token,
      expires_at: refreshResult.expiresAt,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.hashProvider.compare(
      dto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is disabled');
    }

    const tokens = await this.generateTokenPair(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    };
  }

  async signup(dto: SignupDto) {
    try {
      const user = await this.usersService.create(dto);

      const tokens = await this.generateTokenPair(user);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.refreshTokenProvider.verify(refreshToken);
      const user = await this.usersService.findOne(BigInt(payload.sub));

      if (!user || !user.is_active) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Revoke old refresh token
      await this.refreshTokenProvider.revoke(payload.tokenId);

      // Generate new token pair
      const tokens = await this.generateTokenPair(user);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(dto: ForgotPasswordRequestDto) {
    // Find user by phone, national_id, or employee_id
    const user = await this.usersService.findByIdentifier(dto.identifier);

    // Always return the same message to prevent user enumeration
    if (!user) {
      return {
        message:
          'If an account exists with this identifier, an OTP has been sent',
      };
    }

    // Create OTP using the OtpService
    const sideEffects = new SideEffectQueue();

    // Queue SMS sending as side effect
    sideEffects.add('Send OTP SMS', async () => {
      const code = await this.otpService.createOtpRecord(
        user.id,
        OtpType.password_reset,
      );
      console.log(`[SMS] OTP for user ${user.id}: ${code}`);
      // TODO: Integrate with actual SMS service
    });

    // Run side effects asynchronously (don't block response)
    sideEffects.runAll().catch(console.error);

    return {
      message:
        'If an account exists with this identifier, an OTP has been sent',
    };
  }

  async verifyOtpAndGetResetToken(dto: VerifyOtpDto) {
    // Find user by identifier
    const user = await this.usersService.findByIdentifier(dto.identifier);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate OTP
    const validation = await this.otpService.validateOtp(
      user.id,
      dto.code,
      OtpType.password_reset,
    );

    if (!validation.valid) {
      throw new BadRequestException(validation.reason || 'Invalid OTP');
    }

    // Generate password reset token (short-lived, single-use)
    const resetToken = await this.passwordResetProvider.generate(
      user.id.toString(),
    );

    return {
      reset_token: resetToken,
      message:
        'OTP verified successfully. Use the reset token to change your password.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    // Verify the reset token
    const payload = await this.passwordResetProvider.verify(dto.reset_token);

    // Update user password
    const user = await this.usersService.findOne(BigInt(payload.sub));
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await this.hashProvider.hash(dto.new_password);
    await this.usersService.updatePassword(user.id, hashedPassword);

    return {
      message: 'Password has been reset successfully',
    };
  }
}
