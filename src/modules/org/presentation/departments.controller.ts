import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@/generated/prisma/enums';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { CreateDepartmentUseCase } from '@usecases/org/department/create-department.use-case';
import { GetDepartmentsUseCase } from '@usecases/org/department/get-departments.use-case';
import { GetDepartmentUseCase } from '@usecases/org/department/get-department.use-case';
import { UpdateDepartmentUseCase } from '@usecases/org/department/update-department.use-case';
import { DeleteDepartmentUseCase } from '@usecases/org/department/delete-department.use-case';

@ApiTags('departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(
    private readonly createDepartment: CreateDepartmentUseCase,
    private readonly getDepartments: GetDepartmentsUseCase,
    private readonly getDepartment: GetDepartmentUseCase,
    private readonly updateDepartment: UpdateDepartmentUseCase,
    private readonly deleteDepartment: DeleteDepartmentUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new department (Admin only)' })
  create(@Body() dto: CreateDepartmentDto) {
    return this.createDepartment.execute(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT_MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'List all departments' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.getDepartments.execute(activeOnly === 'true');
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT_MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get a department by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.getDepartment.execute(BigInt(id));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a department (Admin only)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDepartmentDto) {
    return this.updateDepartment.execute(BigInt(id), dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a department (Admin only, no active dependents)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deleteDepartment.execute(BigInt(id));
  }
}
