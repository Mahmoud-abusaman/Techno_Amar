import { ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from '../../users/dto/create-user.dto';

export class SignupDto extends CreateUserDto {}

class UserResponseDto {
  @ApiProperty({ example: '1' }) id: string;
  @ApiProperty({ example: 'user@example.com' }) email: string;
  @ApiProperty({ example: 'John Doe' }) full_name: string;
  @ApiProperty({ example: 'CITIZEN', enum: ['ADMIN', 'CITIZEN', 'EMPLOYEE', 'DEPARTMENT_MANAGER'] }) role: string;
}

export class SignupResponseDto {
  @ApiProperty() access_token: string;
  @ApiProperty() refresh_token: string;
  @ApiProperty() expires_at: Date;
  @ApiProperty({ type: UserResponseDto }) user: UserResponseDto;
}
