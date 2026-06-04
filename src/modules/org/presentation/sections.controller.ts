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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/presentation/guards/roles.guard';
import { Roles } from '@auth/presentation/decorators/roles.decorator';
import { ActiveUser } from '@auth/presentation/decorators/active-user.decorator';
import { AccessTokenPayload } from '@auth/domain/ports/token.port';
import { UserRole } from '@/generated/prisma/enums';
import { CreateSectionDto, UpdateSectionDto } from './dto/section.dto';
import { CreateSectionUseCase } from '@org/application/section/create-section.use-case';
import { GetSectionsUseCase } from '@org/application/section/get-sections.use-case';
import { GetSectionUseCase } from '@org/application/section/get-section.use-case';
import { UpdateSectionUseCase } from '@org/application/section/update-section.use-case';
import { DeleteSectionUseCase } from '@org/application/section/delete-section.use-case';

@ApiTags('sections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sections')
export class SectionsController {
  constructor(
    private readonly createSection: CreateSectionUseCase,
    private readonly getSections: GetSectionsUseCase,
    private readonly getSection: GetSectionUseCase,
    private readonly updateSection: UpdateSectionUseCase,
    private readonly deleteSection: DeleteSectionUseCase,
  ) {}

  @Post('departments/:departmentId')
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT_MANAGER)
  @ApiOperation({
    summary: 'Create a section in a department (Admin or Manager of that dept)',
  })
  create(
    @Param('departmentId', ParseIntPipe) departmentId: number,
    @Body() dto: CreateSectionDto,
    @ActiveUser() actor: AccessTokenPayload,
  ) {
    const actorDeptId = actor.department_id
      ? BigInt(actor.department_id)
      : null;
    return this.createSection.execute(
      { ...dto, department_id: BigInt(departmentId) },
      { actorRole: actor.role as UserRole, actorDepartmentId: actorDeptId },
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT_MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'List sections (optionally filter by department)' })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  findAll(
    @Query('departmentId') departmentId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.getSections.execute(
      departmentId ? BigInt(departmentId) : undefined,
      activeOnly === 'true',
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT_MANAGER, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get a section by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.getSection.execute(BigInt(id));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT_MANAGER)
  @ApiOperation({ summary: 'Update a section (Admin or Manager of that dept)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSectionDto,
    @ActiveUser() actor: AccessTokenPayload,
  ) {
    const actorDeptId = actor.department_id
      ? BigInt(actor.department_id)
      : null;
    return this.updateSection.execute(BigInt(id), dto, {
      actorRole: actor.role as UserRole,
      actorDepartmentId: actorDeptId,
    });
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Delete a section (Admin or Manager of that dept, no employees assigned)',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() actor: AccessTokenPayload,
  ) {
    const actorDeptId = actor.department_id
      ? BigInt(actor.department_id)
      : null;
    return this.deleteSection.execute(BigInt(id), {
      actorRole: actor.role as UserRole,
      actorDepartmentId: actorDeptId,
    });
  }
}
