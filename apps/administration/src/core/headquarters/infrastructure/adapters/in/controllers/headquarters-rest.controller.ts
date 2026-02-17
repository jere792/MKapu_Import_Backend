/* eslint-disable prettier/prettier */
/* ============================================
   administration/src/core/headquarters/infrastructure/controllers/headquarters-rest.controller.ts
   ============================================ */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  IHeadquartersCommandPort,
  IHeadquartersQueryPort,
} from '../../../../domain/ports/in/headquarters-ports-in';
import { HeadquarterWebSocketGateway } from '../../out/headquarters-websocket.gateway';
import { HeadquartersResponseDto } from '../../../../application/dto/out/headquarters-response-dto';
import { RegisterHeadquartersDto } from '../../../../application/dto/in/register-headquarters-dto';
import { UpdateHeadquartersDto } from '../../../../application/dto/in/update-headquarters-dto';
import { HeadquartersDeletedResponseDto } from '../../../../application/dto/out/headquarters-deleted-response-dto';
import { ListHeadquartersFilterDto } from '../../../../application/dto/in/list-headquarters-filter-dto';
import { HeadquartersListResponse } from '../../../../application/dto/out/headquarters-list-response';
import { Roles } from 'libs/common/src/infrastructure/decorators/roles.decorators';
import { RoleGuard } from 'libs/common/src/infrastructure/guard/roles.guard';

@Controller('headquarters')
//@UseGuards(RoleGuard)
//@Roles('Administrador') 
export class HeadquarterRestController {
  constructor(
    @Inject('IHeadquartersQueryPort')
    private readonly headquartersQueryService: IHeadquartersQueryPort,
    @Inject('IHeadquartersCommandPort')
    private readonly headquartersCommandService: IHeadquartersCommandPort,
    private readonly headquartersGateway: HeadquarterWebSocketGateway,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerHeadquarter(
    @Body() registerDto: RegisterHeadquartersDto,
  ): Promise<HeadquartersResponseDto> {
    const headquarter =
      await this.headquartersCommandService.registerHeadquarter(registerDto);
    this.headquartersGateway.notifyHeadquarterCreated(headquarter);

    return headquarter;
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateHeadquarter(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Omit<UpdateHeadquartersDto, 'id_sede'>,
  ): Promise<HeadquartersResponseDto> {
    const fullUpdateDto: UpdateHeadquartersDto = {
      ...updateDto,
      id_sede: id,
    };

    const updatedHeadquarter =
      await this.headquartersCommandService.updateHeadquarter(fullUpdateDto);
    this.headquartersGateway.notifyHeadquarterUpdated(updatedHeadquarter);

    return updatedHeadquarter;
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  async changeHeadquarterStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeStatusDto: { status: boolean },
  ): Promise<HeadquartersResponseDto> {
    const updatedHeadquarter =
      await this.headquartersCommandService.changeHeadquarterStatus({
        id_sede: id,
        activo: changeStatusDto.status,
      });
    this.headquartersGateway.notifyHeadquarterUpdated(updatedHeadquarter);

    return updatedHeadquarter;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteHeadquarter(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<HeadquartersDeletedResponseDto> {
    const deletedHeadquarter =
      await this.headquartersCommandService.deleteHeadquarter(id);
    this.headquartersGateway.notifyHeadquarterDeleted(id);

    return deletedHeadquarter;
  }

  @Get(':id')
  async getHeadquarterById(@Param('id') id: number) {
    return await this.headquartersQueryService.getHeadquarterById(id);
  }

  @Get()
  async listHeadquarters(
    @Query() filters: ListHeadquartersFilterDto,
  ): Promise<HeadquartersListResponse> {
    return await this.headquartersQueryService.listHeadquarters(filters);
  }
}
