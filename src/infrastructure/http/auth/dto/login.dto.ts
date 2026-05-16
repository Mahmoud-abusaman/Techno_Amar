import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: '987654321',
    description: 'national_id for citizens, employee_id for employees/managers',
  })
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}

export class UserResponseDto {
  @ApiProperty({ example: '1' }) id: string;
  @ApiProperty({ example: 'user@example.com' }) email: string;
  @ApiProperty({ example: 'Ahmed Al-Masri' }) full_name: string;
  @ApiProperty({ example: 'CITIZEN', enum: ['ADMIN', 'CITIZEN', 'EMPLOYEE', 'DEPARTMENT_MANAGER'] })
  role: string;
}

export class LoginResponseDto {
  @ApiProperty() access_token: string;
  @ApiProperty() refresh_token: string;
  @ApiProperty() expires_at: Date;
  @ApiProperty({ type: UserResponseDto }) user: UserResponseDto;
}
