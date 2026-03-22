// administration/src/core/user/application/dto/in/change-account-credentials-dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';

export class ChangeAccountCredentialsDto {
  id_usuario: number; // inyectado desde el param :id

  @ApiPropertyOptional({
    description: 'Nombre de usuario.',
  })
  nom_usu?: string;

  @ApiPropertyOptional({
    description: 'Nueva contraseña.',
  })
  nueva_contraseña?: string;
}