import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { IBankQueryPort } from '../../../../domain/ports/in/bank-ports-in';
import {
  BankResponseDto,
  ServiceTypeResponseDto,
} from '../../../../application/dto/out';

@Controller('banks')
export class BankRestController {
  constructor(
    @Inject('IBankQueryPort')
    private readonly bankQueryService: IBankQueryPort,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllBanks(): Promise<BankResponseDto[]> {
    return this.bankQueryService.getAllBanks();
  }

  @Get('service-types')
  @HttpCode(HttpStatus.OK)
  async getServiceTypes(
    @Query('bancoId') bancoId?: string,
  ): Promise<ServiceTypeResponseDto[]> {
    return this.bankQueryService.getServiceTypes(
      bancoId ? Number(bancoId) : undefined,
    );
  }

}
