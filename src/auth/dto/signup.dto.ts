import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

export class SignupDto extends CreateUserDto {}

class UserResponseDto {
  @ApiProperty({ example: '1', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  full_name: string;

  @ApiProperty({
    example: 'CITIZEN',
    enum: ['ADMIN', 'CITIZEN', 'EMPLOYEE', 'DEPARTMENT_MANAGER'],
  })
  role: string;
}

export class SignupResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  access_token: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refresh_token: string;

  @ApiProperty({ description: 'Token expiration date' })
  expires_at: Date;

  @ApiProperty({
    type: UserResponseDto,
    description: 'Created user information',
  })
  user: UserResponseDto;
}
