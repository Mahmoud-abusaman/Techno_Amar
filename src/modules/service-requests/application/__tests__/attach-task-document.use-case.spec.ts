import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AttachTaskDocumentUseCase } from '../attach-task-document.use-case';
import { RequestWorkflowService } from '../request-workflow.service';
import { ImageKitFileValidator } from '@uploads/application/imagekit-file.validator';
import {
  makeEmployee,
  makeRequestDocument,
  makeRequestRepo,
  makeTaskRepo,
  makeTaskWithRequest,
  makeUserRepo,
} from './test-helpers';

const dto = {
  file_name: 'Inspection Report.pdf',
  file_type: 'application/pdf',
  file_url: 'https://ik.imagekit.io/TechnoAmar/tasks/inspection-report.pdf',
  file_id: 'file_inspection_report',
  file_path: '/tasks/inspection-report.pdf',
};

describe('AttachTaskDocumentUseCase', () => {
  let useCase: AttachTaskDocumentUseCase;
  let taskRepo: ReturnType<typeof makeTaskRepo>;
  let requestRepo: ReturnType<typeof makeRequestRepo>;
  let userRepo: ReturnType<typeof makeUserRepo>;
  let fileValidator: jest.Mocked<
    Pick<ImageKitFileValidator, 'isValidFileUrl' | 'isAllowedPdfMimeType'>
  >;

  beforeEach(() => {
    taskRepo = makeTaskRepo();
    requestRepo = makeRequestRepo();
    userRepo = makeUserRepo();
    fileValidator = {
      isValidFileUrl: jest.fn().mockReturnValue(true),
      isAllowedPdfMimeType: jest.fn().mockReturnValue(true),
    };
    useCase = new AttachTaskDocumentUseCase(
      taskRepo,
      requestRepo,
      userRepo,
      new RequestWorkflowService(),
      fileValidator as unknown as ImageKitFileValidator,
    );
  });

  it('attaches an internal document to a task in the employee section', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee());
    taskRepo.findByIdWithRequest.mockResolvedValue(
      makeTaskWithRequest({
        assigned_employee_id: 8n,
        status: 'BACKLOG',
        assigned_at: null,
      }),
    );
    requestRepo.addDocument.mockResolvedValue(
      makeRequestDocument({
        id: 60n,
        task_id: 1n,
        name: dto.file_name,
        file_type: dto.file_type,
        file_url: dto.file_url,
        file_id: dto.file_id,
        file_path: dto.file_path,
        category: 'INTERNAL',
        uploaded_by: 5n,
      }),
    );

    const result = await useCase.execute(5n, 1n, dto);

    expect(requestRepo.addDocument).toHaveBeenCalledWith(10n, {
      task_id: 1n,
      name: dto.file_name,
      file_type: dto.file_type,
      file_url: dto.file_url,
      file_id: dto.file_id,
      file_path: dto.file_path,
      category: 'INTERNAL',
      uploaded_by: 5n,
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: '60',
        task_id: '1',
        category: 'INTERNAL',
        uploaded_by: '5',
      }),
    );
  });

  it('throws NotFoundException when task does not exist', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee());
    taskRepo.findByIdWithRequest.mockResolvedValue(null);

    await expect(useCase.execute(5n, 99n, dto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws ForbiddenException when task belongs to another section', async () => {
    userRepo.findById.mockResolvedValue(makeEmployee());
    taskRepo.findByIdWithRequest.mockResolvedValue(
      makeTaskWithRequest({ section_id: 99n }),
    );

    await expect(useCase.execute(5n, 1n, dto)).rejects.toThrow(
      ForbiddenException,
    );
    expect(requestRepo.addDocument).not.toHaveBeenCalled();
  });

  it('throws BadRequestException for invalid ImageKit files', async () => {
    fileValidator.isValidFileUrl.mockReturnValue(false);
    userRepo.findById.mockResolvedValue(makeEmployee());

    await expect(useCase.execute(5n, 1n, dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(taskRepo.findByIdWithRequest).not.toHaveBeenCalled();
  });
});
