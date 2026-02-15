import { WastageResponseDto } from '../dto/out/wastage-response.dto';
import { WastageDetailResponseDto } from '../dto/out/wastage-detail-response.dto';
import { Wastage } from '../../domain/entity/wastage-domain-intity';
import { WastageDetail } from '../../domain/entity/wastage-domain-intity';

export class WastageMapper {
  static detailToResponseDto(detail: WastageDetail): WastageDetailResponseDto {
    return {
      id_detalle: detail.id_detalle as number,
      id_producto: detail.id_producto,
      cod_prod: detail.cod_prod,
      desc_prod: detail.desc_prod,
      cantidad: detail.cantidad,
      pre_unit: detail.pre_unit,
      observacion: detail.observacion ?? undefined,
      id_tipo_merma: (detail as any).id_tipo_merma ?? undefined,
    };
  }

  static toResponseDto(domain: Wastage): WastageResponseDto {
    const dto = new WastageResponseDto();

    dto.id_merma = domain.id_merma!;
    dto.fec_merma = domain.fec_merma;
    dto.motivo = domain.motivo;
    dto.total_items = (domain.detalles || []).reduce((acc, d) => acc + (d.cantidad || 0), 0);
    dto.estado = !!domain.estado;

    dto.detalles = (domain.detalles || []).map((d: WastageDetail) => this.detailToResponseDto(d));


    dto.responsable = (domain as any).responsable ?? undefined;


    dto.tipo_merma_id = (domain as any).tipo_merma_id ?? null;
    dto.tipo_merma_label = (domain as any).tipo_merma_label ?? null;

    if (!dto.tipo_merma_id && dto.detalles && dto.detalles.length > 0) {
      dto.tipo_merma_id = dto.detalles[0].id_tipo_merma ?? null;
    }

    return dto;
  }
}