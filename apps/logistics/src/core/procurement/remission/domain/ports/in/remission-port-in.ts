import { CreateRemissionDto } from '../../../application/dto/in/create-remission.dto';

export interface RemissionPortIn {
  createRemission(dto: CreateRemissionDto);
}
