import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ImageKit from '@imagekit/nodejs';
import {
  IImageKitAuthPort,
  ImageKitUploadAuth,
} from '@uploads/domain/ports/imagekit-auth.port';

@Injectable()
export class ImageKitAuthAdapter implements IImageKitAuthPort {
  private readonly client: ImageKit;
  private readonly publicKey: string;
  private readonly urlEndpoint: string;
  private readonly authExpireSeconds: number;

  constructor(private readonly config: ConfigService) {
    const privateKey = this.config.get<string>('app.imagekit.privateKey');
    this.publicKey = this.config.get<string>('app.imagekit.publicKey') ?? '';
    this.urlEndpoint = this.config.get<string>('app.imagekit.urlEndpoint') ?? '';
    this.authExpireSeconds = this.config.get<number>(
      'app.imagekit.authExpireSeconds',
    );

    this.client = new ImageKit({ privateKey });
  }

  getUploadAuth(): ImageKitUploadAuth {
    const expire =
      Math.floor(Date.now() / 1000) + (this.authExpireSeconds || 1800);
    const { token, signature } =
      this.client.helper.getAuthenticationParameters(undefined, expire);

    return {
      publicKey: this.publicKey,
      urlEndpoint: this.urlEndpoint,
      token,
      expire,
      signature,
    };
  }
}
