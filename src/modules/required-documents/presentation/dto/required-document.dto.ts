import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { DocumentRequirementType } from '@/generated/prisma/enums';

export class CreateRequiredDocumentDto {
  @ApiProperty({ example: 'National ID Copy' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Clear scan of both sides' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ enum: DocumentRequirementType, example: 'MANDATORY' })
  @IsEnum(DocumentRequirementType)
  type: DocumentRequirementType;
}

export class UpdateRequiredDocumentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: DocumentRequirementType })
  @IsOptional()
  @IsEnum(DocumentRequirementType)
  type?: DocumentRequirementType;
}
