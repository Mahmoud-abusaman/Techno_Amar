import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const ALLOWED_MIME_TYPES = new Set(['application/pdf']);

@Injectable()
export class ImageKitFileValidator {
  private readonly urlEndpoint: string;

  constructor(private readonly config: ConfigService) {
    this.urlEndpoint =
      this.config.get<string>('app.imagekit.urlEndpoint') ?? '';
  }

  isValidFileUrl(fileUrl: string): boolean {
    if (!this.urlEndpoint) return false;
    const normalizedEndpoint = this.urlEndpoint.replace(/\/$/, '');
    return fileUrl.startsWith(`${normalizedEndpoint}/`);
  }

  isAllowedMimeType(fileType: string): boolean {
    return ALLOWED_MIME_TYPES.has(fileType.toLowerCase());
  }
}
