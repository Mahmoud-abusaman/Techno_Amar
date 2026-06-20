import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import {
  ImageKitImageFileDto,
  ImageKitPdfFileDto,
} from '@uploads/presentation/dto/imagekit-file.dto';

export class CitizenVerificationDocumentsDto {
  @ApiProperty({
    type: ImageKitPdfFileDto,
    description: 'PDF copy of the national ID',
  })
  @ValidateNested()
  @Type(() => ImageKitPdfFileDto)
  id_document: ImageKitPdfFileDto;

  @ApiProperty({
    type: ImageKitImageFileDto,
    description: 'Selfie photo holding the national ID',
  })
  @ValidateNested()
  @Type(() => ImageKitImageFileDto)
  id_selfie: ImageKitImageFileDto;
}
