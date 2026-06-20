import { Injectable, Inject } from '@nestjs/common';
import {
  IImageKitAuthPort,
  ImageKitUploadAuth,
} from '@uploads/domain/ports/imagekit-auth.port';

@Injectable()
export class GetImageKitUploadAuthUseCase {
  constructor(
    @Inject(IImageKitAuthPort)
    private readonly imageKitAuth: IImageKitAuthPort,
  ) {}

  execute(): ImageKitUploadAuth {
    return this.imageKitAuth.getUploadAuth();
  }
}
