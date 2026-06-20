import { BadRequestException } from '@nestjs/common';
import { ImageKitFileValidator } from '@uploads/application/imagekit-file.validator';
import { CitizenVerificationDocumentsInput } from '@uploads/presentation/dto/imagekit-file.dto';

export function validateCitizenVerificationDocuments(
  documents: CitizenVerificationDocumentsInput,
  fileValidator: ImageKitFileValidator,
): void {
  validatePdfFile(documents.id_document, fileValidator, 'ID document');
  validateImageFile(documents.id_selfie, fileValidator, 'ID selfie');
}

export function validatePdfFile(
  file: { file_url: string; file_type: string },
  fileValidator: ImageKitFileValidator,
  label = 'Document',
): void {
  if (!fileValidator.isValidFileUrl(file.file_url)) {
    throw new BadRequestException(
      `${label} URL must be hosted on the configured ImageKit endpoint`,
    );
  }
  if (!fileValidator.isAllowedPdfMimeType(file.file_type)) {
    throw new BadRequestException(`${label} must be a PDF file`);
  }
}

export function validateImageFile(
  file: { file_url: string; file_type: string },
  fileValidator: ImageKitFileValidator,
  label = 'Image',
): void {
  if (!fileValidator.isValidFileUrl(file.file_url)) {
    throw new BadRequestException(
      `${label} URL must be hosted on the configured ImageKit endpoint`,
    );
  }
  if (!fileValidator.isAllowedImageMimeType(file.file_type)) {
    throw new BadRequestException(
      `${label} must be a JPEG, PNG, or WebP image`,
    );
  }
}
