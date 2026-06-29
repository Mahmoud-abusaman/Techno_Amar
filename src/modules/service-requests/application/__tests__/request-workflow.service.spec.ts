import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { RequestWorkflowService } from '../request-workflow.service';
import { RequestTaskEntity } from '@service-requests/domain/entities/request-task.entity';

const makeTask = (
  overrides: Partial<RequestTaskEntity> = {},
): RequestTaskEntity => ({
  id: 1n,
  request_id: 10n,
  service_task_id: 5n,
  section_id: 3n,
  name: 'Review',
  task_order: 1,
  estimated_time_hours: 4,
  assigned_employee_id: null,
  status: 'BACKLOG',
  assigned_at: null,
  completed_at: null,
  rejection_reason: null,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

describe('RequestWorkflowService', () => {
  let service: RequestWorkflowService;

  beforeEach(() => {
    service = new RequestWorkflowService();
  });

  it('rejects actions on terminal requests', () => {
    expect(() => service.assertRequestNotTerminal('APPROVED')).toThrow(
      BadRequestException,
    );
    expect(() => service.assertRequestNotTerminal('REJECTED')).toThrow(
      BadRequestException,
    );
  });

  it('allows assignment for backlog task in actor section', () => {
    expect(() => service.assertTaskAssignable(makeTask(), 3n)).not.toThrow();
  });

  it('blocks assignment for wrong section', () => {
    expect(() =>
      service.assertTaskAssignable(makeTask({ section_id: 3n }), 4n),
    ).toThrow(ForbiddenException);
  });

  it('blocks assignment when task is not backlog', () => {
    expect(() =>
      service.assertTaskAssignable(makeTask({ status: 'IN_PROGRESS' }), 3n),
    ).toThrow(BadRequestException);
  });

  it('detects last task in workflow', () => {
    const tasks = [
      makeTask({ task_order: 1 }),
      makeTask({ id: 2n, task_order: 2 }),
    ];
    expect(service.isLastTask(tasks[0], tasks)).toBe(false);
    expect(service.isLastTask(tasks[1], tasks)).toBe(true);
  });
});
