import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || '3000'),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    audience: process.env.JWT_AUDIENCE || 'techno-amar-api',
    accessTokenTtl: Number(process.env.JWT_ACCESS_TOKEN_TTL || 900),
    refreshTokenTtl: Number(process.env.JWT_REFRESH_TOKEN_TTL || 604800),
    passwordResetSecret:
      process.env.JWT_PASSWORD_RESET_SECRET || 'password-reset-secret-change-me',
    passwordResetTtl: Number(process.env.JWT_PASSWORD_RESET_TTL || 600),
  },
}));
