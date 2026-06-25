import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BigIntId, BigIntIdOptional } from '@shared/common/decorators/bigint-id.decorator';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';

export class CreateServiceTaskDto {
  @ApiProperty({ example: 'Initial Review' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Review submitted documents' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    example: '2',
    type: String,
    description: 'Section ID (numeric string)',
  })
  @BigIntId()
  section_id: bigint;

  @ApiPropertyOptional({
    example: 1,
    description: 'Position in workflow; auto-assigned if omitted',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  task_order?: number;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estimated_time_hours: number;
}

export class UpdateServiceTaskDto extends PartialType(
  OmitType(CreateServiceTaskDto, ['section_id'] as const),
) {
  @ApiPropertyOptional({
    example: '2',
    type: String,
    description: 'Section ID (numeric string)',
  })
  @BigIntIdOptional()
  section_id?: bigint;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class ServiceTaskResponseDto {
  @ApiProperty({ example: '1' }) id: string;
  @ApiProperty({ example: '1' }) service_id: string;
  @ApiProperty({ example: '2' }) section_id: string;
  @ApiProperty({ example: 'Initial Review' }) name: string;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty({ example: 1 }) task_order: number;
  @ApiProperty({ example: 4 }) estimated_time_hours: number;
  @ApiProperty({ example: true }) is_active: boolean;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}
