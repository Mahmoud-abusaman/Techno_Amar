import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsBoolean } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Civil Engineering', description: 'Unique department name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Handles infrastructure and civil projects' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class DepartmentResponseDto {
  @ApiProperty({ example: '1' }) id: string;
  @ApiProperty({ example: 'Civil Engineering' }) name: string;
  @ApiPropertyOptional({ example: 'Handles infrastructure and civil projects' }) description: string | null;
  @ApiProperty({ example: true }) is_active: boolean;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}
