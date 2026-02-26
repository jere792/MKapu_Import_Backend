import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Query,
  ParseIntPipe,
  Req,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';

import { ProductCommandService } from '../../../../application/service/product-command.service';
import { ProductQueryService } from '../../../../application/service/product-query.service';
import {
  RegisterProductDto,
  UpdateProductDto,
  UpdateProductPricesDto,
  ChangeProductStatusDto,
  ListProductFilterDto,
  ListProductStockFilterDto,
  ProductAutocompleteQueryDto,
} from '../../../../application/dto/in';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('products')
export class ProductRestController {
  constructor(
    private readonly commandService: ProductCommandService,
    private readonly queryService: ProductQueryService,
    private readonly productQueryService: ProductQueryService,
  ) {}

  @Post()
  async register(@Body() dto: RegisterProductDto) {
    return this.commandService.registerProduct(dto);
  }

  @Put()
  async update(@Body() dto: UpdateProductDto) {
    return this.commandService.updateProduct(dto);
  }

  @Put('prices')
  async updatePrices(@Body() dto: UpdateProductPricesDto) {
    return this.commandService.updateProductPrices(dto);
  }

  @Put('status')
  async changeStatus(@Body() dto: ChangeProductStatusDto) {
    return this.commandService.changeProductStatus(dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.commandService.deleteProduct(id);
  }

  @Get()
  async list(@Query() filters: ListProductFilterDto) {
    return this.queryService.listProducts(filters);
  }

  @Get('productos_stock')
  async listProductsStock(
    @Req() req: Request,
    @Query('id_sede') id_sede?: string,
    @Query('codigo') codigo?: string,
    @Query('nombre') nombre?: string,
    @Query('id_categoria') id_categoria?: string,
    @Query('categoria') categoria?: string,
    @Query('familia') familia?: string,
    @Query('activo') activo?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    console.log('[productos_stock] req.url:', req.url);
    console.log('[productos_stock] req.query:', req.query);

    const sede = String(id_sede ?? '').trim();
    if (!sede) {
      throw new BadRequestException(
        'id_sede es obligatorio. Ej: ?id_sede=1&page=1&size=10',
      );
    }

    const categoriaNombre = String(categoria ?? familia ?? '').trim();

    const filters: ListProductStockFilterDto = {
      id_sede: sede,
      codigo: codigo?.trim(),
      nombre: nombre?.trim(),
      id_categoria: id_categoria ? parseInt(id_categoria, 10) : undefined,
      categoria: categoriaNombre || undefined,
      activo: activo === 'true' ? true : activo === 'false' ? false : undefined,
      page: page ? parseInt(page, 10) : 1,
      size: size ? parseInt(size, 10) : 10,
    };

    return this.queryService.listProductsStock(filters);
  }

  @Get('autocomplete')
  async autocomplete(
    @Query('search') search?: string,
    @Query('id_sede') id_sede?: string,
    @Query('id_categoria') id_categoria?: string,
  ) {
    const dto: ProductAutocompleteQueryDto = {
      search: String(search ?? '').trim(),
      id_sede: Number(id_sede),
      id_categoria: id_categoria ? Number(id_categoria) : undefined,
    };

    if (!dto.search || dto.search.length < 3) {
      throw new BadRequestException('search debe tener mínimo 3 caracteres');
    }
    if (!dto.id_sede || Number.isNaN(dto.id_sede)) {
      throw new BadRequestException('id_sede es obligatorio. Ej: ?id_sede=1');
    }

    return this.queryService.autocompleteProducts(dto);
  }

  @Get('ventas/autocomplete')
  async autocompleteVentas(
    @Query('search') search?: string,
    @Query('id_sede') id_sede?: string,
    @Query('id_categoria') id_categoria?: string,
  ) {
    if (!id_sede || Number.isNaN(Number(id_sede))) {
      throw new BadRequestException('id_sede es obligatorio. Ej: ?id_sede=1');
    }
    if (!search || search.trim().length < 2) {
      throw new BadRequestException('search debe tener mínimo 2 caracteres');
    }

    const dto: ProductAutocompleteQueryDto = {
      search: search.trim(),
      id_sede: Number(id_sede),
      id_categoria: id_categoria ? Number(id_categoria) : undefined,
    };

    return this.queryService.autocompleteProductsVentas(dto);
  }

  @Get('ventas/stock')
  async stockVentas(
    @Query('id_sede') id_sede?: string,
    @Query('search') search?: string,
    @Query('id_categoria') id_categoria?: string,
    @Query('page') page?: string, // ← NUEVO
    @Query('size') size?: string, // ← NUEVO
  ) {
    if (!id_sede || Number.isNaN(Number(id_sede))) {
      throw new BadRequestException('id_sede es obligatorio. Ej: ?id_sede=1');
    }

    const dto: ProductAutocompleteQueryDto = {
      search: search?.trim() ?? '',
      id_sede: Number(id_sede),
      id_categoria: id_categoria ? Number(id_categoria) : undefined,
    };

    // ── NUEVO: parsea page y size con defaults ───────────────────────────
    const pageNum = page ? parseInt(page, 10) : 1;
    const sizeNum = size ? parseInt(size, 10) : 10;

    return this.queryService.getProductsStockVentas(dto, pageNum, sizeNum);
  }
  @Get(':id_producto/stock')
  async detailWithStock(
    @Param('id_producto', ParseIntPipe) id_producto: number,
    @Query('id_sede') id_sede?: string,
  ) {
    const sede = String(id_sede ?? '').trim();
    if (!sede) {
      throw new BadRequestException('id_sede es obligatorio. Ej: ?id_sede=1');
    }

    return this.queryService.getProductDetailWithStock(
      id_producto,
      Number(sede),
    );
  }

  @Get('code/:codigo/stock')
  async detailWithStockByCode(
    @Param('codigo') codigo: string,
    @Query('id_sede') id_sede?: string,
  ) {
    const sede = String(id_sede ?? '').trim();
    if (!sede) {
      throw new BadRequestException('id_sede es obligatorio. Ej: ?id_sede=1');
    }

    const result = await this.queryService.getProductDetailWithStockByCode(
      codigo,
      Number(sede),
    );

    // si por alguna razón el service retornara null, aquí lo convertimos en 404
    if (!result) {
      throw new NotFoundException(`Producto no encontrado: ${codigo}`);
    }

    return result;
  }

  @Get('code/:codigo')
  async getByCode(@Param('codigo') codigo: string) {
    const product = await this.queryService.getProductByCode(codigo);
    if (!product)
      throw new NotFoundException(`Producto no encontrado: ${codigo}`);
    return product;
  }

  @Get('category/:id_categoria')
  async getByCategory(
    @Param('id_categoria', ParseIntPipe) id_categoria: number,
  ) {
    return this.queryService.getProductsByCategory(id_categoria);
  }

  @Get('categorias-con-stock')
  async categoriasConStock(@Query('id_sede') id_sede?: string) {
    if (!id_sede || Number.isNaN(Number(id_sede))) {
      throw new BadRequestException('id_sede es obligatorio. Ej: ?id_sede=1');
    }
    return this.queryService.getCategoriasConStock(Number(id_sede));
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const product = await this.queryService.getProductById(id);
    if (!product) throw new NotFoundException(`Producto no encontrado: ${id}`);
    return product;
  }

  @MessagePattern({ cmd: 'get_products_info_for_remission' })
  async getInfoForRemission(@Payload() ids: string[]) {
    try {
      console.log(
        `[TCP ADMIN] Recibida petición de pesos para ${ids.length} productos`,
      );

      // Llamamos al service que consulta la base de datos
      return await this.productQueryService.getProductsWeightsByIds(ids);
    } catch (error) {
      console.error('[TCP ADMIN] Error al procesar pesos:', error.message);
      return []; // Devolvemos array vacío en caso de error para no romper Logística
    }
  }

  // apps/logistics/src/core/catalog/product/infrastructure/adapters/in/controllers/product-rest.controller.ts

  @MessagePattern({ cmd: 'get_products_codigo_by_ids' })
  async getProductsCodigoByIds(@Payload() ids: number[]) {
    try {
      return await this.queryService.getProductsCodigoByIds(ids);
    } catch (error) {
      console.error('[TCP] Error get_products_codigo_by_ids:', error.message);
      return [];
    }
  }
}
