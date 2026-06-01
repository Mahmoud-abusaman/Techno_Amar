import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@infrastructure/http/auth/guards/roles.guard';
import { Roles } from '@infrastructure/http/auth/decorators/roles.decorator';
import { ActiveUser } from '@infrastructure/http/auth/decorators/active-user.decorator';
import { AccessTokenPayload } from '@domain/ports/token.port';
import { UserRole } from '@/generated/prisma/enums';

import { CreateEmployeeUseCase } from '@usecases/employees/create-employee.use-case';
import { ListEmployeesUseCase } from '@usecases/employees/list-employees.use-case';
import { GetEmployeeUseCase } from '@usecases/employees/get-employee.use-case';
import { UpdateEmployeeUseCase } from '@usecases/employees/update-employee.use-case';
import { DeactivateEmployeeUseCase } from '@usecases/employees/deactivate-employee.use-case';

import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly createUC: CreateEmployeeUseCase,
    private readonly listUC: ListEmployeesUseCase,
    private readonly getUC: GetEmployeeUseCase,
    private readonly updateUC: UpdateEmployeeUseCase,
    private readonly deactivateUC: DeactivateEmployeeUseCase,
  ) {}

  private ctx(actor: AccessTokenPayload) {
    return {
      actorRole: actor.role as UserRole,
      actorDepartmentId: actor.department_id ? BigInt(actor.department_id) : null,
    };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT_MANAGER)
  @ApiOperation({ summary: 'Admin/Manager: Create employee' })
  async create(
    @Body() dto: CreateEmployeeDto,
    @ActiveUser() actor: AccessTokenPayload,
  ) {
    return this.createUC.execute(dto, this.ctx(actor));
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT_MANAGER)
  @ApiOperation({ summary: 'Admin/Manager: List employees' })
  @ApiQuery({ name: 'department_id', required: false })
  @ApiQuery({ name: 'section_id', required: false })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  async list(
    @ActiveUser() actor: AccessTokenPayload,
    @Query('department_id') departmentId?: string,
    @Query('section_id') sectionId?: string,
    @Query('is_active') isActive?: string,
  ) {
    return this.listUC.execute(this.ctx(actor), {
      department_id: departmentId ? BigInt(departmentId) : undefined,
      section_id: sectionId ? BigInt(sectionId) : undefined,
      is_active: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT_MANAGER)
  @ApiOperation({ summary: 'Admin/Manager: Get employee by id' })
  async getOne(@Param('id') id: string, @ActiveUser() actor: AccessTokenPayload) {
    return this.getUC.execute(BigInt(id), this.ctx(actor));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT_MANAGER)
  @ApiOperation({ summary: 'Admin/Manager: Update employee' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @ActiveUser() actor: AccessTokenPayload,
  ) {
    return this.updateUC.execute(BigInt(id), dto, this.ctx(actor));
  }

  @Post(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin/Manager: Deactivate employee' })
  async deactivate(@Param('id') id: string, @ActiveUser() actor: AccessTokenPayload) {
    return this.deactivateUC.execute(BigInt(id), this.ctx(actor));
  }
}
