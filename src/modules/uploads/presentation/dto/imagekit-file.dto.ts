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

export class ImageKitPdfFileDto {
  @ApiProperty({ example: 'National ID Copy.pdf' })
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

  @ApiProperty({ example: 'https://ik.imagekit.io/TechnoAmar/citizens/id.pdf' })
  @IsUrl()
  @MaxLength(2000)
  file_url: string;

  @ApiProperty({ example: 'file_abc123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  file_id: string;

  @ApiPropertyOptional({ example: '/citizens/verification/id.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  file_path?: string;
}

export class ImageKitImageFileDto {
  @ApiProperty({ example: 'Selfie with ID.jpg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/\.(jpe?g|png|webp)$/i, {
    message: 'file_name must have a .jpg, .jpeg, .png, or .webp extension',
  })
  file_name: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['image/jpeg', 'image/png', 'image/webp'], {
    message: 'Only JPEG, PNG, or WebP images are allowed',
  })
  file_type: string;

  @ApiProperty({
    example: 'https://ik.imagekit.io/TechnoAmar/citizens/selfie.jpg',
  })
  @IsUrl()
  @MaxLength(2000)
  file_url: string;

  @ApiProperty({ example: 'file_selfie123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  file_id: string;

  @ApiPropertyOptional({ example: '/citizens/verification/selfie.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  file_path?: string;
}

/** @deprecated Use ImageKitPdfFileDto */
export class ImageKitFileDto extends ImageKitPdfFileDto {}

export type ImageKitFileInput = {
  file_name: string;
  file_type: string;
  file_url: string;
  file_id: string;
  file_path?: string;
};

export type CitizenVerificationDocumentsInput = {
  id_document: ImageKitFileInput;
  id_selfie: ImageKitFileInput;
};
