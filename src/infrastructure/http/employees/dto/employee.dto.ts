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
import { Transform } from 'class-transformer';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Ahmed Al-Masri' })
  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @ApiProperty({ example: 'ahmed.almasri@municipality.gov' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass@2024', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'EMP-00142' })
  @IsString()
  @IsNotEmpty()
  employee_id!: string;

  @ApiPropertyOptional({ example: '+970591234567' })
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

  @ApiProperty({ enum: ['EMPLOYEE', 'DEPARTMENT_MANAGER'], example: 'EMPLOYEE' })
  @IsEnum(['EMPLOYEE', 'DEPARTMENT_MANAGER'])
  role!: 'EMPLOYEE' | 'DEPARTMENT_MANAGER';

  @ApiProperty({ example: '1' })
  @Transform(({ value }) => BigInt(value))
  section_id!: bigint;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ example: 'Ahmed Al-Masri' })
  @IsString()
  @IsOptional()
  full_name?: string;

  @ApiPropertyOptional({ example: '+970591234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Al-Rimal, Gaza City' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '2' })
  @Transform(({ value }) => (value !== undefined ? BigInt(value) : undefined))
  @IsOptional()
  section_id?: bigint;

  @ApiPropertyOptional({ enum: ['EMPLOYEE', 'DEPARTMENT_MANAGER'] })
  @IsEnum(['EMPLOYEE', 'DEPARTMENT_MANAGER'])
  @IsOptional()
  role?: 'EMPLOYEE' | 'DEPARTMENT_MANAGER';
}

export class EmployeeResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() full_name: string;
  @ApiProperty() email: string;
  @ApiProperty() employee_id: string | null;
  @ApiProperty() role: string;
  @ApiProperty() department_id: string | null;
  @ApiProperty() section_id: string | null;
  @ApiProperty() is_active: boolean;
  @ApiProperty() created_at: Date;
}
