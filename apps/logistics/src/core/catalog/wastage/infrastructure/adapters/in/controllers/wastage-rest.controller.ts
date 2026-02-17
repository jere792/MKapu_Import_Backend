// wastage-rest.controller.ts
import { Controller, Get, Post, Body, Param, Query, Inject, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { IWastageCommandPort } from '../../../../domain/ports/in/wastage.port.in';
import { IWastageQueryPort } from '../../../../domain/ports/in/wastage.port.in';
import { CreateWastageDto } from '../../../../application/dto/in/create-wastage.dto';
import { WastageResponseDto } from '../../../../application/dto/out/wastage-response.dto';
import { WastagePaginatedResponseDto } from '../../../../application/dto/out/wastage-response.dto';

@Controller('catalog/wastage') 
export class WastageRestController {
  constructor(
    @Inject('IWastageCommandPort')
    private readonly commandPort: IWastageCommandPort,
    
    @Inject('IWastageQueryPort')
    private readonly queryPort: IWastageQueryPort,
  ) {}

  @Post()
  async create(@Body() dto: CreateWastageDto): Promise<WastageResponseDto> {
    return await this.commandPort.create(dto);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<WastagePaginatedResponseDto> {
    return await this.queryPort.findAllPaginated(page, limit);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<WastageResponseDto> {
    return await this.queryPort.findById(id);
  }
}