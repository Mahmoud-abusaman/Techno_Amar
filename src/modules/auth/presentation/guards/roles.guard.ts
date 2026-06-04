import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole } from '@/generated/prisma/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { REQUEST_USER_KEY } from './jwt-auth.guard';
import { AccessTokenPayload } from '@auth/domain/ports/token.port';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { [REQUEST_USER_KEY]: AccessTokenPayload }>();

    const user = request[REQUEST_USER_KEY];
    if (!user) throw new ForbiddenException('User not authenticated');

    if (!requiredRoles.some((role) => user.role === role)) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
