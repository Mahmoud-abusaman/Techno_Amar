import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { GazaCities, UserRole } from '@/generated/prisma/enums';
import { SEED } from '@shared/common/constants/seed-examples';

export class CreateUserDto {
  @ApiProperty({ example: SEED.citizen.full_name })
  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @ApiProperty({ example: SEED.citizen.email, format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: SEED.citizen.password, minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ example: SEED.citizen.national_id })
  @IsString()
  @IsOptional()
  national_id?: string;

  @ApiPropertyOptional({ example: SEED.employee.employee_id })
  @IsString()
  @IsOptional()
  employee_id?: string;

  @ApiPropertyOptional({ example: SEED.citizen.phone, format: 'phone' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Al-Rimal, Gaza City' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ enum: GazaCities, example: SEED.citizen.city })
  @IsEnum(GazaCities)
  city!: GazaCities;

  @ApiProperty({ enum: UserRole, example: SEED.citizen.role })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({
    description: 'Section ID for employees and department managers',
    example: '1',
  })
  @IsString()
  @IsOptional()
  section_id?: string;
}
