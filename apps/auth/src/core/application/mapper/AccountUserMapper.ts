/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { AccountUser } from '../../domain/entity/account-user';
import { AccountUserOrmEntity } from '../../infrastructure/entity/account-user-orm-entity';
import { AccountUserResponseDto } from '../dto/out/AccountUserResponseDto';

export class AccountUserMapper {
  static toDomain(ormEntity: AccountUserOrmEntity): AccountUser {
    const email = ormEntity.usuario ? ormEntity.usuario.email : '';

    return AccountUser.create({
      id: ormEntity.id_cuenta_usuario,
      nombreUsuario: ormEntity.username,
      contrasenia: ormEntity.password,
      email: email,
      rolNombre: ormEntity.roles?.[0]?.nombre || 'SIN_ROL',
    });
  }
  static toAccountUserResponseDto(
    entity: AccountUserOrmEntity,
  ): AccountUserResponseDto {
    return {
      id: entity.id_cuenta_usuario,
      nombreUsuario: entity.username,
      email: entity.usuario?.email || '',
      estado: entity.activo === 1,
      rolNombre: entity.roles?.[0]?.nombre || '',
      isActive(): boolean {
        return entity.activo === 1;
      },
    };
  }
}
