import { Injectable } from '@nestjs/common';
import { hash, compare } from 'bcrypt';
import { IHashProvider } from '../interfaces/hash-provider.interface';

@Injectable()
export class BcryptHashProvider implements IHashProvider {
  private readonly SALT_ROUNDS = 10;

  async hash(plainText: string): Promise<string> {
    return hash(plainText, this.SALT_ROUNDS);
  }

  async compare(plainText: string, hashedText: string): Promise<boolean> {
    return compare(plainText, hashedText);
  }
}
