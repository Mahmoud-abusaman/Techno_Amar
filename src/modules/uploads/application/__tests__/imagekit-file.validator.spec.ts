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

  it('allows only PDF mime type', () => {
    const validator = makeValidator('https://ik.imagekit.io/TechnoAmar');

    expect(validator.isAllowedMimeType('application/pdf')).toBe(true);
    expect(validator.isAllowedMimeType('image/png')).toBe(false);
    expect(validator.isAllowedMimeType('image/jpeg')).toBe(false);
  });
});
