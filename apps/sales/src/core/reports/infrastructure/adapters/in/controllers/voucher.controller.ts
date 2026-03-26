import { Controller, Get, Query, Res } from '@nestjs/common';
import { VoucherService } from '../../../../application/service/voucher.service';
import { GetVoucherFilterDto } from '../../../../application/dto/in/get-voucher-filter.dto';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';

@Controller('manage-vouchers')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Get()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  findAll(@Query() filters: GetVoucherFilterDto) {
    return this.voucherService.findAll(filters);
  }

  @Get('export/excel')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async exportExcel(
    @Query() filters: GetVoucherFilterDto,
    @Res() res: Response,
  ) {
    const buffer = await this.voucherService.exportExcel(filters);

    const fromDate = filters.fecha_inicio ?? 'inicio';
    const untilDate = filters.fecha_fin ?? 'fin';
    const filename = `comprobantes_${fromDate}_${untilDate}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnc.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(buffer);
  }

  @Get('export/pdf')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async exportPdf(@Query() filters: GetVoucherFilterDto, @Res() res: Response) {
    const buffer = await this.voucherService.exportPdf(filters);

    const fromDate = filters.fecha_inicio ?? 'inicio';
    const untilDate = filters.fecha_fin ?? 'fin';
    const filename = `comprobantes_${fromDate}_${untilDate}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(buffer);
  }
}
