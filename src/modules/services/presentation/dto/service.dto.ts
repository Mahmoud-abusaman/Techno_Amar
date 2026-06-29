import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BigIntId } from '@shared/common/decorators/bigint-id.decorator';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsBoolean,
  IsNumber,
  IsInt,
  Min,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { ServiceStatus } from '@/generated/prisma/enums';

export class CreateServiceWorkflowTaskDto {
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

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estimated_time_hours: number;
}

export class CreateServiceDto {
  @ApiProperty({
    example: 'Building Permit',
    description: 'Unique service name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Apply for a new building permit' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    example: '1',
    type: String,
    description: 'Responsible department ID (numeric string)',
  })
  @BigIntId()
  department_id: bigint;

  @ApiProperty({ example: 50.0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fee: number;

  @ApiProperty({ example: 14 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estimated_processing_days: number;

  @ApiProperty({
    type: [CreateServiceWorkflowTaskDto],
    description: 'Ordered workflow tasks for this service',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateServiceWorkflowTaskDto)
  workflow_tasks: CreateServiceWorkflowTaskDto[];
}

export class UpdateServiceDto extends PartialType(
  OmitType(CreateServiceDto, ['workflow_tasks'] as const),
) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ enum: ServiceStatus })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;
}

export class ServiceResponseDto {
  @ApiProperty({ example: '1' }) id: string;
  @ApiProperty({ example: 'Building Permit' }) name: string;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty({ example: '1' }) department_id: string;
  @ApiProperty({ example: 50.0 }) fee: number;
  @ApiProperty({ example: 14 }) estimated_processing_days: number;
  @ApiProperty({ enum: ServiceStatus }) status: ServiceStatus;
  @ApiProperty({ example: '1' }) created_by: string;
  @ApiPropertyOptional() published_at: Date | null;
  @ApiProperty({ example: true }) is_active: boolean;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class ServiceTaskSummaryResponseDto {
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

export class ServiceWithTasksResponseDto extends ServiceResponseDto {
  @ApiProperty({ type: [ServiceTaskSummaryResponseDto] })
  workflow_tasks: ServiceTaskSummaryResponseDto[];
}
