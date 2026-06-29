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
import { UserRole } from '@/generated/prisma/enums';
import {
  CreateServiceTaskDto,
  UpdateServiceTaskDto,
} from './dto/service-task.dto';
import { CreateServiceTaskUseCase } from '@service-tasks/application/create-service-task.use-case';
import { GetServiceTasksUseCase } from '@service-tasks/application/get-service-tasks.use-case';
import { UpdateServiceTaskUseCase } from '@service-tasks/application/update-service-task.use-case';
import { DeleteServiceTaskUseCase } from '@service-tasks/application/delete-service-task.use-case';

@ApiTags('admin-service-workflow')
@ApiBearerAuth()
@Controller('admin/services/:serviceId/workflow')
export class AdminServiceWorkflowController {
  constructor(
    private readonly createTask: CreateServiceTaskUseCase,
    private readonly getTasks: GetServiceTasksUseCase,
    private readonly updateTask: UpdateServiceTaskUseCase,
    private readonly deleteTask: DeleteServiceTaskUseCase,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List workflow tasks for a service (Admin only)' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  findAll(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.getTasks.execute(BigInt(serviceId), activeOnly === 'true');
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a workflow task (Admin only)' })
  create(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Body() dto: CreateServiceTaskDto,
  ) {
    return this.createTask.execute(BigInt(serviceId), dto);
  }

  @Patch(':taskId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a workflow task (Admin only)' })
  update(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: UpdateServiceTaskDto,
  ) {
    return this.updateTask.execute(BigInt(serviceId), BigInt(taskId), dto);
  }

  @Delete(':taskId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a workflow task (Admin only)' })
  remove(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.deleteTask.execute(BigInt(serviceId), BigInt(taskId));
  }
}
