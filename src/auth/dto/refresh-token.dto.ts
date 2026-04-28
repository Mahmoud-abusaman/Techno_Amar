import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'JWT refresh token', example: 'eyJhbGciOiJIUzI1NiIs...' })
  @IsString()
  refresh_token: string;
}

class UserResponseDto {
  @ApiProperty({ example: '1', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  full_name: string;

  @ApiProperty({ example: 'CITIZEN', enum: ['ADMIN', 'CITIZEN', 'EMPLOYEE', 'DEPARTMENT_MANAGER'] })
  role: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty({ description: 'New JWT access token' })
  access_token: string;

  @ApiProperty({ description: 'New JWT refresh token' })
  refresh_token: string;

  @ApiProperty({ description: 'Token expiration date' })
  expires_at: Date;

  @ApiProperty({ type: UserResponseDto, description: 'User information' })
  user: UserResponseDto;
}
