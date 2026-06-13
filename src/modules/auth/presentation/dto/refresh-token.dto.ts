import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { SEED } from '@shared/common/constants/seed-examples';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'JWT refresh token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhM2Y4YzJkMSIsImlhdCI6MTcxNjQwMDAwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  @IsString()
  refresh_token: string;
}

class UserResponseDto {
  @ApiProperty({ example: SEED.citizen.id }) id: string;
  @ApiProperty({ example: SEED.citizen.email }) email: string;
  @ApiProperty({ example: SEED.citizen.full_name }) full_name: string;
  @ApiProperty({
    example: SEED.citizen.role,
    enum: ['ADMIN', 'CITIZEN', 'EMPLOYEE', 'DEPARTMENT_MANAGER'],
  })
  role: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty() access_token: string;
  @ApiProperty() refresh_token: string;
  @ApiProperty() expires_at: Date;
  @ApiProperty({ type: UserResponseDto }) user: UserResponseDto;
}
