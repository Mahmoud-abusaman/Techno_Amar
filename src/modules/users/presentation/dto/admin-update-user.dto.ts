import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { AccountStatus } from '@/generated/prisma/enums';

export class AdminUpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['role'] as const),
) {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_verified?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ enum: AccountStatus })
  @IsEnum(AccountStatus)
  @IsOptional()
  account_status?: AccountStatus;

  @ApiPropertyOptional({
    description: 'Section ID for employees/managers',
    example: '1',
    type: String,
  })
  @IsString()
  @IsOptional()
  section_id?: string;
}
