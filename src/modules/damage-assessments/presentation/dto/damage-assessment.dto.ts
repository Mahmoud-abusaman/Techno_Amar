import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  DamageAssessmentStatus,
  DamageSeverity,
} from '@/generated/prisma/enums';

export class SubmitDamageAssessmentDto {
  @ApiProperty({ example: 'Al-Rimal Street, Gaza City' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  location: string;

  @ApiProperty({
    example: 'Roof damage caused by recent shelling, water leaking inside.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @ApiProperty({ enum: DamageSeverity, example: DamageSeverity.MODERATE })
  @IsEnum(DamageSeverity)
  damage_severity: DamageSeverity;
}

export class DamageAssessmentFiltersDto {
  @ApiPropertyOptional({ enum: DamageAssessmentStatus })
  @IsOptional()
  @IsEnum(DamageAssessmentStatus)
  status?: DamageAssessmentStatus;

  @ApiPropertyOptional({ enum: DamageSeverity })
  @IsOptional()
  @IsEnum(DamageSeverity)
  damage_severity?: DamageSeverity;

  @ApiPropertyOptional({ example: 'Gaza' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;
}
