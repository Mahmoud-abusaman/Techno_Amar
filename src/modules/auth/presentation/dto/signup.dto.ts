import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from '@users/presentation/dto/create-user.dto';
import { SEED } from '@shared/common/constants/seed-examples';
import { AccountStatus } from '@/generated/prisma/enums';

export class SignupDto extends OmitType(CreateUserDto, [
  'role',
  'employee_id',
] as const) {}

class SignupUserResponseDto {
  @ApiProperty({ example: SEED.citizen.id }) id: string;
  @ApiProperty({ example: SEED.citizen.email }) email: string;
  @ApiProperty({ example: SEED.citizen.full_name }) full_name: string;
  @ApiProperty({
    example: SEED.citizen.role,
    enum: ['ADMIN', 'CITIZEN', 'EMPLOYEE', 'DEPARTMENT_MANAGER'],
  })
  role: string;
  @ApiProperty({
    example: AccountStatus.PENDING_VERIFICATION,
    enum: AccountStatus,
  })
  account_status: AccountStatus;
}

export class SignupResponseDto {
  @ApiProperty({
    example:
      'Registration submitted successfully. Your account is pending admin verification.',
  })
  message: string;
  @ApiProperty({ type: SignupUserResponseDto }) user: SignupUserResponseDto;
}
