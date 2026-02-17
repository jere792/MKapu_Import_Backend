//application/service/headquarters-command.service.ts
/* ============================================
   administration/src/core/headquarters/application/service/headquarters-command.service.ts
   ============================================ */

import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { IHeadquartersCommandPort } from "../../domain/ports/in/headquarters-ports-in";
import { IHeadquartersRepositoryPort } from "../../domain/ports/out/headquarters-ports-out";
import { RegisterHeadquartersDto } from "../dto/in/register-headquarters-dto";
import { HeadquartersResponseDto } from "../dto/out/headquarters-response-dto";
import { HeadquartersMapper } from "../mapper/headquarters.mapper";
import { ChangeHeadquartersDto } from "../dto/in/change-headquarters-dto";
import { UpdateHeadquartersDto } from "../dto/in/update-headquarters-dto";
import { HeadquartersDeletedResponseDto } from "../dto/out/headquarters-deleted-response-dto";

@Injectable()
export class HeadquartersCommandService implements IHeadquartersCommandPort {
   constructor(
      @Inject('IHeadquartersRepositoryPort')
      private readonly repository: IHeadquartersRepositoryPort
   ) {}

   // POST - Registrar nueva sede
   async registerHeadquarter(dto: RegisterHeadquartersDto): Promise<HeadquartersResponseDto> {
      const existsByCode = await this.repository.existsByCode(dto.codigo);

      if (existsByCode) {
         throw new ConflictException('Ya existe una sede con ese código');
      }
      
      const existsByName =  await this.repository.existsByName(dto.nombre);

      if (existsByName) {
         throw new ConflictException('Ya existe una sede con ese nombre');
      }

      const headquarter = HeadquartersMapper.fromRegisterDto(dto);
      const savedHeadquarter = await this.repository.save(headquarter);

      return HeadquartersMapper.toResponseDto(savedHeadquarter);
   }

   // PUT - Actualizar sede
   async updateHeadquarter(dto: UpdateHeadquartersDto): Promise<HeadquartersResponseDto> {
      const existingHeadquarter = await this.repository.findById(dto.id_sede);
      if (!existingHeadquarter) {
         throw new ConflictException('No existe una sede con ese ID');
      }
      const updatedHeadquarter = HeadquartersMapper.fromUpdateDto(existingHeadquarter, dto);
      const savedHeadquarter = await this.repository.save(updatedHeadquarter);

      return HeadquartersMapper.toResponseDto(savedHeadquarter);
   }

   // PUT - Cambiar estado de sede
   async changeHeadquarterStatus(dto: ChangeHeadquartersDto): Promise<HeadquartersResponseDto> {
   const existingHeadquarter = await this.repository.findById(dto.id_sede);
   if (!existingHeadquarter) {
      throw new ConflictException('No existe una sede con ese ID');
   }

   const updatedHeadquarter = HeadquartersMapper.withStatus(existingHeadquarter, dto.activo);
   const savedHeadquarter = await this.repository.save(updatedHeadquarter);

   return HeadquartersMapper.toResponseDto(savedHeadquarter);
   }

   // DELETE - Eliminar sede
   async deleteHeadquarter(id: number): Promise<HeadquartersDeletedResponseDto> {
      const existingHeadquarter = await this.repository.findById(id);
      if (!existingHeadquarter) {
         throw new ConflictException('No existe una sede con ese ID');
      }

      await this.repository.delete(id);

      return HeadquartersMapper.toDeletedResponseDto(id);
   }
}