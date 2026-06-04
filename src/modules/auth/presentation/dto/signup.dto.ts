import { ApiProperty, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from '@users/presentation/dto/create-user.dto';
import { SEED } from '@shared/common/constants/seed-examples';

export class SignupDto extends OmitType(CreateUserDto, [
  'role',
  'employee_id',
] as const) {}

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

export class SignupResponseDto {
  @ApiProperty() access_token: string;
  @ApiProperty() refresh_token: string;
  @ApiProperty() expires_at: Date;
  @ApiProperty({ type: UserResponseDto }) user: UserResponseDto;
}
