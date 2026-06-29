import {
  Controller,
  Get,
  Patch,
  Body,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '@auth/presentation/decorators/roles.decorator';
import { UserRole } from '@/generated/prisma/enums';
import { ActiveUser } from '@auth/presentation/decorators/active-user.decorator';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { ResubmitVerificationDocumentsDto } from './dto/resubmit-verification-documents.dto';
import { GetMyProfileUseCase } from '@users/application/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from '@users/application/update-my-profile.use-case';
import { ResubmitVerificationDocumentsUseCase } from '@users/application/resubmit-verification-documents.use-case';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly getMyProfile: GetMyProfileUseCase,
    private readonly updateMyProfile: UpdateMyProfileUseCase,
    private readonly resubmitVerificationDocuments: ResubmitVerificationDocumentsUseCase,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own profile' })
  getProfile(@ActiveUser('sub') userId: string) {
    return this.getMyProfile.execute(BigInt(userId));
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile' })
  updateProfile(
    @ActiveUser('sub') userId: string,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.updateMyProfile.execute(BigInt(userId), dto);
  }

  @Post('me/resubmit-verification')
  @Roles(UserRole.CITIZEN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resubmit ID document and selfie after rejection',
    description:
      'For citizens with REJECTED status only. Upload files to ImageKit first, then submit metadata. ' +
      'Account returns to PENDING_VERIFICATION for admin review.',
  })
  resubmitVerification(
    @ActiveUser('sub') userId: string,
    @Body() dto: ResubmitVerificationDocumentsDto,
  ) {
    return this.resubmitVerificationDocuments.execute(
      BigInt(userId),
      dto.verification_documents,
    );
  }
}
