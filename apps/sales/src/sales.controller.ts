// sales/src/sales.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './core/dto/create-sale.dto';

@Controller('sales')
export class SalesController {
  getHello(): any {
    throw new Error('Method not implemented.');
  }
  constructor(private readonly salesService: SalesService) {}

  @Post()
  async createSale(@Body() dto: CreateSaleDto) {
    return this.salesService.createSale(dto);
  }
}
