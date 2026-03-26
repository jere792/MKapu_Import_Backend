import { Customer } from '../../domain/entity/customer-domain-entity';
import { DocumentType } from '../../domain/entity/document-type-domain-entity';
import { RegisterCustomerDto, UpdateCustomerDto } from '../dto/in';
import {
  CustomerResponseDto,
  CustomerListResponse,
  CustomerDeletedResponseDto,
  DocumentTypeResponseDto,
} from '../dto/out';
import { CustomerOrmEntity } from '../../infrastructure/entity/customer-orm.entity';
import { DocumentTypeOrmEntity } from '../../infrastructure/entity/document-type-orm.entity';
import { v4 as uuidv4 } from 'uuid';

export class CustomerMapper {
  static toResponseDto(customer: Customer): CustomerResponseDto {
    return {
      customerId: customer.id_cliente!,
      documentTypeId: customer.id_tipo_documento,
      documentTypeDescription: customer.tipoDocumentoDescripcion || '',
      documentTypeSunatCode: customer.tipoDocumentoCodSunat || '',
      documentValue: customer.valor_doc,
      name: customer.nombres,
      apellidos: customer.apellidos,
      razonsocial: customer.razon_social,
      address: customer.direccion,
      email: customer.email,
      phone: customer.telefono,
      status: customer.estado,
      displayName: customer.getDisplayName(),
      invoiceType: customer.getInvoiceType(),
    };
  }

  static toListResponse(
    customers: Customer[],
    total: number,
  ): CustomerListResponse {
    return {
      customers: customers.map((c) => this.toResponseDto(c)),
      total,
    };
  }

  private static pickString(...vals: Array<string | undefined | null>): string {
    for (const v of vals) {
      if (v !== undefined && v !== null) {
        const s = String(v).trim();
        if (s.length > 0) return s;
      }
    }
    return '';
  }

  static fromRegisterDto(
    dto: RegisterCustomerDto,
    tipoDocumentoCodSunat?: string,
  ): Customer {
    const businessName = this.pickString(
      (dto as any).businessName,
      dto.razon_social,
    );

    const name = this.pickString(dto.name, (dto as any).nombres);

    const lastName = this.pickString(dto.apellidos, (dto as any).lastName);

    let nombres = name;
    let apellidos: string | undefined = lastName || undefined;
    let razon_social: string | undefined = businessName || undefined;

    if (tipoDocumentoCodSunat === '06') {
      razon_social = businessName || name;
      nombres = '';
      apellidos = undefined;
    } else if (tipoDocumentoCodSunat === '01') {
      nombres = name;
      apellidos = lastName || undefined;
      razon_social = undefined;
    } else {
      razon_social = businessName || undefined;
      nombres = name;
      apellidos = lastName || undefined;
    }

    return Customer.create({
      id_cliente: uuidv4(),
      id_tipo_documento: dto.documentTypeId,
      valor_doc: dto.documentValue,
      nombres,
      apellidos,
      razon_social,
      direccion: dto.address ?? undefined,
      email: dto.email ?? undefined,
      telefono: dto.phone ?? undefined,
      estado: true,
      tipoDocumentoCodSunat,
    });
  }

  static fromUpdateDto(
    customer: Customer,
    dto: UpdateCustomerDto,
    tipoDocumentoCodSunat?: string,
  ): Customer {
    const tipoSunat = tipoDocumentoCodSunat ?? customer.tipoDocumentoCodSunat;

    const incomingBusinessName = this.pickString(
      (dto as any).businessName,
      (dto as any).razon_social,
      (dto as any).razonSocial,
    );
    const incomingName = this.pickString(
      (dto as any).name,
      (dto as any).nombres,
    );
    const incomingLastName = this.pickString(
      (dto as any).lastName,
      (dto as any).apellido,
      (dto as any).apellidos,
    );

    const baseDocumentTypeId = dto.documentTypeId ?? customer.id_tipo_documento;
    const baseValorDoc = dto.documentValue ?? customer.valor_doc;
    const baseAddress = dto.address ?? customer.direccion;
    const baseEmail = dto.email ?? customer.email;
    const basePhone = dto.phone ?? customer.telefono;

    let finalRazonSocial = customer.razon_social ?? undefined;
    let finalNombres = customer.nombres || '';
    let finalApellidos = customer.apellidos ?? undefined;

    if (tipoSunat === '06') {
      finalRazonSocial =
        incomingBusinessName || customer.razon_social || undefined;
      finalNombres = '';
      finalApellidos = undefined;
    } else if (tipoSunat === '01') {
      finalNombres = incomingName || customer.nombres || '';
      finalApellidos = incomingLastName || customer.apellidos || undefined;
      finalRazonSocial = undefined;
    } else {
      finalRazonSocial =
        incomingBusinessName || customer.razon_social || undefined;
      finalNombres = incomingName || customer.nombres || '';
      finalApellidos = incomingLastName || customer.apellidos || undefined;
    }

    return Customer.create({
      id_cliente: customer.id_cliente,
      id_tipo_documento: baseDocumentTypeId,
      valor_doc: baseValorDoc,
      nombres: finalNombres,
      apellidos: finalApellidos,
      razon_social: finalRazonSocial,
      direccion: baseAddress,
      email: baseEmail,
      telefono: basePhone,
      estado: customer.estado,
      tipoDocumentoDescripcion: customer.tipoDocumentoDescripcion,
      tipoDocumentoCodSunat: tipoSunat ?? customer.tipoDocumentoCodSunat,
    });
  }

  static withStatus(customer: Customer, status: boolean): Customer {
    return Customer.create({
      ...customer['props'],
      estado: status,
    });
  }

  static toDeletedResponse(customerId: string): CustomerDeletedResponseDto {
    return {
      customerId,
      message: 'Cliente eliminado correctamente',
      deletedAt: new Date(),
    };
  }

  static toDomainEntity(customerOrm: CustomerOrmEntity): Customer {
    let estado = true;
    if (typeof customerOrm.estado === 'boolean') {
      estado = customerOrm.estado;
    } else if (typeof customerOrm.estado === 'number') {
      estado = customerOrm.estado === 1;
    } else if (Buffer.isBuffer(customerOrm.estado)) {
      estado = (customerOrm.estado as any)[0] === 1;
    }

    const esRuc = customerOrm.tipoDocumento?.cod_sunat === '06';

    const razonSocial = customerOrm.razon_social?.trim()
      ? customerOrm.razon_social
      : esRuc
        ? customerOrm.nombres?.trim() || undefined
        : undefined;

    const nombres = customerOrm.nombres?.trim()
      ? customerOrm.nombres
      : customerOrm.razon_social?.trim() || 'Desconocido';

    const docSeguro = customerOrm.valor_doc?.trim()
      ? customerOrm.valor_doc
      : '00000000';

    return Customer.create({
      id_cliente: customerOrm.id_cliente,
      id_tipo_documento: customerOrm.id_tipo_documento || 1,
      valor_doc: docSeguro,
      nombres,
      apellidos: customerOrm.apellidos || undefined,
      razon_social: razonSocial,
      direccion: customerOrm.direccion || undefined,
      email: customerOrm.email || undefined,
      telefono: customerOrm.telefono || undefined,
      estado,
      tipoDocumentoDescripcion: customerOrm.tipoDocumento?.descripcion,
      tipoDocumentoCodSunat: customerOrm.tipoDocumento?.cod_sunat,
    });
  }

  static toOrmEntity(customer: Customer): CustomerOrmEntity {
    const customerOrm = new CustomerOrmEntity();
    customerOrm.id_cliente = customer.id_cliente!;
    customerOrm.id_tipo_documento = customer.id_tipo_documento;
    customerOrm.valor_doc = customer.valor_doc;
    customerOrm.nombres = customer.nombres || null;
    customerOrm.apellidos = customer.apellidos ?? null;
    customerOrm.razon_social = customer.razon_social ?? null;
    customerOrm.direccion = customer.direccion ?? null;
    customerOrm.email = customer.email ?? null;
    customerOrm.telefono = customer.telefono ?? null;
    customerOrm.estado = customer.estado;
    return customerOrm;
  }

  static documentTypeToDomain(docTypeOrm: DocumentTypeOrmEntity): DocumentType {
    return DocumentType.create({
      id_tipo_documento: docTypeOrm.id_tipo_documento,
      cod_sunat: docTypeOrm.cod_sunat,
      descripcion: docTypeOrm.descripcion,
    });
  }

  static documentTypeToResponseDto(
    docType: DocumentType,
  ): DocumentTypeResponseDto {
    return {
      documentTypeId: docType.id_tipo_documento,
      sunatCode: docType.cod_sunat,
      description: docType.descripcion,
    };
  }
}
