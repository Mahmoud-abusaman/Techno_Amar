import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from '../../users/dto/create-user.dto';

export class SignupDto extends OmitType(CreateUserDto, ['role', 'employee_id'] as const) {}

class UserResponseDto {
  @ApiProperty({ example: 'a3f8c2d1-4e5b-4f6a-9c7d-8e1f2a3b4c5d' }) id: string;
  @ApiProperty({ example: 'user@example.com' }) email: string;
  @ApiProperty({ example: 'Ahmed Al-Masri' }) full_name: string;
  @ApiProperty({ example: 'CITIZEN', enum: ['ADMIN', 'CITIZEN', 'EMPLOYEE', 'DEPARTMENT_MANAGER'] }) role: string;
}

export class SignupResponseDto {
  @ApiProperty() access_token: string;
  @ApiProperty() refresh_token: string;
  @ApiProperty() expires_at: Date;
  @ApiProperty({ type: UserResponseDto }) user: UserResponseDto;
}
