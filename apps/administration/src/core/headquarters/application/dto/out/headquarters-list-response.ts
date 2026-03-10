import { HeadquartersResponseDto } from "./headquarters-response-dto";

export interface HeadquartersListResponse {
   headquarters: HeadquartersResponseDto[];
   total: number;
   page?: number;
   pageSize?: number;
}