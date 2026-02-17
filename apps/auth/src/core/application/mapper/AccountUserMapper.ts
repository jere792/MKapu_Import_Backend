/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { AccountUser } from '../../domain/entity/account-user';
import { AccountUserOrmEntity } from '../../infrastructure/entity/account-user-orm-entity';
import { AccountUserResponseDto } from '../dto/out/AccountUserResponseDto';
import { LoginResponseDto } from '../dto/out/LoginResponseDto';

export class AccountUserMapper {
  static toDomain(ormEntity: AccountUserOrmEntity): AccountUser {
    const email = ormEntity.usuario?.email || ormEntity.email_emp || '';

    return AccountUser.create({
      id: ormEntity.id_cuenta,
      nombreUsuario: ormEntity.nom_usu,
      contrasenia: ormEntity.contraseña,
      email: email,
      rolNombre: ormEntity.roles?.[0]?.nombre || 'SIN_ROL',
      estado: ormEntity.activo,
    });
  }

  static toAccountUserResponseDto(entity: AccountUserOrmEntity): AccountUserResponseDto {
    return {
      id: entity.id_cuenta,
      nombreUsuario: entity.nom_usu,
      email: entity.usuario?.email || entity.email_emp || '',
      estado: entity.activo,
      rolNombre: entity.roles?.[0]?.nombre || '',
      isActive(): boolean {
        return entity.activo;
      },
    };
  }

  static toDomainEntity(ormEntity: AccountUserOrmEntity): AccountUser {
    return AccountUser.create({
      id: ormEntity.id_cuenta,
      nombreUsuario: ormEntity.nom_usu,
      contrasenia: ormEntity.contraseña,
      email: ormEntity.usuario?.email || ormEntity.email_emp || '',
      estado: ormEntity.activo,
      rolNombre: ormEntity.roles && ormEntity.roles.length > 0 ? ormEntity.roles[0].nombre : '',
    });
  }

  static toOrmEntity(domainEntity: AccountUser): AccountUserOrmEntity {
    const ormEntity = new AccountUserOrmEntity();
    ormEntity.id_cuenta = domainEntity.id;
    ormEntity.nom_usu = domainEntity.nombreUsuario;
    ormEntity.contraseña = domainEntity.contrasenia;
    ormEntity.activo = domainEntity.estado;

    return ormEntity;
  }

  static toDto(domain: AccountUser): AccountUserResponseDto {
    return {
      id: domain.id,
      nombreUsuario: domain.nombreUsuario,
      email: domain.email,
      estado: domain.estado,
      rolNombre: domain.rolNombre,
      isActive(): boolean {
        return domain.estado;
      },
    };
  }

  static toLoginResponseDto(params: {
    access_token: string;
    account: AccountUserOrmEntity;
    sedeNombre: string;
  }): LoginResponseDto {
    const { access_token, account, sedeNombre } = params;

    // roles simples
    const roles = (account.roles ?? []).map((r) => ({
      id_rol: r.id_rol,
      nombre: r.nombre,
    }));

    // permisos aplanados (únicos) desde roles.permisos
    const permisosMap = new Map<number, { id_permiso: number; nombre: string }>();
    for (const r of account.roles ?? []) {
      for (const p of r.permisos ?? []) {
        permisosMap.set(p.id_permiso, { id_permiso: p.id_permiso, nombre: p.nombre });
      }
    }

    return {
      access_token,
      account: {
        id_cuenta: account.id_cuenta,
        username: account.nom_usu,
        email_emp: account.email_emp ?? '', 
        activo: account.activo,

        id_sede: account.id_sede,
        sede_nombre: sedeNombre,

        usuario: {
          id_usuario: account.usuario?.id_usuario ?? account.id_usuario_val,
          nombres: account.usuario?.nombres ?? '',
          ape_pat: account.usuario?.ape_pat ?? '',
          ape_mat: account.usuario?.ape_mat ?? '',
          dni: account.usuario?.dni ?? '',
          email: account.usuario?.email ?? account.email_emp ?? null,
        },

        roles,
        permisos: Array.from(permisosMap.values()),
      },
    };

  }
}