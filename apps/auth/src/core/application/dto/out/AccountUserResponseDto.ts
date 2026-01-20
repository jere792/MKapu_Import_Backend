/* auth/src/core/application/dto/out/AccountUserResponseDto.ts */
export interface AccountUserResponseDto {
  isActive(): unknown;
  id: string;
  nombreUsuario: string;
  email: string;
  estado: boolean;
  rolNombre: string;
}
