import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '@/generated/prisma/enums';
import { ImageKitImageFileDto } from '@uploads/presentation/dto/imagekit-file.dto';

export class SubmitComplaintDto {
  @ApiProperty({ example: 'Delayed service response' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ enum: ComplaintCategory, example: ComplaintCategory.SERVICE_QUALITY })
  @IsEnum(ComplaintCategory)
  category: ComplaintCategory;

  @ApiPropertyOptional({ enum: ComplaintPriority, example: ComplaintPriority.MEDIUM })
  @IsOptional()
  @IsEnum(ComplaintPriority)
  priority?: ComplaintPriority;

  @ApiPropertyOptional({ example: 'Al-Rimal Street, Gaza City' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @ApiProperty({
    example: 'I submitted a building permit request 3 weeks ago with no update.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @ApiPropertyOptional({
    type: ImageKitImageFileDto,
    description: 'Optional supporting photo (upload to ImageKit first)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageKitImageFileDto)
  photo?: ImageKitImageFileDto;
}

export class ComplaintFiltersDto {
  @ApiPropertyOptional({ enum: ComplaintStatus })
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @ApiPropertyOptional({ enum: ComplaintCategory })
  @IsOptional()
  @IsEnum(ComplaintCategory)
  category?: ComplaintCategory;

  @ApiPropertyOptional({ enum: ComplaintPriority })
  @IsOptional()
  @IsEnum(ComplaintPriority)
  priority?: ComplaintPriority;
}
