/* auth/src/core/infrastructure/adapters/bcrypt-hash-adapter.ts */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PasswordHasherPort } from '../../domain/ports/out/password-hash-port-out';

@Injectable()
export class BcryptHasherAdapter implements PasswordHasherPort {
  // Puedes usar config service aquí si quieres hacer configurable el SALT
  private readonly SALT_ROUNDS = 10;

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  }

  async comparePassword(plainText: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainText, hash);
  }
}
