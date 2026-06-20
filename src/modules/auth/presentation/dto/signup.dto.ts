import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CreateUserDto } from '@users/presentation/dto/create-user.dto';
import { SEED } from '@shared/common/constants/seed-examples';
import { AccountStatus } from '@/generated/prisma/enums';
import { CitizenVerificationDocumentsDto } from '@uploads/presentation/dto/citizen-verification-documents.dto';

export class SignupDto extends OmitType(CreateUserDto, [
  'role',
  'employee_id',
] as const) {
  @ApiProperty({ type: CitizenVerificationDocumentsDto })
  @ValidateNested()
  @Type(() => CitizenVerificationDocumentsDto)
  verification_documents: CitizenVerificationDocumentsDto;
}

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
