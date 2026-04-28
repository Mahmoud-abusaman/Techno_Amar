import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

// Request DTOs
export class ForgotPasswordRequestDto {
  @ApiProperty({
    description: 'Phone number, National ID, or Employee ID',
    example: '1234567890',
  })
  @IsString()
  identifier: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number, National ID, or Employee ID',
    example: '1234567890',
  })
  @IsString()
  identifier: string;

  @ApiProperty({
    description: 'OTP code (4 digits)',
    example: '0000',
    minLength: 4,
  })
  @IsString()
  @MinLength(4)
  code: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Reset token received from verify-otp endpoint',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  @IsString()
  reset_token: string;

  @ApiProperty({
    description: 'New password (min 6 characters)',
    example: 'newpassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  new_password: string;
}

// Response DTOs
export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'If an account exists with this identifier, an OTP has been sent',
  })
  message: string;
}

export class VerifyOtpResponseDto {
  @ApiProperty({
    description: 'Password reset JWT token (valid for 10 minutes)',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  reset_token: string;

  @ApiProperty({
    description: 'Response message',
    example:
      'OTP verified successfully. Use the reset token to change your password.',
  })
  message: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'Password has been reset successfully',
  })
  message: string;
}
