import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ICustomerQueryPort } from '../../domain/ports/in/cunstomer-port-in';
import {
  ICustomerRepositoryPort,
  ICustomerTrackingRepositoryPort,
  IDocumentTypeRepositoryPort,
} from '../../domain/ports/out/customer-port-out';
import {
  ListCustomerFilterDto,
  ListCustomerTrackingFilterDto,
} from '../dto/in';
import {
  CustomerListResponse,
  CustomerQuotesResponseDto,
  CustomerResponseDto,
  CustomerSalesResponseDto,
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
    @Inject('ICustomerTrackingRepositoryPort')
    private readonly customerTrackingRepository: ICustomerTrackingRepositoryPort,
  ) {}

  async listCustomers(
    filters?: ListCustomerFilterDto,
  ): Promise<CustomerListResponse> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;

    const { customers, total } = await this.customerRepository.findAll({
      estado: filters?.status,
      search: filters?.search,
      id_tipo_documento: filters?.documentTypeId,
      page,
      limit,
    });

    return CustomerMapper.toListResponse(customers, total);
  }

  async getCustomerById(id: string): Promise<CustomerResponseDto | null> {
    const customer = await this.getCustomerOrFail(id);
    return CustomerMapper.toResponseDto(customer);
  }

  async getCustomerByDocument(
    documentValue: string,
  ): Promise<CustomerResponseDto | null> {
    const customer =
      await this.customerRepository.findByDocument(documentValue);

    if (!customer) {
      throw new NotFoundException(
        `No se encontro ningun cliente con el documento: ${documentValue}`,
      );
    }

    return CustomerMapper.toResponseDto(customer);
  }

  async getDocumentTypes(): Promise<DocumentTypeResponseDto[]> {
    const types = await this.documentTypeRepository.findAll();
    return types.map((type) => CustomerMapper.documentTypeToResponseDto(type));
  }

  async getCustomerSales(
    id: string,
    filters: ListCustomerTrackingFilterDto,
  ): Promise<CustomerSalesResponseDto> {
    await this.getCustomerOrFail(id);

    const page = Math.max(filters.page ?? 1, 1);
    const limit = Math.min(Math.max(filters.limit ?? 10, 1), 100);
    const dateFrom = parseDateStart(filters.dateFrom);
    const dateTo = parseDateEnd(filters.dateTo);

    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser mayor que la fecha de fin',
      );
    }

    const [rows, totalVentas] =
      await this.customerTrackingRepository.findCustomerSalesPaginated(
        {
          customerId: id,
          dateFrom,
          dateTo,
        },
        page,
        limit,
      );

    return {
      ventas: rows.map((row) => ({
        nroComprobante: `${row.serie}-${String(row.numero).padStart(8, '0')}`,
        fecha: row.fec_emision,
        total: Number(row.total),
        estado: row.estado,
      })),
      totalVentas,
      page,
      limit,
      totalPages: Math.ceil(totalVentas / limit),
    };
  }

  async getCustomerQuotes(
    id: string,
    filters: ListCustomerTrackingFilterDto,
  ): Promise<CustomerQuotesResponseDto> {
    await this.getCustomerOrFail(id);

    const page = Math.max(filters.page ?? 1, 1);
    const limit = Math.min(Math.max(filters.limit ?? 10, 1), 100);
    const dateFrom = parseDateStart(filters.dateFrom);
    const dateTo = parseDateEnd(filters.dateTo);

    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser mayor que la fecha de fin',
      );
    }

    const [rows, totalCotizaciones] =
      await this.customerTrackingRepository.findCustomerQuotesPaginated(
        {
          customerId: id,
          dateFrom,
          dateTo,
        },
        page,
        limit,
      );

    return {
      cotizaciones: rows.map((row) => ({
        codigo: `COT-${String(row.id_cotizacion).padStart(3, '0')}`,
        fecha: row.fec_emision,
        total: Number(row.total),
        estado: row.estado,
      })),
      totalCotizaciones,
      page,
      limit,
      totalPages: Math.ceil(totalCotizaciones / limit),
    };
  }

  private async getCustomerOrFail(id: string) {
    const customer = await this.customerRepository.findById(id);

    if (!customer) {
      throw new NotFoundException(`No se encontro el cliente con ID: ${id}`);
    }

    return customer;
  }
}

function parseDateStart(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Fecha de inicio invalida');
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDateEnd(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Fecha de fin invalida');
  }

  date.setHours(23, 59, 59, 999);
  return date;
}
