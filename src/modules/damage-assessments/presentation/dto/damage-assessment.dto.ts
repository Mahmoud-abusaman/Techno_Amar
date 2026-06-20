import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DamageAssessmentStatus,
  DamageSeverity,
} from '@/generated/prisma/enums';
import { ImageKitImageFileDto } from '@uploads/presentation/dto/imagekit-file.dto';

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

  @ApiProperty({
    type: [ImageKitImageFileDto],
    description: 'Photos of the damage (JPEG, PNG, or WebP)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImageKitImageFileDto)
  images: ImageKitImageFileDto[];
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
