import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ISupplierCommandPort } from '../../domain/ports/in/supplier-ports-in';
import { ISupplierRepositoryPort } from '../../domain/ports/out/supplier-ports-out';
import {
  RegisterSupplierDto,
  UpdateSupplierDto,
  ChangeSupplierStatusDto,
} from '../dto/in';
import { SupplierResponseDto, SupplierDeletedResponseDto } from '../dto/out';
import { SupplierMapper } from '../mapper/supplier.mapper';

@Injectable()
export class SupplierCommandService implements ISupplierCommandPort {
  constructor(
    @Inject('ISupplierRepositoryPort')
    private readonly repository: ISupplierRepositoryPort,
  ) {}

  async registerSupplier(
    dto: RegisterSupplierDto,
  ): Promise<SupplierResponseDto> {
    // Validar formato de RUC
    if (dto.ruc.length !== 11 || !/^\d+$/.test(dto.ruc)) {
      throw new BadRequestException('El RUC debe tener 11 dígitos numéricos');
    }

    const existsByRuc = await this.repository.existsByRuc(dto.ruc);
    if (existsByRuc) {
      throw new ConflictException('Ya existe un proveedor con ese RUC');
    }

    const supplier = SupplierMapper.fromRegisterDto(dto);
    const savedSupplier = await this.repository.save(supplier);
    return SupplierMapper.toResponseDto(savedSupplier);
  }

  async updateSupplier(dto: UpdateSupplierDto): Promise<SupplierResponseDto> {
    const existingSupplier = await this.repository.findById(dto.id_proveedor);
    if (!existingSupplier) {
      throw new NotFoundException(
        `Proveedor con ID ${dto.id_proveedor} no encontrado`,
      );
    }

    if (dto.ruc && dto.ruc !== existingSupplier.ruc) {
      // Validar formato
      if (dto.ruc.length !== 11 || !/^\d+$/.test(dto.ruc)) {
        throw new BadRequestException('El RUC debe tener 11 dígitos numéricos');
      }

      const rucExists = await this.repository.existsByRuc(dto.ruc);
      if (rucExists) {
        throw new ConflictException('El RUC ya está en uso por otro proveedor');
      }
    }

    const updatedSupplier = SupplierMapper.fromUpdateDto(existingSupplier, dto);
    const savedSupplier = await this.repository.update(updatedSupplier);
    return SupplierMapper.toResponseDto(savedSupplier);
  }

  async changeSupplierStatus(
    dto: ChangeSupplierStatusDto,
  ): Promise<SupplierResponseDto> {
    const existingSupplier = await this.repository.findById(dto.id_proveedor);
    if (!existingSupplier) {
      throw new NotFoundException(
        `Proveedor con ID ${dto.id_proveedor} no encontrado`,
      );
    }

    const updatedSupplier = SupplierMapper.withStatus(
      existingSupplier,
      dto.estado,
    );
    const savedSupplier = await this.repository.update(updatedSupplier);
    return SupplierMapper.toResponseDto(savedSupplier);
  }

  async deleteSupplier(id: number): Promise<SupplierDeletedResponseDto> {
    const existingSupplier = await this.repository.findById(id);
    if (!existingSupplier) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    }

    await this.repository.delete(id);
    return SupplierMapper.toDeletedResponse(id);
  }
}
