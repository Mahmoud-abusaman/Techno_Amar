import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard, REQUEST_USER_KEY } from '../jwt-auth.guard';
import {
  IAccessTokenPort,
  AccessTokenPayload,
} from '@auth/domain/ports/token.port';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';

const makePayload = (
  overrides: Partial<AccessTokenPayload> = {},
): AccessTokenPayload => ({
  sub: '1',
  email: 'ahmed@example.com',
  role: 'CITIZEN',
  department_id: null,
  ...overrides,
});

const makeContext = (
  headers: Record<string, string> = {},
): ExecutionContext => {
  const request: any = { headers };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
};

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let accessTokenPort: jest.Mocked<IAccessTokenPort>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    accessTokenPort = {
      generate: jest.fn(),
      verify: jest.fn(),
    };
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<Reflector>;
    guard = new JwtAuthGuard(accessTokenPort, reflector);
  });

  describe('canActivate', () => {
    it('returns true without checking the token when the route is public', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const ctx = makeContext({});

      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      expect(accessTokenPort.verify).not.toHaveBeenCalled();
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        expect.anything(),
        expect.anything(),
      ]);
    });

    it('returns true and attaches the payload to the request on a valid Bearer token', async () => {
      const payload = makePayload();
      accessTokenPort.verify.mockResolvedValue(payload);
      const ctx = makeContext({ authorization: 'Bearer valid.access.token' });

      const result = await guard.canActivate(ctx);
      const request = ctx.switchToHttp().getRequest<any>();

      expect(result).toBe(true);
      expect(request[REQUEST_USER_KEY]).toBe(payload);
    });

    it('throws UnauthorizedException when Authorization header is missing', async () => {
      const ctx = makeContext({});

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        new UnauthorizedException('Authentication required'),
      );
      expect(accessTokenPort.verify).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when Authorization scheme is not Bearer', async () => {
      const ctx = makeContext({ authorization: 'Basic dXNlcjpwYXNz' });

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        new UnauthorizedException('Authentication required'),
      );
      expect(accessTokenPort.verify).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the token is invalid', async () => {
      accessTokenPort.verify.mockRejectedValue(new Error('jwt malformed'));
      const ctx = makeContext({ authorization: 'Bearer bad.token' });

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        new UnauthorizedException('Invalid token'),
      );
    });

    it('throws UnauthorizedException when the token is expired', async () => {
      accessTokenPort.verify.mockRejectedValue(new Error('jwt expired'));
      const ctx = makeContext({ authorization: 'Bearer expired.token' });

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('calls accessTokenPort.verify with the extracted token string', async () => {
      accessTokenPort.verify.mockResolvedValue(makePayload());
      const ctx = makeContext({ authorization: 'Bearer my.exact.token' });

      await guard.canActivate(ctx);

      expect(accessTokenPort.verify).toHaveBeenCalledWith('my.exact.token');
    });
  });
});
