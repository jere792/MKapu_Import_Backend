import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountUserPortsIn } from '../../domain/ports/in/account-user-port.in';
import { LoginDto } from '../dto/in/loginDto';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from '../../infrastructure/repository/auth-repository';
import { LoginResponseDto } from '../dto/out/LoginResponseDto';
import { PasswordHasherPort } from '../../domain/ports/out/password-hash-port-out';

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
    const user = await this.repository.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (!user.estado) {
      throw new UnauthorizedException('La cuenta está desactivada o bloqueada');
    }
    const getPasswordById = await this.repository.getPasswordById(user.id);
    const isPasswordValid = await this.passwordHasher.comparePassword(
      password,
      getPasswordById,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    this.repository
      .updateLastAccess(String(user.id))
      .catch((err) => console.error('Error actualizando ultimo acceso', err));
    const payload = {
      sub: user.id,
      username: user.nombreUsuario,
      role: user.rolNombre,
    };

    const token = this.jwtService.sign(payload);
    return {
      token,
      user: {
        id: user.id,
        nombre_usuario: user.nombreUsuario,
        email: user.email,
        rol_nombre: user.rolNombre,
      },
    };
  }
  async createAccountForUser(
    userId: number,
    username: string,
    passwordRaw: string,
  ): Promise<any> {
    const hashedPassword = await this.passwordHasher.hashPassword(passwordRaw);
    // 2. Mandar a guardar al repositorio
    await this.repository.createAccount({
      userId,
      username,
      password: hashedPassword,
    });
  }
}
