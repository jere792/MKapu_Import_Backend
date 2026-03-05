import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Transfer } from '../../../../domain/entity/transfer-domain-entity';
import { TransferPortsIn } from '../../../../domain/ports/in/transfer-ports-in';
import { ApproveTransferDto } from '../../../../application/dto/in/approve-transfer.dto';
import { ConfirmReceiptTransferDto } from '../../../../application/dto/in/confirm-receipt-transfer.dto';
import { ListTransferQueryDto } from '../../../../application/dto/in/list-transfer-query.dto';
import { RejectTransferDto } from '../../../../application/dto/in/reject-transfer.dto';
import { RequestTransferDto } from '../../../../application/dto/in/request-transfer.dto';
import {
  TransferByIdResponseDto,
  TransferListPaginatedResponseDto,
} from '../../../../application/dto/out';

@Controller('warehouse/transfer')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class TransferRestController {
  constructor(
    @Inject('TransferPortsIn')
    private readonly transferService: TransferPortsIn,
  ) {}

  @Post('request')
  async requestTransfer(@Body() dto: RequestTransferDto): Promise<Transfer> {
    return await this.transferService.requestTransfer(dto);
  }

  @Patch(':id/approve')
  async approveTransfer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveTransferDto,
  ): Promise<Transfer> {
    return await this.transferService.approveTransfer(id, dto);
  }

  @Patch(':id/reject')
  async rejectTransfer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectTransferDto,
  ): Promise<Transfer> {
    return await this.transferService.rejectTransfer(id, dto);
  }

  @Patch(':id/confirm-receipt')
  async confirmReceipt(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmReceiptTransferDto,
  ): Promise<Transfer> {
    return await this.transferService.confirmReceipt(id, dto);
  }

  @Get('headquarters/:hqId')
  async getTransfersByHeadquarters(
    @Param('hqId') hqId: string,
  ): Promise<Transfer[]> {
    return await this.transferService.getTransfersByHeadquarters(hqId);
  }

  @Get()
  async getAllTransfers(
    @Query() query: ListTransferQueryDto,
  ): Promise<TransferListPaginatedResponseDto> {
    return await this.transferService.getAllTransfers(query);
  }

  @Get(':id')
  async getTransferById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TransferByIdResponseDto> {
    return await this.transferService.getTransferById(id);
  }
}
