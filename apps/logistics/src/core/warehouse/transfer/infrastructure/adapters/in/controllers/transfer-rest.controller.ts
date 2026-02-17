import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  RequestTransferDto,
  TransferPortsIn,
} from '../../../../domain/ports/in/transfer-ports-in';
import { Transfer } from '../../../../domain/entity/transfer-domain-entity';
import { RejectTransferDto } from '../../../../application/dto/in/reject-transfer.dto';

@Controller('warehouse/transfer')
export class TransferRestController {
  constructor(
    @Inject('TransferPortsIn')
    private readonly transferService: TransferPortsIn,
  ) {}
  @Post('request')
  @UsePipes(new ValidationPipe())
  async requestTransfer(@Body() dto: RequestTransferDto): Promise<Transfer> {
    return await this.transferService.requestTransfer(dto);
  }
  @Patch(':id/approve')
  async approveTransfer(
    @Param('id') id: number,
    @Body('userId') userId: number,
  ): Promise<Transfer> {
    return await this.transferService.approveTransfer(id, userId);
  }
  @Patch(':id/reject')
  async rejectTransfer(
    @Param('id') id: number,
    @Body() dto: RejectTransferDto,
  ): Promise<Transfer> {
    return await this.transferService.rejectTransfer(
      id,
      dto.userId,
      dto.reason,
    );
  }
  @Patch(':id/confirm-receipt')
  async confirmReceipt(
    @Param('id') id: number,
    @Body('userId') userId: number,
  ): Promise<Transfer> {
    return await this.transferService.confirmReceipt(id, userId);
  }

  @Get('headquarters/:hqId')
  async getTransfersByHeadquarters(
    @Param('hqId') hqId: string,
  ): Promise<Transfer[]> {
    return await this.transferService.getTransfersByHeadquarters(hqId);
  }
  @Get()
  async getAllTransfers(): Promise<Transfer[]> {
    return await this.transferService.getAllTransfers();
  }
  @Get(':id')
  async getTransferById(@Param('id') id: number): Promise<Transfer> {
    return await this.transferService.getTransferById(id);
  }
}
