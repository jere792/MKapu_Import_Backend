import { Inject, Injectable } from "@nestjs/common";
import { IHeadquartersQueryPort } from "../../domain/ports/in/headquarters-ports-in";
import { IHeadquartersRepositoryPort } from "../../domain/ports/out/headquarters-ports-out";
import { ListHeadquartersFilterDto } from "../dto/in/list-headquarters-filter-dto";
import { HeadquartersResponseDto } from "../dto/out/headquarters-response-dto";
import { HeadquartersMapper } from "../mapper/headquarters.mapper";
import { HeadquartersListResponse } from "../dto/out/headquarters-list-response";

@Injectable()
export class HeadquartersQueryService implements IHeadquartersQueryPort {
   constructor(
      @Inject('IHeadquartersRepositoryPort')
      private readonly repository: IHeadquartersRepositoryPort
   ) {}

   async listHeadquarters(filters?: ListHeadquartersFilterDto): Promise<HeadquartersListResponse> {
      const headquarters = await this.repository.findAll(filters);

      return HeadquartersMapper.toListResponse(headquarters);
   }

   async getHeadquarterById(id: number): Promise<HeadquartersResponseDto | null> {
      const headquarter = await this.repository.findById(id);

      if (!headquarter) {
         return null
      }

      return HeadquartersMapper.toResponseDto(headquarter);
   }

   async getHeadquarterByCode(code: string): Promise<HeadquartersResponseDto | null> {
      const headquarter = await this.repository.findByCode(code);

      if (!headquarter) {
         return null
      }

      return HeadquartersMapper.toResponseDto(headquarter);
   }

   async getHeadquarterByName(name: string): Promise<HeadquartersResponseDto | null> {
      const headquarter = await this.repository.findByName(name);

      if (!headquarter) {
         return null
      }

      return HeadquartersMapper.toResponseDto(headquarter);
   }
}