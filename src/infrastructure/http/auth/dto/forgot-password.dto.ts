import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ForgotPasswordRequestDto {
  @ApiProperty({ description: 'Phone number, National ID, or Employee ID', example: '1234567890' })
  @IsString()
  identifier: string;
}

export class VerifyOtpDto {
  @ApiProperty({ description: 'Phone number, National ID, or Employee ID', example: '1234567890' })
  @IsString()
  identifier: string;

  @ApiProperty({ description: 'OTP code (4 digits)', example: '1234', minLength: 4 })
  @IsString()
  @MinLength(4)
  code: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Reset token received from verify-otp endpoint' })
  @IsString()
  reset_token: string;

  @ApiProperty({ description: 'New password (min 6 characters)', minLength: 6 })
  @IsString()
  @MinLength(6)
  new_password: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({ example: 'If an account exists with this identifier, an OTP has been sent' })
  message: string;
}

export class VerifyOtpResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...' }) reset_token: string;
  @ApiProperty({ example: 'OTP verified successfully. Use the reset token to change your password.' }) message: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({ example: 'Password has been reset successfully' }) message: string;
}
