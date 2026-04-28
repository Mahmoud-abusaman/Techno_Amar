import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { ActiveUserData } from '../interfaces/active-user-data.interface';

export const REQUEST_USER_KEY = 'user';

export const ActiveUser = createParamDecorator(
  (field: keyof ActiveUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { [REQUEST_USER_KEY]: ActiveUserData }>();
    const user = request[REQUEST_USER_KEY];

    return field ? user?.[field] : user;
  },
);
