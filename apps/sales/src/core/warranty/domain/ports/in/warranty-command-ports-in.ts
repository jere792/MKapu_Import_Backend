import { RegisterWarrantyDto } from '../../../application/dto/in/register-warranty.dto';
import { UpdateWarrantyDto } from '../../../application/dto/in/update-warranty.dto';
import {
  WarrantyDeleteResponseDto,
  WarrantyResponseDto,
} from '../../../application/dto/out/warranty-response.dto';

export interface IWarrantyCommandPort {
  registerWarranty(dto: RegisterWarrantyDto): Promise<WarrantyResponseDto>;
  updateWarranty(
    id: number,
    dto: UpdateWarrantyDto,
  ): Promise<WarrantyResponseDto>;
  changeStatus(
    id: number,
    idEstado: number,
    comentario: string,
    idUsuario: string,
  ): Promise<WarrantyResponseDto>;
  deleteWarranty(id: number): Promise<WarrantyDeleteResponseDto>;
}
