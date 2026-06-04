import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AccessTokenPayload } from '@domain/ports/token.port';
import { REQUEST_USER_KEY } from '../guards/jwt-auth.guard';

export const ActiveUser = createParamDecorator(
  (field: keyof AccessTokenPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { [REQUEST_USER_KEY]: AccessTokenPayload }>();
    const user = request[REQUEST_USER_KEY];
    return field ? user?.[field] : user;
  },
);
