import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ListUserQuotesFilterDto, ListUserSalesFilterDto } from '../../../../application/dto/in';
import { UserQuotesResponseDto, UserSalesResponseDto } from '../../../../application/dto/out';

const TCP_TIMEOUT_MS = 5000;

@Injectable()
export class SalesTcpProxy implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SalesTcpProxy.name);

  constructor(
    @Inject('SALES_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error: unknown) {
      this.logger.warn(
        `No se pudo conectar a SALES_SERVICE: ${getErrorMessage(error)}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.close();
    } catch {
      // noop
    }
  }

  async getUserSales(
    userId: number,
    filters: ListUserSalesFilterDto,
  ): Promise<UserSalesResponseDto> {
    const payload = {
      userId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    };

    try {
      return await firstValueFrom(
        this.client
          .send<UserSalesResponseDto>({ cmd: 'find_sales_by_employee' }, payload)
          .pipe(timeout(TCP_TIMEOUT_MS)),
      );
    } catch (error: unknown) {
      this.logger.warn(
        `No se pudo consultar ventas del usuario ${userId}: ${getErrorMessage(error)}`,
      );
      throw new ServiceUnavailableException(
        'No se pudo consultar las ventas del empleado',
      );
    }
  }

  async getUserQuotes(
    userId: number,
    filters: ListUserQuotesFilterDto,
  ): Promise<UserQuotesResponseDto> {
    const payload = {
      userId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    };

    try {
      return await firstValueFrom(
        this.client
          .send<UserQuotesResponseDto>({ cmd: 'find_quotes_by_employee' }, payload)
          .pipe(timeout(TCP_TIMEOUT_MS)),
      );
    } catch (error: unknown) {
      this.logger.warn(
        `No se pudo consultar cotizaciones del usuario ${userId}: ${getErrorMessage(error)}`,
      );
      throw new ServiceUnavailableException(
        'No se pudo consultar las cotizaciones del empleado',
      );
    }
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido';
}
