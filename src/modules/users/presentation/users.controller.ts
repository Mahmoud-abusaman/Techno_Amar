import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ActiveUser } from '@auth/presentation/decorators/active-user.decorator';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { GetMyProfileUseCase } from '@users/application/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from '@users/application/update-my-profile.use-case';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly getMyProfile: GetMyProfileUseCase,
    private readonly updateMyProfile: UpdateMyProfileUseCase,
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
}
