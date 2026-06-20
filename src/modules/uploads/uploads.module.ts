import { Module } from '@nestjs/common';
import { IImageKitAuthPort } from '@uploads/domain/ports/imagekit-auth.port';
import { ImageKitAuthAdapter } from '@uploads/infrastructure/imagekit-auth.adapter';
import { GetImageKitUploadAuthUseCase } from '@uploads/application/get-imagekit-upload-auth.use-case';
import { ImageKitFileValidator } from '@uploads/application/imagekit-file.validator';
import { UploadsController } from '@uploads/presentation/uploads.controller';

@Module({
  controllers: [UploadsController],
  providers: [
    { provide: IImageKitAuthPort, useClass: ImageKitAuthAdapter },
    GetImageKitUploadAuthUseCase,
    ImageKitFileValidator,
  ],
  exports: [IImageKitAuthPort, ImageKitFileValidator],
})
export class UploadsModule {}
