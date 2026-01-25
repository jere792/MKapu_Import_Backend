export interface AccountUserResponseDto {
  isActive(): unknown;
  id: number;
  nombreUsuario: string;
  email: string;
  estado: boolean;
  rolNombre: string;
}
