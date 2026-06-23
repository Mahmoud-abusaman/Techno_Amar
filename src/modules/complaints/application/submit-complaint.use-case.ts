import { Injectable, Inject } from '@nestjs/common';
import { IComplaintRepository } from '@complaints/domain/repositories/complaint-repository.interface';
import { SubmitComplaintDto } from '@complaints/presentation/dto/complaint.dto';
import {
  PublicComplaint,
  toPublicComplaint,
} from '@complaints/application/complaint-response.mapper';
import { ImageKitFileValidator } from '@uploads/application/imagekit-file.validator';
import { validateImageFile } from '@uploads/application/citizen-verification-file.validator';
import { ComplaintPriority } from '@/generated/prisma/enums';

@Injectable()
export class SubmitComplaintUseCase {
  constructor(
    @Inject(IComplaintRepository)
    private readonly repo: IComplaintRepository,
    private readonly fileValidator: ImageKitFileValidator,
  ) {}

  async execute(
    citizenId: bigint,
    data: SubmitComplaintDto,
  ): Promise<PublicComplaint> {
    if (data.photo) {
      validateImageFile(data.photo, this.fileValidator, 'Complaint photo');
    }

    const complaint = await this.repo.create({
      citizen_id: citizenId,
      title: data.title,
      category: data.category,
      priority: data.priority ?? ComplaintPriority.MEDIUM,
      location: data.location ?? null,
      description: data.description,
      photo_name: data.photo?.file_name ?? null,
      photo_file_type: data.photo?.file_type ?? null,
      photo_url: data.photo?.file_url ?? null,
      photo_file_id: data.photo?.file_id ?? null,
      photo_file_path: data.photo?.file_path ?? null,
    });

    return toPublicComplaint(complaint);
  }
}
