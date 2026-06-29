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
import { CreateSectionDto, UpdateSectionDto } from './dto/section.dto';
import { CreateSectionUseCase } from '@org/application/section/create-section.use-case';
import { GetSectionsUseCase } from '@org/application/section/get-sections.use-case';
import { GetSectionUseCase } from '@org/application/section/get-section.use-case';
import { UpdateSectionUseCase } from '@org/application/section/update-section.use-case';
import { DeleteSectionUseCase } from '@org/application/section/delete-section.use-case';

@ApiTags('sections')
@ApiBearerAuth()
@Controller('sections')
export class SectionsController {
  constructor(
    private readonly createSection: CreateSectionUseCase,
    private readonly getSections: GetSectionsUseCase,
    private readonly getSection: GetSectionUseCase,
    private readonly updateSection: UpdateSectionUseCase,
    private readonly deleteSection: DeleteSectionUseCase,
  ) {}

  @Post('')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a section in a department (Admin only)' })
  create(@Body() dto: CreateSectionDto) {
    return this.createSection.execute(dto);
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
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a section (Admin only)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSectionDto) {
    return this.updateSection.execute(BigInt(id), dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a section (Admin only, no employees assigned)',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deleteSection.execute(BigInt(id));
  }
}
