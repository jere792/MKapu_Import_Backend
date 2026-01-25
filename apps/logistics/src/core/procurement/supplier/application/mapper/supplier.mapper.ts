
/* ============================================
   APPLICATION LAYER - MAPPER
   logistics/src/core/procurement/supplier/application/mapper/supplier.mapper.ts
   ============================================ */

import { Supplier } from '../../domain/entity/supplier-domain-entity';
import { RegisterSupplierDto, UpdateSupplierDto } from '../dto/in';
import {
  SupplierResponseDto,
  SupplierListResponse,
  SupplierDeletedResponseDto,
} from '../dto/out';
import { SupplierOrmEntity } from '../../infrastructure/entity/supplier-orm.entity';

export class SupplierMapper {
  static toResponseDto(supplier: Supplier): SupplierResponseDto {
    return {
      id_proveedor: supplier.id_proveedor!,
      razon_social: supplier.razon_social,
      ruc: supplier.ruc,
      contacto: supplier.contacto,
      email: supplier.email,
      telefono: supplier.telefono,
      dir_fiscal: supplier.dir_fiscal,
      estado: supplier.estado!,
    };
  }

  static toListResponse(suppliers: Supplier[]): SupplierListResponse {
    return {
      suppliers: suppliers.map((s) => this.toResponseDto(s)),
      total: suppliers.length,
    };
  }

  static fromRegisterDto(dto: RegisterSupplierDto): Supplier {
    return Supplier.create({
      razon_social: dto.razon_social,
      ruc: dto.ruc,
      contacto: dto.contacto,
      email: dto.email,
      telefono: dto.telefono,
      dir_fiscal: dto.dir_fiscal,
      estado: true,
    });
  }

  static fromUpdateDto(supplier: Supplier, dto: UpdateSupplierDto): Supplier {
    return Supplier.create({
      id_proveedor: supplier.id_proveedor,
      razon_social: dto.razon_social ?? supplier.razon_social,
      ruc: dto.ruc ?? supplier.ruc,
      contacto: dto.contacto ?? supplier.contacto,
      email: dto.email ?? supplier.email,
      telefono: dto.telefono ?? supplier.telefono,
      dir_fiscal: dto.dir_fiscal ?? supplier.dir_fiscal,
      estado: supplier.estado,
    });
  }

  static withStatus(supplier: Supplier, estado: boolean): Supplier {
    return Supplier.create({
      id_proveedor: supplier.id_proveedor,
      razon_social: supplier.razon_social,
      ruc: supplier.ruc,
      contacto: supplier.contacto,
      email: supplier.email,
      telefono: supplier.telefono,
      dir_fiscal: supplier.dir_fiscal,
      estado: estado,
    });
  }

  static toDeletedResponse(id_proveedor: number): SupplierDeletedResponseDto {
    return {
      id_proveedor,
      message: 'Proveedor eliminado exitosamente',
      deletedAt: new Date(),
    };
  }

  static toDomainEntity(supplierOrm: SupplierOrmEntity): Supplier {
    return Supplier.create({
      id_proveedor: supplierOrm.id_proveedor,
      razon_social: supplierOrm.razon_social,
      ruc: supplierOrm.ruc,
      contacto: supplierOrm.contacto,
      email: supplierOrm.email,
      telefono: supplierOrm.telefono,
      dir_fiscal: supplierOrm.dir_fiscal,
      estado: supplierOrm.estado,
    });
  }

  static toOrmEntity(supplier: Supplier): SupplierOrmEntity {
    const supplierOrm = new SupplierOrmEntity();
    if (supplier.id_proveedor) {
      supplierOrm.id_proveedor = supplier.id_proveedor;
    }
    supplierOrm.razon_social = supplier.razon_social;
    supplierOrm.ruc = supplier.ruc;
    supplierOrm.contacto = supplier.contacto;
    supplierOrm.email = supplier.email;
    supplierOrm.telefono = supplier.telefono;
    supplierOrm.dir_fiscal = supplier.dir_fiscal;
    supplierOrm.estado = supplier.estado ?? true;
    return supplierOrm;
  }
}
