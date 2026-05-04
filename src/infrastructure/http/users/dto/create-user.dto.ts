import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { GazaCities, UserRole } from 'generated/prisma/enums';

export class CreateUserDto {
  @ApiProperty({ example: 'Ahmed Al-Masri' })
  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @ApiProperty({ example: 'ahmed.almasri@example.com', format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass@2024', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsString()
  @IsOptional()
  national_id?: string;

  @ApiPropertyOptional({ example: 'EMP-00142' })
  @IsString()
  @IsOptional()
  employee_id?: string;

  @ApiPropertyOptional({ example: '+970591234567', format: 'phone' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Al-Rimal, Gaza City' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ enum: GazaCities, example: 'GAZA' })
  @IsEnum(GazaCities)
  city!: GazaCities;

  @ApiProperty({ enum: UserRole, example: 'CITIZEN' })
  @IsEnum(UserRole)
  role!: UserRole;
}
