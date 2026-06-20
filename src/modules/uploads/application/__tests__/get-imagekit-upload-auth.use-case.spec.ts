import { GetImageKitUploadAuthUseCase } from '../get-imagekit-upload-auth.use-case';
import { IImageKitAuthPort } from '@uploads/domain/ports/imagekit-auth.port';

describe('GetImageKitUploadAuthUseCase', () => {
  it('returns ImageKit upload auth parameters', () => {
    const authPort: IImageKitAuthPort = {
      getUploadAuth: jest.fn().mockReturnValue({
        publicKey: 'public_test',
        urlEndpoint: 'https://ik.imagekit.io/TechnoAmar',
        token: 'token',
        expire: 123456,
        signature: 'signature',
      }),
    };

    const useCase = new GetImageKitUploadAuthUseCase(authPort);
    const result = useCase.execute();

    expect(result.publicKey).toBe('public_test');
    expect(result.signature).toBe('signature');
  });
});
