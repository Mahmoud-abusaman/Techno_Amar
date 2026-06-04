import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  IAccessTokenPort,
  AccessTokenPayload,
} from '@auth/domain/ports/token.port';

export const REQUEST_USER_KEY = 'user';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(IAccessTokenPort)
    private readonly accessTokenPort: IAccessTokenPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { [REQUEST_USER_KEY]: AccessTokenPayload }>();

    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException('Authentication required');

    try {
      request[REQUEST_USER_KEY] = await this.accessTokenPort.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
