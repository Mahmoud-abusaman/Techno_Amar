import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@auth/presentation/decorators/public.decorator';
import { GetServicesUseCase } from '@services/application/get-services.use-case';
import { GetServiceUseCase } from '@services/application/get-service.use-case';
import { GetRequiredDocumentsUseCase } from '@required-documents/application/get-required-documents.use-case';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(
    private readonly getServices: GetServicesUseCase,
    private readonly getService: GetServiceUseCase,
    private readonly getRequiredDocuments: GetRequiredDocumentsUseCase,
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
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const serviceId = BigInt(id);
    const [service, required_documents] = await Promise.all([
      this.getService.execute(serviceId, {
        publishedOnly: true,
        activeTasksOnly: true,
      }),
      this.getRequiredDocuments.execute(serviceId, true),
    ]);

    return { ...service, required_documents };
  }
}
