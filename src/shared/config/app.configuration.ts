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
      process.env.JWT_PASSWORD_RESET_SECRET ||
      'password-reset-secret-change-me',
    passwordResetTtl: Number(process.env.JWT_PASSWORD_RESET_TTL || 600),
  },
  otp: {
    length: Number(process.env.OTP_LENGTH || 4),
    expireMinutes: Number(process.env.OTP_EXPIRE_MINUTES || 10),
  },
  imagekit: {
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    authExpireSeconds: Number(process.env.IMAGEKIT_AUTH_EXPIRE_SECONDS || 1800),
  },
}));
