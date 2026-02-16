/* apps/sales/src/core/sales-receipt/application/service/sales-receipt-query.service.ts */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ISalesReceiptQueryPort } from '../../domain/ports/in/sales_receipt-ports-in';
import { ISalesReceiptRepositoryPort } from '../../domain/ports/out/sales_receipt-ports-out';
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out';
import { AdminTcpProxy } from '../../infrastructure/adapters/out/TCP/admin-tcp.proxy';
import { ListSalesReceiptFilterDto } from '../dto/in';
import {
  SalesReceiptResponseDto,
  SalesReceiptListResponse,
  SalesReceiptSummaryListResponse,
  SalesReceiptWithHistoryDto,
  CustomerPurchaseHistoryDto,
} from '../dto/out';
import { SalesReceiptMapper } from '../mapper/sales-receipt.mapper';
import { SalesReceiptOrmEntity } from '../../infrastructure/entity/sales-receipt-orm.entity';

@Injectable()
export class SalesReceiptQueryService implements ISalesReceiptQueryPort {
  constructor(
    @Inject('ISalesReceiptRepositoryPort')
    private readonly receiptRepository: ISalesReceiptRepositoryPort,

    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,

    private readonly adminTcpProxy: AdminTcpProxy,
  ) {}

  async findCustomerByDocument(documentNumber: string): Promise<any> {
    const customer = await this.customerRepository.findByDocument(documentNumber);

    if (!customer) {
      throw new NotFoundException(
        `No se encontró ningún cliente con el documento: ${documentNumber}`,
      );
    }

    return customer;
  }

  async listReceipts(
    filters: ListSalesReceiptFilterDto = {},
  ): Promise<SalesReceiptListResponse> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    const { receipts, total } = await this.receiptRepository.findAllWithRelations({
      estado: filters.status,
      id_cliente: filters.customerId,
      id_tipo_comprobante: filters.receiptTypeId,
      fec_desde: filters.dateFrom,
      fec_hasta: filters.dateTo,
      search: filters.search,
      id_sede: filters.sedeId,
      skip: (page - 1) * limit,
      take: limit,
    });

    const enrichedReceipts = await this.enrichReceiptsDetailWithTcp(receipts);

    return {
      receipts: enrichedReceipts,
      total,
    };
  }

  async listReceiptsSummary(
    filters: ListSalesReceiptFilterDto = {},
  ): Promise<SalesReceiptSummaryListResponse> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    const { receipts, total } = await this.receiptRepository.findAllWithRelations({
      estado: filters.status,
      id_cliente: filters.customerId,
      id_tipo_comprobante: filters.receiptTypeId,
      fec_desde: filters.dateFrom,
      fec_hasta: filters.dateTo,
      search: filters.search,
      id_sede: filters.sedeId,
      skip: (page - 1) * limit,
      take: limit,
    });

    const enrichedReceipts = await this.enrichReceiptsSummaryWithTcp(receipts);

    return {
      receipts: enrichedReceipts,
      total,
    };
  }

  async getReceiptById(id: number): Promise<SalesReceiptResponseDto | null> {
    const receiptOrm = await this.receiptRepository.findByIdWithRelations(id);

    if (!receiptOrm) {
      return null;
    }

    const dto = SalesReceiptMapper.ormToResponseDto(receiptOrm);
    const enriched = await this.enrichReceiptDetailWithTcp(dto);

    return enriched;
  }

  async getReceiptWithHistory(id: number): Promise<SalesReceiptWithHistoryDto> {
    const receiptOrm = await this.receiptRepository.findByIdWithFullRelations(id);

    if (!receiptOrm) {
      throw new NotFoundException(`Comprobante con ID ${id} no encontrado`);
    }

    const receiptDto = SalesReceiptMapper.ormToResponseDto(receiptOrm);
    const enrichedReceipt = await this.enrichReceiptDetailWithTcp(receiptDto);

    let customerHistory: CustomerPurchaseHistoryDto | undefined;

    if (receiptOrm.cliente?.id_cliente) {
      try {
        const historyData = await this.receiptRepository.findCustomerPurchaseHistory(
          receiptOrm.cliente.id_cliente,
        );

        const historyWithPromedio = {
          customer: historyData.customer,
          statistics: {
            totalCompras: historyData.statistics.totalCompras,
            totalEmitidos: historyData.statistics.totalEmitidos,
            totalAnulados: historyData.statistics.totalAnulados,
            montoTotal: historyData.statistics.montoTotal,
            montoEmitido: historyData.statistics.montoEmitido,
            promedioCompra: historyData.statistics.totalEmitidos > 0 
              ? historyData.statistics.montoEmitido / historyData.statistics.totalEmitidos 
              : 0,
          },
          recentPurchases: historyData.recentPurchases || [],
        };

        const mappedHistory = SalesReceiptMapper.toCustomerHistoryDto(historyWithPromedio);
        customerHistory = await this.enrichCustomerHistoryWithTcp(mappedHistory);
      } catch (error) {
        console.warn(`No se pudo obtener historial del cliente: ${error.message}`);
      }
    }

    return {
      receipt: enrichedReceipt,
      customerHistory,
    };
  }

  async getCustomerPurchaseHistory(
    customerId: string,
  ): Promise<CustomerPurchaseHistoryDto> {
    const historyData = await this.receiptRepository.findCustomerPurchaseHistory(customerId);

    const historyWithPromedio = {
      ...historyData,
      statistics: {
        ...historyData.statistics,
        promedioCompra: historyData.statistics.totalEmitidos > 0 
          ? historyData.statistics.montoEmitido / historyData.statistics.totalEmitidos 
          : 0,
      },
    };

    const mappedHistory = SalesReceiptMapper.toCustomerHistoryDto(historyWithPromedio);
    return await this.enrichCustomerHistoryWithTcp(mappedHistory);
  }

  async getReceiptsBySerie(serie: string): Promise<SalesReceiptListResponse> {
    const receiptsOrm = await this.receiptRepository.findBySerieWithRelations(serie);
    return {
      receipts: receiptsOrm.map((orm) => SalesReceiptMapper.ormToResponseDto(orm)),
      total: receiptsOrm.length,
    };
  }

  private async enrichReceiptsSummaryWithTcp(receipts: SalesReceiptOrmEntity[]) {
    const summaries = receipts.map((orm) => SalesReceiptMapper.ormToSummaryDto(orm));

    const responsableIds = [...new Set(summaries.map((r) => r.idResponsable))].filter(Boolean);
    const sedeIds = [...new Set(summaries.map((r) => r.idSede))].filter(Boolean);

    const [users, sedes] = await Promise.all([
      Promise.all(responsableIds.map((id) => this.adminTcpProxy.getUserById(id))),
      Promise.all(sedeIds.map((id) => this.adminTcpProxy.getSedeById(id))),
    ]);

    const userMap = new Map(
      users.filter((u) => u).map((u) => [u!.id_usuario, u]),
    );
    const sedeMap = new Map(
      sedes.filter((s) => s).map((s) => [s!.id_sede, s]),
    );

    return summaries.map((summary) => {
      const user = userMap.get(Number(summary.idResponsable));
      const sede = sedeMap.get(summary.idSede);

      return {
        ...summary,
        responsableNombre: user
          ? `${user.usu_nom} ${user.ape_pat} ${user.ape_mat}`.trim()
          : 'Responsable no encontrado',
        sedeNombre: sede?.nombre || 'Sede no encontrada',
      };
    });
  }

  private async enrichReceiptsDetailWithTcp(receipts: SalesReceiptOrmEntity[]) {
    const dtos = receipts.map((orm) => SalesReceiptMapper.ormToResponseDto(orm));

    const responsableIds = [...new Set(dtos.map((r) => Number(r.responsable.id)))].filter(Boolean);
    const sedeIds = [...new Set(dtos.map((r) => r.sede.id))].filter(Boolean);

    const [users, sedes] = await Promise.all([
      Promise.all(responsableIds.map((id) => this.adminTcpProxy.getUserById(id))),
      Promise.all(sedeIds.map((id) => this.adminTcpProxy.getSedeById(id))),
    ]);

    const userMap = new Map(
      users.filter((u) => u).map((u) => [u!.id_usuario, u]),
    );
    const sedeMap = new Map(
      sedes.filter((s) => s).map((s) => [s!.id_sede, s]),
    );

    return dtos.map((dto) => {
      const user = userMap.get(Number(dto.responsable.id));
      const sede = sedeMap.get(dto.sede.id);

      return {
        ...dto,
        responsable: {
          ...dto.responsable,
          nombre: user?.usu_nom || dto.responsable.nombre,
          apellidoPaterno: user?.ape_pat || dto.responsable.apellidoPaterno,
          apellidoMaterno: user?.ape_mat || dto.responsable.apellidoMaterno,
          nombreCompleto: user
            ? `${user.usu_nom} ${user.ape_pat} ${user.ape_mat}`.trim()
            : dto.responsable.nombreCompleto,
        },
        sede: {
          ...dto.sede,
          nombre: sede?.nombre || dto.sede.nombre,
        },
      };
    });
  }

  private async enrichReceiptDetailWithTcp(dto: SalesReceiptResponseDto): Promise<SalesReceiptResponseDto> {
    const responsableId = Number(dto.responsable.id);
    const sedeId = dto.sede.id;

    const [user, sede] = await Promise.all([
      this.adminTcpProxy.getUserById(responsableId),
      this.adminTcpProxy.getSedeById(sedeId),
    ]);

    return {
      ...dto,
      responsable: {
        ...dto.responsable,
        nombre: user?.usu_nom || dto.responsable.nombre,
        apellidoPaterno: user?.ape_pat || dto.responsable.apellidoPaterno,
        apellidoMaterno: user?.ape_mat || dto.responsable.apellidoMaterno,
        nombreCompleto: user
          ? `${user.usu_nom} ${user.ape_pat} ${user.ape_mat}`.trim()
          : dto.responsable.nombreCompleto,
      },
      sede: {
        ...dto.sede,
        nombre: sede?.nombre || dto.sede.nombre,
      },
    };
  }

  private async enrichCustomerHistoryWithTcp(
    history: CustomerPurchaseHistoryDto,
  ): Promise<CustomerPurchaseHistoryDto> {
    const sedeIds = [...new Set(
      history.recentPurchases
        .map((p: any) => p.id_sede_ref)
        .filter(Boolean)
    )];

    const responsableIds = [...new Set(
      history.recentPurchases
        .map((p: any) => p.id_responsable_ref)
        .filter(Boolean)
    )];

    const [sedes, users] = await Promise.all([
      Promise.all(sedeIds.map((id) => this.adminTcpProxy.getSedeById(id))),
      Promise.all(responsableIds.map((id) => this.adminTcpProxy.getUserById(Number(id)))),
    ]);

    const sedeMap = new Map(
      sedes.filter((s) => s).map((s) => [s!.id_sede, s])
    );

    const userMap = new Map(
      users.filter((u) => u).map((u) => [u!.id_usuario, u])
    );

    const enrichedPurchases = history.recentPurchases.map((purchase: any) => {
      const sedeId = purchase.id_sede_ref;
      const sede = sedeMap.get(sedeId);

      const responsableId = Number(purchase.id_responsable_ref);
      const user = userMap.get(responsableId);
      
      const { id_sede_ref, id_responsable_ref, ...purchaseWithoutRef } = purchase;
      
      return {
        ...purchaseWithoutRef,
        sedeNombre: sede?.nombre || 'Sede no encontrada',
        responsableNombre: user 
          ? `${user.usu_nom} ${user.ape_pat} ${user.ape_mat}`.trim()
          : 'Vendedor',
      };
    });

    return {
      ...history,
      recentPurchases: enrichedPurchases,
    };
  }
}
