import { ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles.guard';
import { REQUEST_USER_KEY } from '../jwt-auth.guard';
import { ROLES_KEY } from '../../decorators/roles.decorator';
import { UserRole } from '@/generated/prisma/enums';
import { AccessTokenPayload } from '@auth/domain/ports/token.port';

const makeContext = (
  user: AccessTokenPayload | null,
  requiredRoles: UserRole[] | null,
): ExecutionContext => {
  const request: any = {};
  if (user !== null) request[REQUEST_USER_KEY] = user;

  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
    _requiredRoles: requiredRoles,
  } as unknown as ExecutionContext;
};

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  describe('canActivate', () => {
    it('returns true when no roles are required on the handler', () => {
      reflector.getAllAndOverride.mockReturnValue(null);
      const ctx = makeContext(null, null);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true when the user has the required role', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const ctx = makeContext(
        {
          sub: '1',
          email: 'admin@example.com',
          role: 'ADMIN',
          department_id: null,
        },
        [UserRole.ADMIN],
      );

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true when the user has one of multiple allowed roles', () => {
      reflector.getAllAndOverride.mockReturnValue([
        UserRole.ADMIN,
        UserRole.DEPARTMENT_MANAGER,
      ]);
      const ctx = makeContext(
        {
          sub: '1',
          email: 'mgr@example.com',
          role: 'DEPARTMENT_MANAGER',
          department_id: '5',
        },
        [UserRole.ADMIN, UserRole.DEPARTMENT_MANAGER],
      );

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws ForbiddenException when user role does not match required roles', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const ctx = makeContext(
        {
          sub: '1',
          email: 'citizen@example.com',
          role: 'CITIZEN',
          department_id: null,
        },
        [UserRole.ADMIN],
      );

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(ctx)).toThrow(/Access denied/);
    });

    it('throws ForbiddenException when the user payload is missing from the request', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const ctx = makeContext(null, [UserRole.ADMIN]);

      expect(() => guard.canActivate(ctx)).toThrow(
        new ForbiddenException('User not authenticated'),
      );
    });

    it('reads roles metadata from both handler and class', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const ctx = makeContext(
        {
          sub: '1',
          email: 'admin@example.com',
          role: 'ADMIN',
          department_id: null,
        },
        [UserRole.ADMIN],
      );

      guard.canActivate(ctx);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        expect.anything(),
        expect.anything(),
      ]);
    });
  });
});
