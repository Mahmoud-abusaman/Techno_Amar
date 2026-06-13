import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@auth/presentation/decorators/public.decorator';
import { GetServicesUseCase } from '@services/application/get-services.use-case';
import { GetServiceUseCase } from '@services/application/get-service.use-case';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(
    private readonly getServices: GetServicesUseCase,
    private readonly getService: GetServiceUseCase,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List published services (public)' })
  findAll() {
    return this.getServices.execute({ publishedOnly: true });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get published service details (public)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.getService.execute(BigInt(id), {
      publishedOnly: true,
      activeTasksOnly: true,
    });
  }
}
