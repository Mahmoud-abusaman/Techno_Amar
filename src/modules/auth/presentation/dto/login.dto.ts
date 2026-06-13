import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { SEED } from '@shared/common/constants/seed-examples';

export class LoginDto {
  @ApiProperty({
    example: SEED.citizen.national_id,
    description:
      'national_id (citizen), employee_id (employee/manager/admin), or phone — e.g. seeded citizen 123456789, employee EMP-001',
  })
  @IsString()
  identifier: string;

  @ApiProperty({ example: SEED.citizen.password, minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}

export class UserResponseDto {
  @ApiProperty({ example: SEED.citizen.id }) id: string;
  @ApiProperty({ example: SEED.citizen.email }) email: string;
  @ApiProperty({ example: SEED.citizen.full_name }) full_name: string;
  @ApiProperty({
    example: SEED.citizen.role,
    enum: ['ADMIN', 'CITIZEN', 'EMPLOYEE', 'DEPARTMENT_MANAGER'],
  })
  role: string;
}

export class LoginResponseDto {
  @ApiProperty() access_token: string;
  @ApiProperty() refresh_token: string;
  @ApiProperty() expires_at: Date;
  @ApiProperty({ type: UserResponseDto }) user: UserResponseDto;
}
