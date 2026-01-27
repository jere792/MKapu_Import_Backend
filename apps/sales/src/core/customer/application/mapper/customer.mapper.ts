/* ============================================
   UPDATED: CustomerMapper - Accediendo a props de la entidad de dominio
   sales/src/core/customer/application/mapper/customer.mapper.ts
   ============================================ */

import { Customer } from '../../domain/entity/customer-domain-entity';
import { RegisterCustomerDto, UpdateCustomerDto } from '../dto/in';
import {
  CustomerResponseDto,
  CustomerListResponse,
  CustomerDeletedResponseDto,
} from '../dto/out';
import { CustomerOrmEntity } from '../../infrastructure/entity/customer-orm.entity';
import { v4 as uuidv4 } from 'uuid';

export class CustomerMapper {
  static toResponseDto(customer: Customer): CustomerResponseDto {
    // Acceder a props si la entidad de dominio las encapsula
    const props = (customer as any).props || customer;
    
    return {
      id_cliente: props.id_cliente || customer.id_cliente,
      tipo_doc: props.tipo_doc || customer.tipo_doc,
      num_doc: props.num_doc || customer.num_doc,
      razon_social: props.razon_social || customer.razon_social || null,
      nombres: props.nombres || customer.nombres || null,
      direccion: props.direccion || customer.direccion || null,
      email: props.email || customer.email || null,
      telefono: props.telefono || customer.telefono || null,
      estado: props.estado !== undefined ? props.estado : customer.estado,
      displayName: customer.getDisplayName(),
      invoiceType: customer.getInvoiceType(),
    };
  }

  static toListResponse(customers: Customer[]): CustomerListResponse {
    return {
      customers: customers.map((c) => this.toResponseDto(c)),
      total: customers.length,
    };
  }

  static fromRegisterDto(dto: RegisterCustomerDto): Customer {
    return Customer.create({
      id_cliente: uuidv4(),
      tipo_doc: dto.tipo_doc,
      num_doc: dto.num_doc,
      razon_social: dto.razon_social || undefined,
      nombres: dto.nombres || undefined,
      direccion: dto.direccion || undefined,
      email: dto.email || undefined,
      telefono: dto.telefono || undefined,
      estado: true,
    });
  }

  static fromUpdateDto(customer: Customer, dto: UpdateCustomerDto): Customer {
    const props = (customer as any).props || customer;
    
    return Customer.create({
      id_cliente: props.id_cliente || customer.id_cliente,
      tipo_doc: props.tipo_doc || customer.tipo_doc,
      num_doc: props.num_doc || customer.num_doc,
      razon_social: dto.razon_social ?? (props.razon_social || customer.razon_social),
      nombres: dto.nombres ?? (props.nombres || customer.nombres),
      direccion: dto.direccion ?? (props.direccion || customer.direccion),
      email: dto.email ?? (props.email || customer.email),
      telefono: dto.telefono ?? (props.telefono || customer.telefono),
      estado: props.estado !== undefined ? props.estado : customer.estado,
    });
  }

  static withStatus(customer: Customer, estado: boolean): Customer {
    const props = (customer as any).props || customer;
    
    return Customer.create({
      id_cliente: props.id_cliente || customer.id_cliente,
      tipo_doc: props.tipo_doc || customer.tipo_doc,
      num_doc: props.num_doc || customer.num_doc,
      razon_social: props.razon_social || customer.razon_social,
      nombres: props.nombres || customer.nombres,
      direccion: props.direccion || customer.direccion,
      email: props.email || customer.email,
      telefono: props.telefono || customer.telefono,
      estado: estado,
    });
  }

  static toDeletedResponse(id_cliente: string): CustomerDeletedResponseDto {
    return {
      id_cliente,
      message: 'Cliente eliminado exitosamente',
      deletedAt: new Date(),
    };
  }

  static toDomainEntity(customerOrm: CustomerOrmEntity): Customer {
    // Convertir estado de Buffer a boolean si es necesario
    let estado = true;
    if (typeof customerOrm.estado === 'boolean') {
      estado = customerOrm.estado;
    } else if (typeof customerOrm.estado === 'number') {
      estado = customerOrm.estado === 1;
    } else if (Buffer.isBuffer(customerOrm.estado)) {
      estado = (customerOrm.estado as any)[0] === 1;
    }

    return Customer.create({
      id_cliente: customerOrm.id_cliente,
      tipo_doc: customerOrm.tipo_doc as any,
      num_doc: customerOrm.num_doc,
      razon_social: customerOrm.razon_social || undefined,
      nombres: customerOrm.nombres || undefined,
      direccion: customerOrm.direccion || undefined,
      email: customerOrm.email || undefined,
      telefono: customerOrm.telefono || undefined,
      estado: estado,
    });
  }

  static toOrmEntity(customer: Customer): CustomerOrmEntity {
    const props = (customer as any).props || customer;
    
    const customerOrm = new CustomerOrmEntity();
    customerOrm.id_cliente = props.id_cliente || customer.id_cliente;
    customerOrm.tipo_doc = props.tipo_doc || customer.tipo_doc;
    customerOrm.num_doc = props.num_doc || customer.num_doc;
    customerOrm.razon_social = props.razon_social || customer.razon_social || null;
    customerOrm.nombres = props.nombres || customer.nombres || null;
    customerOrm.direccion = props.direccion || customer.direccion || null;
    customerOrm.email = props.email || customer.email || null;
    customerOrm.telefono = props.telefono || customer.telefono || null;
    customerOrm.estado = props.estado !== undefined ? props.estado : (customer.estado ?? true);
    return customerOrm;
  }
}