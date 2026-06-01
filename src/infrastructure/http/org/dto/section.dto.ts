import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsBoolean } from 'class-validator';

export class CreateSectionDto {
  @ApiProperty({ example: 'Road Maintenance', description: 'Section name (unique within department)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Responsible for road repairs and maintenance' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateSectionDto extends PartialType(OmitType(CreateSectionDto, [] as const)) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class SectionResponseDto {
  @ApiProperty({ example: '1' }) id: string;
  @ApiProperty({ example: '2' }) department_id: string;
  @ApiProperty({ example: 'Road Maintenance' }) name: string;
  @ApiPropertyOptional({ example: 'Responsible for road repairs' }) description: string | null;
  @ApiProperty({ example: true }) is_active: boolean;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}
