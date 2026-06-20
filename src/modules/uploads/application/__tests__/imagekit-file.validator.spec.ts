import { ImageKitFileValidator } from '../imagekit-file.validator';
import { ConfigService } from '@nestjs/config';

describe('ImageKitFileValidator', () => {
  const makeValidator = (urlEndpoint: string) =>
    new ImageKitFileValidator({
      get: (key: string) =>
        key === 'app.imagekit.urlEndpoint' ? urlEndpoint : undefined,
    } as ConfigService);

  it('accepts files hosted on the configured ImageKit endpoint', () => {
    const validator = makeValidator('https://ik.imagekit.io/TechnoAmar');

    expect(
      validator.isValidFileUrl('https://ik.imagekit.io/TechnoAmar/docs/id.pdf'),
    ).toBe(true);
  });

  it('rejects files from other hosts', () => {
    const validator = makeValidator('https://ik.imagekit.io/TechnoAmar');

    expect(validator.isValidFileUrl('https://evil.example.com/file.pdf')).toBe(
      false,
    );
  });

  it('allows PDF mime type', () => {
    const validator = makeValidator('https://ik.imagekit.io/TechnoAmar');

    expect(validator.isAllowedPdfMimeType('application/pdf')).toBe(true);
    expect(validator.isAllowedPdfMimeType('image/png')).toBe(false);
  });

  it('allows image mime types', () => {
    const validator = makeValidator('https://ik.imagekit.io/TechnoAmar');

    expect(validator.isAllowedImageMimeType('image/jpeg')).toBe(true);
    expect(validator.isAllowedImageMimeType('image/png')).toBe(true);
    expect(validator.isAllowedImageMimeType('image/webp')).toBe(true);
    expect(validator.isAllowedImageMimeType('application/pdf')).toBe(false);
  });

  it('isAllowedMimeType delegates to PDF check for service request docs', () => {
    const validator = makeValidator('https://ik.imagekit.io/TechnoAmar');

    expect(validator.isAllowedMimeType('application/pdf')).toBe(true);
    expect(validator.isAllowedMimeType('image/jpeg')).toBe(false);
  });
});
