import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@auth/presentation/decorators/roles.decorator';
import { ActiveUser } from '@auth/presentation/decorators/active-user.decorator';
import { UserRole, PaymentStatus } from '@/generated/prisma/enums';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { GetAllPaymentsUseCase } from '../application/get-all-payments.use-case';
import { VerifyPaymentUseCase } from '../application/verify-payment.use-case';

@ApiTags('admin-payments')
@ApiBearerAuth()
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(
    private readonly getAllPayments: GetAllPaymentsUseCase,
    private readonly verifyPayment: VerifyPaymentUseCase,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all payment submissions (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  findAll(@Query('status') status?: PaymentStatus) {
    return this.getAllPayments.execute(status ? { status } : undefined);
  }

  @Post(':id/verify')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Verify/approve/reject a payment submission (Admin only)',
  })
  verify(
    @Param('id') id: string,
    @ActiveUser('sub') adminId: string,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.verifyPayment.execute(BigInt(id), BigInt(adminId), dto);
  }
}
