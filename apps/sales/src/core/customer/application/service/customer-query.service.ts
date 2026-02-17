/* ============================================
   sales/src/core/customer/application/service/customer-query.service.ts
   ============================================ */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICustomerQueryPort } from '../../domain/ports/in/cunstomer-port-in';
import { ICustomerRepositoryPort, IDocumentTypeRepositoryPort } from '../../domain/ports/out/customer-port-out';
import { ListCustomerFilterDto } from '../dto/in';
import {
  CustomerResponseDto,
  CustomerListResponse,
  DocumentTypeResponseDto,
} from '../dto/out';
import { CustomerMapper } from '../mapper/customer.mapper';

@Injectable()
export class CustomerQueryService implements ICustomerQueryPort {
  constructor(
    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,
    @Inject('IDocumentTypeRepositoryPort')
    private readonly documentTypeRepository: IDocumentTypeRepositoryPort,
  ) {}

  async listCustomers(filters?: ListCustomerFilterDto): Promise<CustomerListResponse> {
    // Build filters for repository
    const repoFilters = filters
      ? {
          estado: filters.status,
          search: filters.search,
          id_tipo_documento: filters.documentTypeId,
        }
      : undefined;

    // Get customer list
    const customers = await this.customerRepository.findAll(repoFilters);

    // Return formatted response
    return CustomerMapper.toListResponse(customers);
  }

  async getCustomerById(id: string): Promise<CustomerResponseDto | null> {
    // Find customer by ID
    const customer = await this.customerRepository.findById(id);

    if (!customer) {
      throw new NotFoundException(`No se encontró el cliente con ID: ${id}`);
    }

    // Return DTO if exists
    return CustomerMapper.toResponseDto(customer);
  }

  async getCustomerByDocument(documentValue: string): Promise<CustomerResponseDto | null> {
    // Find customer by document
    const customer = await this.customerRepository.findByDocument(documentValue);

    if (!customer) {
      throw new NotFoundException(`No se encontró ningún cliente con el documento: ${documentValue}`);
    }

    // Return DTO if exists
    return CustomerMapper.toResponseDto(customer);
  }

  async getDocumentTypes(): Promise<DocumentTypeResponseDto[]> {
    // Get all document types
    const types = await this.documentTypeRepository.findAll();

    // Map to response DTOs
    return types.map((type) => CustomerMapper.documentTypeToResponseDto(type));
  }
}