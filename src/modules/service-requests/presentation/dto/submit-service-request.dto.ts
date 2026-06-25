import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BigIntId } from '@shared/common/decorators/bigint-id.decorator';

export class SubmitRequestDocumentDto {
  @ApiProperty({ example: '1', type: String, description: 'Required document ID (numeric string)' })
  @BigIntId()
  required_document_id: bigint;

  @ApiProperty({ example: 'National ID Copy.pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/\.pdf$/i, { message: 'file_name must have a .pdf extension' })
  file_name: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['application/pdf'], { message: 'Only PDF files (application/pdf) are allowed' })
  file_type: string;

  @ApiProperty({ example: 'https://ik.imagekit.io/TechnoAmar/docs/id.pdf' })
  @IsUrl()
  @MaxLength(2000)
  file_url: string;

  @ApiProperty({ example: 'file_abc123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  file_id: string;

  @ApiPropertyOptional({ example: '/service-requests/id.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  file_path?: string;
}

export class SubmitServiceRequestDto {
  @ApiProperty({ example: '1', type: String, description: 'Service ID (numeric string)' })
  @BigIntId()
  service_id: bigint;

  @ApiPropertyOptional({ type: [SubmitRequestDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitRequestDocumentDto)
  documents?: SubmitRequestDocumentDto[];
}
