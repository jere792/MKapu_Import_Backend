import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  CLAIM_COMMAND_PORT,
  CLAIM_QUERY_PORT,
  IClaimCommandPort,
  IClaimQueryPort,
} from '../../../../domain/ports/in/claim-port-in';
import { RegisterClaimDto } from '../../../../application/dto/in/register-claim-dto';
import { ClaimResponseDto } from '../../../../application/dto/out/claim-response-dto';
import { ClaimMapper } from '../../../../application/mapper/claim.mapper';

@ApiTags('Reclamos')
@Controller('claims')
export class ClaimRestController {
  constructor(
    @Inject(CLAIM_COMMAND_PORT)
    private readonly claimCommand: IClaimCommandPort,
    @Inject(CLAIM_QUERY_PORT) private readonly claimQuery: IClaimQueryPort,
  ) {}
  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo reclamo' })
  async register(@Body() dto: RegisterClaimDto) {
    return await this.claimCommand.register(dto);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un reclamo' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    const claim = await this.claimQuery.getById(id);
    return ClaimMapper.toResponseDto(claim);
  }

  @Get('receipt/:receiptId')
  @ApiOperation({ summary: 'Listar reclamos por comprobante' })
  async listByReceipt(@Param('receiptId', ParseIntPipe) receiptId: number) {
    return await this.claimQuery.listBySalesReceipt(receiptId);
  }

  @Patch(':id/attend')
  @ApiOperation({ summary: 'Atender un reclamo (Administrativo)' })
  async attend(
    @Param('id', ParseIntPipe) id: number,
    @Body('respuesta') respuesta: string,
  ) {
    return await this.claimCommand.attend(id, respuesta);
  }

  @Patch(':id/resolve')
  async resolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: { respuesta: string },
  ): Promise<ClaimResponseDto> {
    return await this.claimCommand.resolve(id, updateDto.respuesta);
  }
  @Get('sede/:sedeId')
  @ApiOperation({ summary: 'Listar reclamos por sede' })
  @ApiParam({
    name: 'sedeId',
    description: 'ID de la sede del usuario',
    type: 'number',
  })
  async listBySede(@Param('sedeId', ParseIntPipe) sedeId: number) {
    return await this.claimQuery.listBySede(sedeId);
  }
}
