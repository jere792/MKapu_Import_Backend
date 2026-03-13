import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { TransferResponseDto } from '../../../../application/dto/out/transfer-response.dto';
import { TransferResponseMapper } from '../../../../application/mapper/transfer-response.mapper';
import { TransferPortsIn } from '../../../../domain/ports/in/transfer-ports-in';
import { ApproveTransferDto } from '../../../../application/dto/in/approve-transfer.dto';
import { ConfirmReceiptTransferDto } from '../../../../application/dto/in/confirm-receipt-transfer.dto';
import { ListTransferNotificationQueryDto } from '../../../../application/dto/in/list-transfer-notification-query.dto';
import { ListTransferQueryDto } from '../../../../application/dto/in/list-transfer-query.dto';
import { RejectTransferDto } from '../../../../application/dto/in/reject-transfer.dto';
import { RequestTransferDto } from '../../../../application/dto/in/request-transfer.dto';
import {
  TransferByIdResponseDto,
  TransferListPaginatedResponseDto,
  TransferNotificationResponseDto,
} from '../../../../application/dto/out';
import { TransferRequestMapper } from '../../../../application/mapper/transfer-request.mapper';

@Controller('warehouse/transfer')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class TransferRestController {
  constructor(
    @Inject('TransferPortsIn')
    private readonly transferService: TransferPortsIn,
  ) {}

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  async requestTransfer(
    @Body() dto: RequestTransferDto,
    @Headers('x-transfer-mode') transferModeHeader?: string,
  ): Promise<TransferResponseDto> {
    const transfer = await this.transferService.requestTransfer(
      TransferRequestMapper.withTransferMode(dto, transferModeHeader),
    );

    return TransferResponseMapper.toResponseDto(transfer);
  }

  @Patch(':id/approve')
  async approveTransfer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveTransferDto,
  ): Promise<TransferResponseDto> {
    const transfer = await this.transferService.approveTransfer(id, dto);
    return TransferResponseMapper.toResponseDto(transfer);
  }

  @Patch(':id/reject')
  async rejectTransfer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectTransferDto,
  ): Promise<TransferResponseDto> {
    const transfer = await this.transferService.rejectTransfer(id, dto);
    return TransferResponseMapper.toResponseDto(transfer);
  }

  @Patch(':id/confirm-receipt')
  async confirmReceipt(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmReceiptTransferDto,
  ): Promise<TransferResponseDto> {
    const transfer = await this.transferService.confirmReceipt(id, dto);
    return TransferResponseMapper.toResponseDto(transfer);
  }

  @Get('headquarters/:hqId')
  async getTransfersByHeadquarters(
    @Param('hqId') hqId: string,
  ): Promise<TransferResponseDto[]> {
    const transfers =
      await this.transferService.getTransfersByHeadquarters(hqId);
    return transfers.map((transfer) =>
      TransferResponseMapper.toResponseDto(transfer),
    );
  }

  @Get()
  async getAllTransfers(
    @Query() query: ListTransferQueryDto,
  ): Promise<TransferListPaginatedResponseDto> {
    return await this.transferService.getAllTransfers(query);
  }

  @Get('notifications')
  async getTransferNotifications(
    @Query() query: ListTransferNotificationQueryDto,
  ): Promise<TransferNotificationResponseDto[]> {
    return await this.transferService.getTransferNotifications(query);
  }

  @Get(':id')
  async getTransferById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TransferByIdResponseDto> {
    return await this.transferService.getTransferById(id);
  }
}
