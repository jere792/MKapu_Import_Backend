/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ISalesReceiptQueryPort } from '../../domain/ports/in/sales_receipt-ports-in';
import { ISalesReceiptRepositoryPort } from '../../domain/ports/out/sales_receipt-ports-out';
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out';
import { ListSalesReceiptFilterDto } from '../dto/in';
import { SalesReceiptResponseDto, SalesReceiptListResponse } from '../dto/out';
import { SalesReceiptMapper } from '../mapper/sales-receipt.mapper';

@Injectable()
export class SalesReceiptQueryService implements ISalesReceiptQueryPort {
  constructor(
    @Inject('ISalesReceiptRepositoryPort')
    private readonly receiptRepository: ISalesReceiptRepositoryPort,

    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,
  ) {}
  async findSaleByCorrelativo(correlativo: string): Promise<any> {
    const parts = correlativo.split('-');
    if (parts.length !== 2) {
      throw new BadRequestException(
        'El formato del correlativo debe ser SERIE-NUMERO (Ej: F001-123)',
      );
    }

    const [serie, numeroStr] = parts;
    const numero = parseInt(numeroStr, 10);

    const sale = await this.receiptRepository.findByCorrelativo(serie, numero);

    if (!sale) {
      throw new NotFoundException(
        `No se encontró el comprobante ${correlativo}`,
      );
    }
    return {
      id: sale.id_comprobante,
      id_sede: sale.id_sede_ref,
      id_almacen: (sale as any).id_almacen || 1,
      cliente_direccion:
        (sale as any).direccion_entrega || 'Dirección no especificada',
      cliente_ubigeo: (sale as any).ubigeo_destino || '150101',
      detalles: sale.details.map((d) => ({
        id_producto: d.id_prod_ref,
        cod_prod: d.cod_prod,
        cantidad: d.cantidad,
        peso_unitario: d.id_prod_ref,
      })),
    };
  }

  async verifySaleForRemission(id: number): Promise<any> {
    const sale = await this.receiptRepository.findById(id);
    if (!sale) return null;
    return {
      id: sale.id_comprobante || id,
      detalles: (sale.items || []).map((item) => ({
        cod_prod: item.productId,
        cantidad: item.quantity,
      })),
    };
  }

  async findCustomerByDocument(documentNumber: string): Promise<any> {
    const customer =
      await this.customerRepository.findByDocument(documentNumber);
    if (!customer) {
      throw new NotFoundException(
        `No se encontró ningún cliente con el documento: ${documentNumber}`,
      );
    }
    return customer;
  }

  async listReceipts(
    filters?: ListSalesReceiptFilterDto,
  ): Promise<SalesReceiptListResponse> {
    const repoFilters = filters
      ? {
          estado: filters.status,
          id_cliente: filters.customerId,
          id_tipo_comprobante: filters.receiptTypeId,
          fec_desde: filters.dateFrom,
          fec_hasta: filters.dateTo,
          search: filters.search,
        }
      : undefined;

    const receipts = await this.receiptRepository.findAll(repoFilters);

    return {
      receipts: receipts.map((r) => SalesReceiptMapper.toResponseDto(r)),
      total: receipts.length,
    };
  }

  async getReceiptById(id: number): Promise<SalesReceiptResponseDto | null> {
    const receipt = await this.receiptRepository.findById(id);
    return receipt ? SalesReceiptMapper.toResponseDto(receipt) : null;
  }

  async getReceiptsBySerie(serie: string): Promise<SalesReceiptListResponse> {
    const receipts = await this.receiptRepository.findBySerie(serie);
    return {
      receipts: receipts.map((r) => SalesReceiptMapper.toResponseDto(r)),
      total: receipts.length,
    };
  }
}
