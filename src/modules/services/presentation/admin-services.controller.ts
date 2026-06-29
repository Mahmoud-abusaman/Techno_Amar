import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
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
import { ActiveUser } from '@auth/presentation/decorators/active-user.decorator';
import { UserRole, ServiceStatus } from '@/generated/prisma/enums';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { CreateServiceUseCase } from '@services/application/create-service.use-case';
import { GetServicesUseCase } from '@services/application/get-services.use-case';
import { GetServiceUseCase } from '@services/application/get-service.use-case';
import { UpdateServiceUseCase } from '@services/application/update-service.use-case';
import { DeleteServiceUseCase } from '@services/application/delete-service.use-case';
import { PublishServiceUseCase } from '@services/application/publish-service.use-case';
import { ArchiveServiceUseCase } from '@services/application/archive-service.use-case';

@ApiTags('admin-services')
@ApiBearerAuth()
@Controller('admin/services')
export class AdminServicesController {
  constructor(
    private readonly createService: CreateServiceUseCase,
    private readonly getServices: GetServicesUseCase,
    private readonly getService: GetServiceUseCase,
    private readonly updateService: UpdateServiceUseCase,
    private readonly deleteService: DeleteServiceUseCase,
    private readonly publishService: PublishServiceUseCase,
    private readonly archiveService: ArchiveServiceUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a service with workflow tasks (Admin only)',
  })
  create(@Body() dto: CreateServiceDto, @ActiveUser('sub') userId: string) {
    return this.createService.execute(dto, BigInt(userId));
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all services (Admin only)' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'status', required: false, enum: ServiceStatus })
  findAll(
    @Query('activeOnly') activeOnly?: string,
    @Query('status') status?: ServiceStatus,
  ) {
    return this.getServices.execute({
      activeOnly: activeOnly === 'true',
      status,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a service with workflow tasks (Admin only)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.getService.execute(BigInt(id), { activeTasksOnly: true });
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a service (Admin only)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceDto) {
    return this.updateService.execute(BigInt(id), dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a service (Admin only)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deleteService.execute(BigInt(id));
  }

  @Post(':id/publish')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Publish a service (Admin only)' })
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.publishService.execute(BigInt(id));
  }

  @Post(':id/archive')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Archive a service (Admin only)' })
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.archiveService.execute(BigInt(id));
  }
}
