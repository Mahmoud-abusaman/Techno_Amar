import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { GazaCities } from '@/generated/prisma/enums';
import { SEED } from '@shared/common/constants/seed-examples';

export class UpdateMyProfileDto {
  @ApiPropertyOptional({ example: SEED.citizen.full_name })
  @IsString()
  @IsOptional()
  full_name?: string;

  @ApiPropertyOptional({ example: SEED.citizen.phone })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Al-Rimal, Gaza City' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ enum: GazaCities, example: SEED.citizen.city })
  @IsEnum(GazaCities)
  @IsOptional()
  city?: GazaCities;

  @ApiPropertyOptional({ example: SEED.citizen.password, minLength: 6 })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;
}
