import { CreateRemissionDto } from '../../../application/dto/in/create-remission.dto';

export interface RemissionCommandPortIn {
  createRemission(dto: CreateRemissionDto);
  searchSaleToForward(correlativo: string);
  changeStatus(
    idGuia: string,
    estado: string,
  ): Promise<{ success: boolean; message: string }>;
}
