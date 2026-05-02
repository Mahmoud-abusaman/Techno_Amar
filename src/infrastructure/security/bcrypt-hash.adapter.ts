import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IHashPort } from 'src/domain/ports/hash.port';

const SALT_ROUNDS = 10;

@Injectable()
export class BcryptHashAdapter implements IHashPort {
  hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, SALT_ROUNDS);
  }

  compare(plainText: string, hashedText: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashedText);
  }
}
