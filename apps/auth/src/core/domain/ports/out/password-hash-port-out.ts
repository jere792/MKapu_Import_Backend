/* auth/src/core/domain/ports/out/password-hash-port-out.ts */
export interface PasswordHasherPort {
  hashPassword(password: string): Promise<string>;
  comparePassword(plainText: string, hash: string): Promise<boolean>;
}
