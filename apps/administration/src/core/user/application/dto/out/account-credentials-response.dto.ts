/* ============================================
   administration/src/core/user/application/dto/out/account-credentials-response.dto.ts
   ============================================ */

export interface AccountCredentialsResponseDto {
  id_cuenta: number;
  id_usuario: number;
  nom_usu: string;
  email_emp: string;
  updatedAt: Date;
  message: string;
}