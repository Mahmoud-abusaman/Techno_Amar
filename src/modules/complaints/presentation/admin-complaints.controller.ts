import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Patch,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Roles } from '@auth/presentation/decorators/roles.decorator';
import {
  UserRole,
  ComplaintStatus,
  ComplaintCategory,
  ComplaintPriority,
} from '@/generated/prisma/enums';
import { ComplaintFiltersDto } from './dto/complaint.dto';
import { ResolveComplaintDto } from './dto/resolve-complaint.dto';
import { GetAllComplaintsUseCase } from '@complaints/application/get-all-complaints.use-case';
import { GetComplaintAdminUseCase } from '@complaints/application/get-complaint-admin.use-case';
import { MarkComplaintUnderReviewUseCase } from '@complaints/application/mark-complaint-under-review.use-case';
import { ResolveComplaintUseCase } from '@complaints/application/resolve-complaint.use-case';

@ApiTags('admin-complaints')
@ApiBearerAuth()
@Controller('admin/complaints')
@Roles(UserRole.ADMIN)
export class AdminComplaintsController {
  constructor(
    private readonly getAllComplaints: GetAllComplaintsUseCase,
    private readonly getComplaintAdmin: GetComplaintAdminUseCase,
    private readonly markUnderReview: MarkComplaintUnderReviewUseCase,
    private readonly resolveComplaint: ResolveComplaintUseCase,
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
  @ApiParam({ name: 'id', type: 'number' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.getComplaintAdmin.execute(BigInt(id));
  }

  @Patch(':id/under-review')
  @ApiOperation({ summary: 'Mark a complaint as under review (Admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  markAsUnderReview(@Param('id', ParseIntPipe) id: number) {
    return this.markUnderReview.execute(BigInt(id));
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve or close a complaint (Admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  resolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveComplaintDto,
  ) {
    return this.resolveComplaint.execute({
      id: BigInt(id),
      status: dto.status,
      result: dto.result,
    });
  }
}
