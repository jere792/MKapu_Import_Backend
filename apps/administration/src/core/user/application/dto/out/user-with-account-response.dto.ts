import { UserResponseDto } from './user-response-dto';

export class AccountUserDto {
  id_cuenta: number;
  nom_usu: string;
  email_emp: string;
  activo: boolean;
  ultimo_acceso: Date;
  rolNombre: string;
}

export class UserWithAccountResponseDto {
  usuario: UserResponseDto;
  cuenta_usuario: AccountUserDto | null;
}
