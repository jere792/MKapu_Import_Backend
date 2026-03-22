import { Bank } from '../../domain/entity/bank-domain-entity';
import { ServiceType } from '../../domain/entity/service-type-domain-entity';
import { BankOrmEntity } from '../../infrastructure/entity/bank-orm.entity';
import { ServiceTypeOrmEntity } from '../../infrastructure/entity/service-type-orm.entity';
import {
  BankResponseDto,
  ServiceTypeResponseDto,
} from '../dto/out';

export class BankMapper {
  static toDomainBank(orm: BankOrmEntity): Bank {
    return Bank.create({
      id_banco:     orm.id_banco,
      nombre_banco: orm.nombre_banco,
    });
  }

  static toDomainServiceType(orm: ServiceTypeOrmEntity): ServiceType {
    return ServiceType.create({
      id_servicio:     orm.id_servicio,
      id_banco:        orm.id_banco,
      nombre_servicio: orm.nombre_servicio,
      descripcion:     orm.descripcion,
    });
  }

  static toBankResponseDto(domain: Bank): BankResponseDto {
    return {
      id_banco:     domain.id_banco!,
      nombre_banco: domain.nombre_banco,
    };
  }

  static toServiceTypeResponseDto(domain: ServiceType): ServiceTypeResponseDto {
    return {
      id_servicio:     domain.id_servicio!,
      id_banco:        domain.id_banco,
      nombre_servicio: domain.nombre_servicio,
      descripcion:     domain.descripcion,
    };
  }
}