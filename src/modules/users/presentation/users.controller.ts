import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserUseCase } from '@users/application/create-user.use-case';
import { GetUserUseCase } from '@users/application/get-user.use-case';
import { UpdateUserUseCase } from '@users/application/update-user.use-case';
import { DeleteUserUseCase } from '@users/application/delete-user.use-case';
import { GetAllUsersUseCase } from '@users/application/get-all-users.use-case';
import { JwtAuthGuard } from '@auth/presentation/guards/jwt-auth.guard';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    @Inject(CreateUserUseCase) private readonly createUser: CreateUserUseCase,
    @Inject(GetAllUsersUseCase) private readonly getAllUsers: GetAllUsersUseCase,
    @Inject(GetUserUseCase) private readonly getUser: GetUserUseCase,
    @Inject(UpdateUserUseCase) private readonly updateUser: UpdateUserUseCase,
    @Inject(DeleteUserUseCase) private readonly deleteUser: DeleteUserUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() dto: CreateUserDto) {
    return this.createUser.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll() {
    return this.getAllUsers.execute();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  findOne(@Param('id') id: string) {
    return this.getUser.execute(BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.updateUser.execute(BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  remove(@Param('id') id: string) {
    return this.deleteUser.execute(BigInt(id));
  }
}
