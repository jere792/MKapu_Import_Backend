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
    // 1. Configurar paginación (default: page 1, limit 10)
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;

    // 2. Construir filtros para el repositorio
    const repoFilters = {
      estado: filters?.status,
      search: filters?.search,
      id_tipo_documento: filters?.documentTypeId,
      page: page,   // Nuevo: Para el skip
      limit: limit, // Nuevo: Para el take
    };

    // 3. Obtener clientes Y el total de registros (destructuring)
    const { customers, total } = await this.customerRepository.findAll(repoFilters);

    // 4. Retornar respuesta formateada incluyendo el total para el paginador
    return CustomerMapper.toListResponse(customers, total);
  }

  async getCustomerById(id: string): Promise<CustomerResponseDto | null> {
    const customer = await this.customerRepository.findById(id);

    if (!customer) {
      throw new NotFoundException(`No se encontró el cliente con ID: ${id}`);
    }

    return CustomerMapper.toResponseDto(customer);
  }

  async getCustomerByDocument(documentValue: string): Promise<CustomerResponseDto | null> {
    const customer = await this.customerRepository.findByDocument(documentValue);

    if (!customer) {
      throw new NotFoundException(`No se encontró ningún cliente con el documento: ${documentValue}`);
    }

    return CustomerMapper.toResponseDto(customer);
  }

  async getDocumentTypes(): Promise<DocumentTypeResponseDto[]> {
    const types = await this.documentTypeRepository.findAll();
    return types.map((type) => CustomerMapper.documentTypeToResponseDto(type));
  }
}
