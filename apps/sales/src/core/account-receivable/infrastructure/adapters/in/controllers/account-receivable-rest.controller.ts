/* ============================================
   sales/src/core/account-receivable/infrastructure/adapters/in/controllers/account-receivable-rest.controller.ts
   ============================================ */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AccountReceivableCommandService } from '../../../../application/service/account-receivable-command.service';
import { AccountReceivableQueryService }   from '../../../../application/service/account-receivable-query.service';
import { AccountReceivableMapper }         from '../../../../application/mapper/account-receivable.mapper';
import {
  CreateAccountReceivableDto,
  ApplyPaymentDto,
  CancelAccountReceivableDto,
  UpdateDueDateDto,
  PaginationDto,
} from '../../../../application/dto/in/account-receivable-dto-in';
import {
  AccountReceivableResponseDto,
  AccountReceivablePaginatedResponseDto,
} from '../../../../application/dto/out/account-receivable-dto-out';

@Controller('account-receivables')
export class AccountReceivableRestController {

  constructor(
    private readonly commandService: AccountReceivableCommandService,
    private readonly queryService:   AccountReceivableQueryService,
    private readonly mapper:         AccountReceivableMapper,
  ) {}

  // ── POST /account-receivables ─────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateAccountReceivableDto,
  ): Promise<AccountReceivableResponseDto> {
    const domain = await this.commandService.create({
      salesReceiptId: dto.salesReceiptId,
      userRef:        dto.userRef,
      totalAmount:    dto.totalAmount,
      dueDate:        dto.dueDate,
      paymentTypeId:  dto.paymentTypeId,
      currencyCode:   dto.currencyCode,
      observation:    dto.observation,
    });
    return this.mapper.toResponseDto(domain);
  }

  // ── GET /account-receivables?page=1&limit=10 ──────────────────────
  @Get()
  async findAllOpen(
    @Query() pagination: PaginationDto,
  ): Promise<AccountReceivablePaginatedResponseDto> {
    const result = await this.queryService.getAllOpen({
      page:   pagination.page   ?? 1,
      limit:  pagination.limit  ?? 10,
      sedeId: pagination.sedeId ?? undefined,  // 👈 agregar
    });
    return {
      data:       this.mapper.toResponseDtoList(result.data),
      total:      result.total,
      page:       result.page,
      limit:      result.limit,
      totalPages: result.totalPages,
    };
  }

  // ── GET /account-receivables/:id ──────────────────────────────────
  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AccountReceivableResponseDto> {
    const domain = await this.queryService.getById(id);
    return this.mapper.toResponseDto(domain);
  }

  // ── PATCH /account-receivables/payment ───────────────────────────
  @Patch('payment')
  async applyPayment(
    @Body() dto: ApplyPaymentDto,
  ): Promise<AccountReceivableResponseDto> {
    const domain = await this.commandService.applyPayment({
      accountReceivableId: dto.accountReceivableId,
      amount:              dto.amount,
      currencyCode:        dto.currencyCode,
    });
    return this.mapper.toResponseDto(domain);
  }

  // ── PATCH /account-receivables/cancel ────────────────────────────
  @Patch('cancel')
  async cancel(
    @Body() dto: CancelAccountReceivableDto,
  ): Promise<AccountReceivableResponseDto> {
    const domain = await this.commandService.cancel({
      accountReceivableId: dto.accountReceivableId,
      reason:              dto.reason,
    });
    return this.mapper.toResponseDto(domain);
  }

  // ── PATCH /account-receivables/due-date ──────────────────────────
  @Patch('due-date')
  async updateDueDate(
    @Body() dto: UpdateDueDateDto,
  ): Promise<AccountReceivableResponseDto> {
    const domain = await this.commandService.updateDueDate({
      accountReceivableId: dto.accountReceivableId,
      newDueDate:          dto.newDueDate,
    });
    return this.mapper.toResponseDto(domain);
  }
}