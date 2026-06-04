import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { ApiConsumes, ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@infrastructure/http/auth/guards/roles.guard';
import { Roles } from '@infrastructure/http/auth/decorators/roles.decorator';
import { ActiveUser } from '@infrastructure/http/auth/decorators/active-user.decorator';
import { AccessTokenPayload } from '@domain/ports/token.port';
import { UserRole } from '@/generated/prisma/enums';

import { GetCitizenProfileUseCase } from '@usecases/citizens/get-citizen-profile.use-case';
import { UpdateCitizenProfileUseCase } from '@usecases/citizens/update-citizen-profile.use-case';
import { UploadVerificationDocumentUseCase } from '@usecases/citizens/upload-verification-document.use-case';
import { ListCitizensUseCase } from '@usecases/citizens/list-citizens.use-case';
import { VerifyCitizenUseCase } from '@usecases/citizens/verify-citizen.use-case';
import { RejectCitizenUseCase } from '@usecases/citizens/reject-citizen.use-case';
import { DeactivateCitizenUseCase } from '@usecases/citizens/deactivate-citizen.use-case';

import { UpdateCitizenProfileDto, RejectCitizenDto } from './dto/citizen.dto';

@ApiTags('Citizens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class CitizensController {
  constructor(
    private readonly getProfileUC: GetCitizenProfileUseCase,
    private readonly updateProfileUC: UpdateCitizenProfileUseCase,
    private readonly uploadDocUC: UploadVerificationDocumentUseCase,
    private readonly listCitizensUC: ListCitizensUseCase,
    private readonly verifyUC: VerifyCitizenUseCase,
    private readonly rejectUC: RejectCitizenUseCase,
    private readonly deactivateUC: DeactivateCitizenUseCase,
  ) {}

  // ── Citizen self-service ───────────────────────────────────────────────────

  @Get('citizens/me')
  @Roles(UserRole.CITIZEN)
  @ApiOperation({ summary: 'Get own citizen profile' })
  async getMyProfile(@ActiveUser() actor: AccessTokenPayload) {
    return this.getProfileUC.execute(BigInt(actor.sub));
  }

  @Put('citizens/me')
  @Roles(UserRole.CITIZEN)
  @ApiOperation({ summary: 'Update own citizen profile' })
  async updateMyProfile(
    @ActiveUser() actor: AccessTokenPayload,
    @Body() dto: UpdateCitizenProfileDto,
  ) {
    const payload = {
      ...dto,
      date_of_birth: dto.date_of_birth ? new Date(dto.date_of_birth) : undefined,
    };
    return this.updateProfileUC.execute(BigInt(actor.sub), payload);
  }

  @Post('citizens/me/verification-document')
  @Roles(UserRole.CITIZEN)
  @ApiOperation({ summary: 'Upload identity verification document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'verification-docs'),
        filename: (_req, file, cb) =>
          cb(null, `${randomUUID()}${extname(file.originalname)}`),
      }),
    }),
  )
  async uploadVerificationDocument(
    @ActiveUser() actor: AccessTokenPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5 MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|pdf)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadDocUC.execute(BigInt(actor.sub), file.path);
  }

  // ── Admin endpoints ────────────────────────────────────────────────────────

  @Get('admin/citizens')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List all citizens' })
  async listCitizens() {
    return this.listCitizensUC.execute();
  }

  @Get('admin/citizens/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get citizen details' })
  async getCitizen(@Param('id') id: string) {
    return this.getProfileUC.execute(BigInt(id));
  }

  @Post('admin/citizens/:id/verify')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Verify a citizen account' })
  async verifyCitizen(@Param('id') id: string) {
    return this.verifyUC.execute(BigInt(id));
  }

  @Post('admin/citizens/:id/reject')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Reject a citizen account' })
  async rejectCitizen(@Param('id') id: string, @Body() dto: RejectCitizenDto) {
    return this.rejectUC.execute(BigInt(id), dto.reason);
  }

  @Post('admin/citizens/:id/deactivate')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Deactivate a citizen account' })
  async deactivateCitizen(@Param('id') id: string) {
    return this.deactivateUC.execute(BigInt(id));
  }
}
