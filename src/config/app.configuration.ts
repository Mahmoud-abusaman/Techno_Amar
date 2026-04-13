import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || '3000'),
  database: {
    url: process.env.DATABASE_URL,
  },

  //   upload: {
  //     path: process.env.UPLOAD_PATH || './uploads',
  //     maxSize: Number(process.env.MAX_FILE_SIZE || '5242880'),
  //   },

  //   mail: {
  //     host: process.env.MAIL_HOST,
  //     port: Number(process.env.MAIL_PORT || '25'),
  //     user: process.env.MAIL_USER,
  //     pass: process.env.MAIL_PASS,
  //     from: process.env.MAIL_FROM,
  //   },
  //   imagekit: {
  //     imagekitPrivateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  //   }
}));
