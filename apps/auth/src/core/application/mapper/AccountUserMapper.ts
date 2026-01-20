/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { AccountUser } from '../../domain/entity/account-user';
import { AccountUserOrmEntity } from '../../infrastructure/entity/account-user-orm-entity';
import { AccountUserResponseDto } from '../dto/out/AccountUserResponseDto';

export class AccountUserMapper {
  static toDomain(ormEntity: AccountUserOrmEntity): AccountUser {
    return AccountUser.create({
      id: ormEntity.id,
      nombreUsuario: ormEntity.username,
      contrasenia: ormEntity.password,
      email: ormEntity.email,
      rolNombre: ormEntity.roles?.[0]?.nombre || '',
    });
  }
  static toAccountUserResponseDto(raw: any): AccountUserResponseDto {
    return {
      id: raw.cu_id_cuenta,
      nombreUsuario: raw.cu_username,
      email: raw.cu_email_emp,
      estado: raw.cu_estado === 'ACTIVO',
      rolNombre: raw.rol_nombre,
      isActive(): boolean {
        return raw.cu_estado === 'ACTIVO';
      },
    };
  }
}
