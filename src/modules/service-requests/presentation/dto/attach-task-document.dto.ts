import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class AttachTaskDocumentDto {
  @ApiProperty({ example: 'Inspection Report.pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/\.pdf$/i, { message: 'file_name must have a .pdf extension' })
  file_name: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['application/pdf'], {
    message: 'Only PDF files (application/pdf) are allowed',
  })
  file_type: string;

  @ApiProperty({
    example: 'https://ik.imagekit.io/TechnoAmar/tasks/inspection-report.pdf',
  })
  @IsUrl()
  @MaxLength(2000)
  file_url: string;

  @ApiProperty({ example: 'file_abc123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  file_id: string;

  @ApiPropertyOptional({ example: '/tasks/inspection-report.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  file_path?: string;
}
