export class LoginUserProfileDto {
  id_usuario: number;
  nombres: string;
  ape_pat: string;
  ape_mat: string;
  dni: string;
  email?: string | null;
}

export class LoginRoleDto {
  id_rol: number;
  nombre: string;
}

export class LoginPermissionDto {
  id_permiso: number;
  nombre: string;
}

export class LoginAccountDto {
  id_cuenta: number;
  username: string; 
  email_emp: string;
  activo: boolean;

  id_sede: number;
  sede_nombre: string;

  usuario: LoginUserProfileDto;

  roles: LoginRoleDto[];
  permisos: LoginPermissionDto[];
}

export class LoginResponseDto {
  access_token: string;
  account: LoginAccountDto;
}