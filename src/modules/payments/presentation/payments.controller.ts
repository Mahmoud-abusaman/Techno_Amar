import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '@auth/presentation/decorators/roles.decorator';
import { ActiveUser } from '@auth/presentation/decorators/active-user.decorator';
import { UserRole } from '@/generated/prisma/enums';
import { SubmitPaymentDto } from './dto/submit-payment.dto';
import { SubmitPaymentUseCase } from '../application/submit-payment.use-case';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('service-requests')
export class PaymentsController {
  constructor(private readonly submitPayment: SubmitPaymentUseCase) {}

  @Post(':id/payments')
  @Roles(UserRole.CITIZEN)
  @ApiOperation({
    summary: 'Submit or resubmit payment proof for a service request',
    description:
      'Allows citizen to upload payment details when requested/failed.',
  })
  submit(
    @Param('id') id: string,
    @ActiveUser('sub') userId: string,
    @Body() dto: SubmitPaymentDto,
  ) {
    return this.submitPayment.execute(BigInt(userId), BigInt(id), dto);
  }
}
