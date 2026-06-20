import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CitizenVerificationDocumentsDto } from '@uploads/presentation/dto/citizen-verification-documents.dto';

export class ResubmitVerificationDocumentsDto {
  @ApiProperty({
    type: CitizenVerificationDocumentsDto,
    description:
      'Re-upload ID document and selfie after rejection. Resets account to PENDING_VERIFICATION.',
  })
  @ValidateNested()
  @Type(() => CitizenVerificationDocumentsDto)
  verification_documents: CitizenVerificationDocumentsDto;
}
