//application/mapper/headquarters.mapper.ts
/* ============================================
   administration/src/core/headquarters/application/mapper/headquarters.mapper.ts
   ============================================ */

import { Headquarters } from "../../domain/entity/headquarters-domain-entity";
import { HeadquartersOrmEntity } from "../../infrastructure/entity/headquarters-orm.entity";
import { RegisterHeadquartersDto } from "../dto/in/register-headquarters-dto";
import { UpdateHeadquartersDto } from "../dto/in/update-headquarters-dto";
import { HeadquartersDeletedResponseDto } from "../dto/out/headquarters-deleted-response-dto";
import { HeadquartersListResponse } from "../dto/out/headquarters-list-response";

import { HeadquartersResponseDto } from "../dto/out/headquarters-response-dto";

export class HeadquartersMapper {
   static toResponseDto(entity: Headquarters): HeadquartersResponseDto {
      return {
         id_sede: entity.id_sede,
         codigo: entity.codigo,
         nombre: entity.nombre,
         ciudad: entity.ciudad,
         departamento: entity.departamento,
         direccion: entity.direccion,
         telefono: entity.telefono,
         activo: entity.isActive(),
      }
   }

   static toListResponse(headquarters: Headquarters[]): HeadquartersListResponse {
      return {
         headquarters: headquarters.map((hq) => this.toResponseDto(hq)),
         total: headquarters.length,
      };
   }

   static fromRegisterDto(dto: RegisterHeadquartersDto): Headquarters {
      return Headquarters.create({
         codigo: dto.codigo,
         nombre: dto.nombre,
         ciudad: dto.ciudad,
         departamento: dto.departamento,
         direccion: dto.direccion,
         telefono: dto.telefono,
         activo: true,
      });
   }

   static fromUpdateDto(headquarter: Headquarters, dto: UpdateHeadquartersDto): Headquarters {
      return Headquarters.create({
         id_sede: headquarter.id_sede,
         codigo: headquarter.codigo,
         nombre: dto.nombre ?? headquarter.nombre,
         ciudad: dto.ciudad ??  headquarter.ciudad,
         departamento: dto.departamento ?? headquarter.departamento,
         direccion: dto.direccion ?? headquarter.direccion,
         telefono: dto.telefono ?? headquarter.telefono,
         activo: headquarter.isActive()
      });
   }

   static withStatus(headquarter: Headquarters, activo: boolean): Headquarters {
      return Headquarters.create({
         id_sede: headquarter.id_sede,
         codigo: headquarter.codigo,
         nombre: headquarter.nombre,
         ciudad: headquarter.ciudad,
         departamento: headquarter.departamento,
         direccion: headquarter.direccion,
         telefono: headquarter.telefono,
         activo: activo
      });
   }

   static toDeletedResponseDto(id_sede: number): HeadquartersDeletedResponseDto {
      return {
         id_sede: id_sede,
         message: 'Sede eliminada correctamente',
         deletedAt: new Date(),
      };
   }

   static toDomainEntity(ormEntity: HeadquartersOrmEntity): Headquarters {
   const raw = (ormEntity as any).activo;

   const activo =
      typeof raw === 'boolean'
         ? raw
         : typeof raw === 'number'
         ? raw === 1
         : typeof raw === 'string'
            ? raw === '1' || raw.toLowerCase() === 'true'
            : Buffer.isBuffer(raw)
               ? raw.length > 0 && raw[0] === 1
               : raw instanceof Uint8Array
               ? raw.length > 0 && raw[0] === 1
               : Boolean(raw);

   return Headquarters.create({
      id_sede: ormEntity.id_sede,
      codigo: ormEntity.codigo,
      nombre: ormEntity.nombre,
      ciudad: ormEntity.ciudad,
      departamento: ormEntity.departamento,
      direccion: ormEntity.direccion,
      telefono: ormEntity.telefono,
      activo,
   });
   }

   static toOrmEntity(headquarter: Headquarters): HeadquartersOrmEntity {
      const ormEntity = new HeadquartersOrmEntity();
      ormEntity.id_sede = headquarter.id_sede;
      ormEntity.codigo = headquarter.codigo;
      ormEntity.nombre = headquarter.nombre;
      ormEntity.ciudad = headquarter.ciudad;
      ormEntity.departamento = headquarter.departamento;
      ormEntity.direccion = headquarter.direccion;
      ormEntity.telefono = headquarter.telefono;
      ormEntity.activo = headquarter.isActive();
      return ormEntity;
   }
}