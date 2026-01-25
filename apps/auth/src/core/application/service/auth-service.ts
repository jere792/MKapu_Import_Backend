import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountUserPortsIn } from '../../domain/ports/in/account-user-port.in';
import { LoginDto } from '../dto/in/loginDto';
import { JwtService } from '@nestjs/jwt';
import { LoginResponseDto } from '../dto/out/LoginResponseDto';
import { PasswordHasherPort } from '../../domain/ports/out/password-hash-port-out';
import { AccountUserResponseDto } from '../dto/out/AccountUserResponseDto';
import { AccountUserMapper } from '../mapper/AccountUserMapper';
import { AuthRepository } from '../../infrastructure/adapters/out/repository/auth-repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService implements AccountUserPortsIn {
  constructor(
    @Inject('AccountUserPortsOut')
    private readonly repository: AuthRepository,
    private readonly jwtService: JwtService,
    @Inject('PasswordHasherPort')
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { username, password } = loginDto;
    const accountDomain = await this.repository.findByUsername(username);

    if (!accountDomain) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (!accountDomain.estado) {
      throw new UnauthorizedException('La cuenta está desactivada o bloqueada');
    }
    const passwordHash = await this.repository.getPasswordById(
      accountDomain.id,
    );
    if (!passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    this.repository
      .updateLastAccess(accountDomain.id)
      .catch((err) => console.error('Error actualizando ultimo acceso', err));
    const roleName = accountDomain.rolNombre || '';

    const payload = {
      sub: accountDomain.id,
      username: accountDomain.nombreUsuario,
      role: roleName,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: accountDomain.id,
        nombre_usuario: accountDomain.nombreUsuario,
        email: accountDomain.email,
        rol_nombre: roleName,
      },
    };
  }

  async createAccountForUser(
    userId: number,
    username: string,
    passwordRaw: string,
    roleId: number = 2,
  ): Promise<AccountUserResponseDto> {
    const hashedPassword = await this.passwordHasher.hashPassword(passwordRaw);

    const account = await this.repository.createAccount({
      userId,
      username,
      password: hashedPassword,
    });
    await this.repository.assignRole(account.id, roleId);

    const accountOrmEntity = AccountUserMapper.toOrmEntity(account);
    return AccountUserMapper.toAccountUserResponseDto(accountOrmEntity);
  }
}
