import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@auth/presentation/decorators/roles.decorator';
import { UserRole, AccountStatus } from '@/generated/prisma/enums';
import { CreateUserDto } from './dto/create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { RejectUserDto } from './dto/reject-user.dto';
import { CreateUserUseCase } from '@users/application/create-user.use-case';
import { GetUserUseCase } from '@users/application/get-user.use-case';
import { UpdateUserUseCase } from '@users/application/update-user.use-case';
import { GetAllUsersUseCase } from '@users/application/get-all-users.use-case';
import { VerifyUserUseCase } from '@users/application/verify-user.use-case';
import { RejectUserUseCase } from '@users/application/reject-user.use-case';
import { DisableUserUseCase } from '@users/application/disable-user.use-case';

@ApiTags('admin-users')
@ApiBearerAuth()
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly getAllUsers: GetAllUsersUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly verifyUser: VerifyUserUseCase,
    private readonly rejectUser: RejectUserUseCase,
    private readonly disableUser: DisableUserUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  create(@Body() dto: CreateUserDto) {
    return this.createUser.execute(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all users (Admin only)' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'account_status', required: false, enum: AccountStatus })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  findAll(
    @Query('role') role?: UserRole,
    @Query('account_status') account_status?: AccountStatus,
    @Query('is_active') is_active?: string,
  ) {
    return this.getAllUsers.execute({
      role,
      account_status,
      is_active:
        is_active === undefined ? undefined : is_active === 'true',
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get user details with profile (Admin only)',
    description:
      'Includes citizen_profile with verification_document (ID PDF URL) and id_selfie (selfie URL) when applicable.',
  })
  findOne(@Param('id') id: string) {
    return this.getUser.execute(BigInt(id));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a user (Admin only)' })
  update(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.updateUser.execute(BigInt(id), dto);
  }

  @Post(':id/verify')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve and verify a user account (Admin only)' })
  verify(@Param('id') id: string) {
    return this.verifyUser.execute(BigInt(id));
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a user registration (Admin only)' })
  reject(@Param('id') id: string, @Body() dto: RejectUserDto) {
    return this.rejectUser.execute(BigInt(id), dto);
  }

  @Post(':id/disable')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable a user account (Admin only)' })
  disable(@Param('id') id: string) {
    return this.disableUser.execute(BigInt(id));
  }
}
