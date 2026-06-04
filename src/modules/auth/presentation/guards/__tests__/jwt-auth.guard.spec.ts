import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard, REQUEST_USER_KEY } from '../jwt-auth.guard';
import { IAccessTokenPort, AccessTokenPayload } from '@domain/ports/token.port';

const makePayload = (overrides: Partial<AccessTokenPayload> = {}): AccessTokenPayload => ({
  sub: '1',
  email: 'ahmed@example.com',
  role: 'CITIZEN',
  department_id: null,
  ...overrides,
});

const makeContext = (headers: Record<string, string> = {}): ExecutionContext => {
  const request: any = { headers };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
};

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let accessTokenPort: jest.Mocked<IAccessTokenPort>;

  beforeEach(() => {
    accessTokenPort = {
      generate: jest.fn(),
      verify: jest.fn(),
    };
    guard = new JwtAuthGuard(accessTokenPort);
  });

  describe('canActivate', () => {
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

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('calls accessTokenPort.verify with the extracted token string', async () => {
      accessTokenPort.verify.mockResolvedValue(makePayload());
      const ctx = makeContext({ authorization: 'Bearer my.exact.token' });

      await guard.canActivate(ctx);

      expect(accessTokenPort.verify).toHaveBeenCalledWith('my.exact.token');
    });
  });
});
