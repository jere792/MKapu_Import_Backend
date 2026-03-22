/* ============================================
   sales/src/core/customer/application/service/customer-command.service.ts
   ============================================ */

import { Injectable, Inject, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ICustomerCommandPort } from '../../domain/ports/in/cunstomer-port-in';
import { ICustomerRepositoryPort, IDocumentTypeRepositoryPort } from '../../domain/ports/out/customer-port-out';
import {
  RegisterCustomerDto,
  UpdateCustomerDto,
  ChangeCustomerStatusDto,
} from '../dto/in';
import {
  CustomerResponseDto,
  CustomerDeletedResponseDto,
} from '../dto/out';
import { CustomerMapper } from '../mapper/customer.mapper';

@Injectable()
export class CustomerCommandService implements ICustomerCommandPort {
  constructor(
    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,
    @Inject('IDocumentTypeRepositoryPort')
    private readonly documentTypeRepository: IDocumentTypeRepositoryPort,
  ) {}

  async registerCustomer(dto: RegisterCustomerDto): Promise<CustomerResponseDto> {
    // 1. Validar que el tipo de documento existe
    const documentType = await this.documentTypeRepository.findById(dto.documentTypeId);
    if (!documentType) {
      throw new BadRequestException(
        `El tipo de documento con ID ${dto.documentTypeId} no existe`,
      );
    }

    // 2. Validar duplicidad de documento
    const exists = await this.customerRepository.existsByDocument(dto.documentValue);
    if (exists) {
      throw new ConflictException(
        `Ya existe un cliente con el documento ${dto.documentValue}`,
      );
    }

    // 3. Crear entidad de dominio (El Mapper maneja nombres, apellidos, razón social)
    const customer = CustomerMapper.fromRegisterDto(dto, documentType.cod_sunat);

    // 4. Guardar
    const savedCustomer = await this.customerRepository.save(customer);

    // 5. Retornar DTO
    return CustomerMapper.toResponseDto(savedCustomer);
  }

  async updateCustomer(dto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    const existingCustomer = await this.customerRepository.findById(dto.customerId);
    if (!existingCustomer) {
      throw new NotFoundException(`No se encontró el cliente con ID ${dto.customerId}`);
    }

    let tipoDocumentoCodSunat = existingCustomer.tipoDocumentoCodSunat;
    if (dto.documentTypeId && dto.documentTypeId !== existingCustomer.id_tipo_documento) {
      const newDocType = await this.documentTypeRepository.findById(dto.documentTypeId);
      if (!newDocType) {
        throw new BadRequestException(`El tipo de documento con ID ${dto.documentTypeId} no existe`);
      }
      tipoDocumentoCodSunat = newDocType.cod_sunat; 
    }

    // Pasar el código sunat correcto al mapper
    const updatedCustomer = CustomerMapper.fromUpdateDto(existingCustomer, dto, tipoDocumentoCodSunat);
    const savedCustomer = await this.customerRepository.update(updatedCustomer);
    return CustomerMapper.toResponseDto(savedCustomer);
  }
  
  async changeCustomerStatus(dto: ChangeCustomerStatusDto): Promise<CustomerResponseDto> {
    const existingCustomer = await this.customerRepository.findById(dto.customerId);
    if (!existingCustomer) {
      throw new NotFoundException(
        `No se encontró el cliente con ID ${dto.customerId}`,
      );
    }

    const customerWithNewStatus = CustomerMapper.withStatus(
      existingCustomer,
      dto.status,
    );

    const savedCustomer = await this.customerRepository.update(customerWithNewStatus);
    return CustomerMapper.toResponseDto(savedCustomer);
  }

  async deleteCustomer(id: string): Promise<CustomerDeletedResponseDto> {
    const existingCustomer = await this.customerRepository.findById(id);
    if (!existingCustomer) {
      throw new NotFoundException(`No se encontró el cliente con ID ${id}`);
    }

    await this.customerRepository.delete(id);

    return CustomerMapper.toDeletedResponse(id);
  }
}