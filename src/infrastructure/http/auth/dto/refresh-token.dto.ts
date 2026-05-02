import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'JWT refresh token', example: 'eyJhbGciOiJIUzI1NiIs...' })
  @IsString()
  refresh_token: string;
}

class UserResponseDto {
  @ApiProperty({ example: '1' }) id: string;
  @ApiProperty({ example: 'user@example.com' }) email: string;
  @ApiProperty({ example: 'John Doe' }) full_name: string;
  @ApiProperty({ example: 'CITIZEN', enum: ['ADMIN', 'CITIZEN', 'EMPLOYEE', 'DEPARTMENT_MANAGER'] }) role: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty() access_token: string;
  @ApiProperty() refresh_token: string;
  @ApiProperty() expires_at: Date;
  @ApiProperty({ type: UserResponseDto }) user: UserResponseDto;
}
