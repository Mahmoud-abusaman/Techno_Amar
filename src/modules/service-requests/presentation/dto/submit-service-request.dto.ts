import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitRequestDocumentDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  required_document_id: number;

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
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  service_id: number;

  @ApiPropertyOptional({ type: [SubmitRequestDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitRequestDocumentDto)
  documents?: SubmitRequestDocumentDto[];
}
