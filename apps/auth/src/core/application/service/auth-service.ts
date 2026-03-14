import {
  Inject,
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AccountUserPortsIn } from '../../domain/ports/in/account-user-port.in';
import { PasswordHasherPort } from '../../domain/ports/out/password-hash-port-out';
import { AuthRepository } from '../../infrastructure/adapters/out/repository/auth-repository';

import { LoginDto } from '../dto/in/loginDto';
import { LoginResponseDto } from '../dto/out/LoginResponseDto';
import { AccountUserResponseDto } from '../dto/out/AccountUserResponseDto';

import { AccountUserMapper } from '../mapper/AccountUserMapper';
import { SedeTcpProxy } from '../../infrastructure/adapters/out/TCP/sede-tcp.proxy';

@Injectable()
export class AuthService implements AccountUserPortsIn {
  constructor(
    @Inject('AccountUserPortsOut')
    private readonly repository: AuthRepository,
    private readonly jwtService: JwtService,
    @Inject('PasswordHasherPort')
    private readonly passwordHasher: PasswordHasherPort,
    private readonly sedeTcpProxy: SedeTcpProxy,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { username, password } = loginDto;

    const accountOrm =
      await this.repository.findAccountByUsernameWithRelations(username);

    if (!accountOrm) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!accountOrm.activo) {
      throw new ForbiddenException(
        'Cuenta desactivada. Comunícate con tu supervisor.',
      );
    }
    const isPasswordValid = await this.passwordHasher.comparePassword(
      password,
      accountOrm.contraseña,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    this.repository
      .updateLastAccess(accountOrm.id_cuenta)
      .catch((err) => console.error('Error actualizando ultimo acceso', err));

    let sedeNombre = '';
    try {
      const sede = await this.sedeTcpProxy.getSedeById(
        String(accountOrm.id_sede),
      );
      sedeNombre = sede?.nombre ?? '';
    } catch {
      sedeNombre = '';
    }

    const payload = {
      sub: accountOrm.id_cuenta,
      username: accountOrm.nom_usu,
      id_usuario: accountOrm.id_usuario_val,
      id_sede: accountOrm.id_sede,
      roles: (accountOrm.roles ?? []).map((r) => r.nombre),
    };

    const access_token = this.jwtService.sign(payload);

    return AccountUserMapper.toLoginResponseDto({
      access_token,
      account: accountOrm,
      sedeNombre,
    });
  }

  async createAccountForUser(
    userId: number,
    username: string,
    passwordRaw: string,
    roleId: number,
    idSede: number,
  ): Promise<any> {
    const hashedPassword = await this.passwordHasher.hashPassword(passwordRaw);

    const existingAccount = await this.repository.findByUsername(username);
    if (existingAccount) {
      throw new ConflictException('El nombre de usuario ya existe');
    }

    const account = await this.repository.createAccount({
      userId,
      username,
      password: hashedPassword,
      id_sede: idSede,
    });

    await this.repository.assignRole(account.id, roleId);

    const fullAccountDomain = await this.repository.findById(account.id);
    if (!fullAccountDomain) {
      throw new Error('Error al recuperar la cuenta creada');
    }

    return AccountUserMapper.toDto(fullAccountDomain);
  }
  async refreshProfile(username: string) {
    const accountOrm =
      await this.repository.findAccountByUsernameWithRelations(username);

    return AccountUserMapper.toLoginResponseDto({
      access_token: '',
      account: accountOrm,
      sedeNombre: '',
    });
  }
}
