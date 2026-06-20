import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '@auth/presentation/decorators/roles.decorator';
import { UserRole } from '@/generated/prisma/enums';
import { GetImageKitUploadAuthUseCase } from '@uploads/application/get-imagekit-upload-auth.use-case';

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads/imagekit')
export class UploadsController {
  constructor(
    private readonly getUploadAuth: GetImageKitUploadAuthUseCase,
  ) {}

  @Get('auth')
  @Roles(
    UserRole.CITIZEN,
    UserRole.EMPLOYEE,
    UserRole.DEPARTMENT_MANAGER,
    UserRole.ADMIN,
  )
  @ApiOperation({
    summary: 'Get ImageKit client-side upload authentication parameters',
    description:
      'Upload files directly to ImageKit from the client. PDFs and images (JPEG, PNG, WebP) are accepted depending on the use case. ' +
      'POST to https://upload.imagekit.io/api/v1/files/upload with file, fileName, publicKey, signature, token, and expire.',
  })
  auth() {
    return this.getUploadAuth.execute();
  }
}
