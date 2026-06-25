import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@auth/presentation/decorators/roles.decorator';
import {
  UserRole,
  ComplaintStatus,
  ComplaintCategory,
  ComplaintPriority,
} from '@/generated/prisma/enums';
import { ComplaintFiltersDto } from './dto/complaint.dto';
import { GetAllComplaintsUseCase } from '@complaints/application/get-all-complaints.use-case';
import { GetComplaintAdminUseCase } from '@complaints/application/get-complaint-admin.use-case';

@ApiTags('admin-complaints')
@ApiBearerAuth()
@Controller('admin/complaints')
@Roles(UserRole.ADMIN)
export class AdminComplaintsController {
  constructor(
    private readonly getAllComplaints: GetAllComplaintsUseCase,
    private readonly getComplaintAdmin: GetComplaintAdminUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all complaints (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: ComplaintStatus })
  @ApiQuery({ name: 'category', required: false, enum: ComplaintCategory })
  @ApiQuery({ name: 'priority', required: false, enum: ComplaintPriority })
  findAll(@Query() filters: ComplaintFiltersDto) {
    return this.getAllComplaints.execute(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get complaint details (Admin only)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.getComplaintAdmin.execute(BigInt(id));
  }
}
