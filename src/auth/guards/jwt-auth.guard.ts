import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ITokenProvider } from '../providers/interfaces/token-provider.interface';
import { REQUEST_USER_KEY } from '../decorators/active-user.decorator';
import { TokenPayload } from '../providers/interfaces/token-provider.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(ITokenProvider) private readonly tokenProvider: ITokenProvider,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { [REQUEST_USER_KEY]: TokenPayload }>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload = await this.tokenProvider.verify(token);
      request[REQUEST_USER_KEY] = payload;
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
