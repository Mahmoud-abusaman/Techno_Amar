import {
  Catch,
  HttpException,
  ExceptionFilter,
  ArgumentsHost,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiErrorResponse } from '../types/util.types';
import { Request, Response } from 'express';
import { Prisma } from 'generated/prisma/client';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse: ApiErrorResponse = {
      timestamp: new Date().toISOString(),
      success: false,
      statusCode: status,
      path: request.url,
      message: exception.message || 'something went wrong',
    };

    response.status(status).json(errorResponse);
  }
}

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientUnknownRequestError,
  Prisma.PrismaClientValidationError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const defaultError: ApiErrorResponse = {
      timestamp: new Date().toISOString(),
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      path: req.url,
      message: 'Invalid data or operation. Please check your input',
    };

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          defaultError.statusCode = HttpStatus.CONFLICT;
          const target = (exception.meta?.target as string[])?.join(', ');
          defaultError.message = target
            ? `Unique constraint failed on fields: (${target})`
            : 'Unique constraint failed';
          break;
        case 'P2025':
          defaultError.statusCode = HttpStatus.NOT_FOUND;
          defaultError.message = (exception.meta?.cause as string) || 'Record not found';
          break;
        case 'P2003':
          defaultError.statusCode = HttpStatus.CONFLICT;
          defaultError.message = 'Invalid relation reference';
          break;
        case 'P2000':
          defaultError.statusCode = HttpStatus.BAD_REQUEST;
          defaultError.message = 'Value too long for column';
          break;
        case 'P2014':
          defaultError.statusCode = HttpStatus.CONFLICT;
          defaultError.message = 'Relation constraint failed';
          break;
        case 'P2024':
          defaultError.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
          defaultError.message = 'Database connection timeout';
          break;
        default:
          defaultError.message =
            exception.message.split('\n').pop()?.trim() || exception.message;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      defaultError.message =
        exception.message.split('\n').pop()?.trim() || 'Validation error in database operation';
    }

    return res.status(defaultError.statusCode).json(defaultError);
  }
}

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const responseBody: any = exception.getResponse();
    const messages = Array.isArray(responseBody.message)
      ? responseBody.message
      : [responseBody.message];

    const conflictMessage = messages.find((msg) =>
      msg.toLowerCase().includes('but not both'),
    );
    const hasXorMissingError = messages.some(
      (msg) =>
        msg.toLowerCase().includes('please provide email or phone number') &&
        !msg.toLowerCase().includes('but not both'),
    );
    const hasPasswordError = messages.some((msg) => msg.toLowerCase().includes('password'));
    const isOnlyConflict =
      conflictMessage && messages.every((msg) => msg.toLowerCase().includes('but not both'));

    const isRegister = req.url.includes('/auth/register');
    const isLogin = req.url.includes('/auth/login');
    const isResetPassword = req.url.includes('/auth/reset-password');
    const isBodyReallyEmpty =
      Object.keys(req.body || {}).length === 0 && (isLogin || isRegister || isResetPassword);

    const isBothMissing =
      isBodyReallyEmpty ||
      (hasXorMissingError &&
        hasPasswordError &&
        messages.every(
          (msg) =>
            msg.toLowerCase().includes('provide email or phone number') ||
            msg.toLowerCase().includes('password'),
        ));

    const errorResponse: ApiErrorResponse = {
      timestamp: new Date().toISOString(),
      success: false,
      statusCode: status,
      path: req.url,
      message: isOnlyConflict
        ? 'provide either email or phoneNumber, but not both.'
        : isBodyReallyEmpty && isRegister
          ? 'Please provide the email, phoneNumber, password and fullName fields'
          : isBodyReallyEmpty && isResetPassword
            ? 'Please provide newPassword and confirmPassword fields'
            : isBothMissing && isLogin
              ? 'provide either email or phoneNumber and the password.'
              : hasXorMissingError && hasPasswordError
                ? 'Please provide email or phone number with the password'
                : messages.length > 1
                  ? 'Validation failed'
                  : messages[0] || 'Validation failed',
      fields:
        messages.length > 1 && !isOnlyConflict && !isBothMissing
          ? Array.from(new Set(messages)).map((msg: any) => {
              const msgStr = msg.toString();
              let field = msgStr.split(' ')[0];
              if (msgStr.includes('.property ')) {
                const parts = msgStr.split('.property ');
                field = parts[0] + '.' + parts[1].split(' ')[0];
              } else if (msgStr.toLowerCase().includes('password')) {
                field = 'Password';
              } else if (msgStr.toLowerCase().includes('email')) {
                field = 'Email';
              } else if (msgStr.toLowerCase().includes('phone')) {
                field = 'Phone';
              }
              return { field, message: msgStr };
            })
          : undefined,
    };

    res.status(status).json(errorResponse);
  }
}

@Catch()
export class UncaughtExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof Error ? exception.message : 'Internal server error';

    const errorResponse: ApiErrorResponse = {
      timestamp: new Date().toISOString(),
      success: false,
      statusCode: status,
      path: req.url,
      message,
    };

    return res.status(status).json(errorResponse);
  }
}
