/* ============================================
   logistics/src/core/catalog/category/application/service/category-command.service.ts
   ============================================ */

import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ICategoryCommandPort } from '../../domain/ports/in/category-ports-in';
import { ICategoryRepositoryPort } from '../../domain/ports/out/category-ports-out';
import {
  RegisterCategoryDto,
  UpdateCategoryDto,
  ChangeCategoryStatusDto,
} from '../dto/in';
import {
  CategoryResponseDto,
  CategoryDeletedResponseDto,
} from '../dto/out';
import { CategoryMapper } from '../mapper/category.mapper';

@Injectable()
export class CategoryCommandService implements ICategoryCommandPort {
  constructor(
    @Inject('ICategoryRepositoryPort')
    private readonly repository: ICategoryRepositoryPort,
  ) {}

  async registerCategory(dto: RegisterCategoryDto): Promise<CategoryResponseDto> {
    const existsByName = await this.repository.existsByName(dto.nombre);
    if (existsByName) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }

    const category = CategoryMapper.fromRegisterDto(dto);
    const savedCategory = await this.repository.save(category);
    return CategoryMapper.toResponseDto(savedCategory);
  }

  async updateCategory(dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const existingCategory = await this.repository.findById(dto.id_categoria);
    if (!existingCategory) {
      throw new NotFoundException(`Categoría con ID ${dto.id_categoria} no encontrada`);
    }

    if (dto.nombre && dto.nombre !== existingCategory.nombre) {
      // ← Excluye el propio registro de la validación
      const nameExists = await this.repository.existsByNameExcludingId(
        dto.nombre,
        dto.id_categoria,
      );
      if (nameExists) {
        throw new ConflictException('El nombre ya está en uso por otra categoría');
      }
    }

    const updatedCategory = CategoryMapper.fromUpdateDto(existingCategory, dto);
    const savedCategory   = await this.repository.update(updatedCategory);
    return CategoryMapper.toResponseDto(savedCategory);
  }

  async changeCategoryStatus(dto: ChangeCategoryStatusDto): Promise<CategoryResponseDto> {
    const existingCategory = await this.repository.findById(dto.id_categoria);
    if (!existingCategory) {
      throw new NotFoundException(`Categoría con ID ${dto.id_categoria} no encontrada`);
    }

    const updatedCategory = CategoryMapper.withStatus(existingCategory, dto.activo);
    const savedCategory = await this.repository.update(updatedCategory);
    return CategoryMapper.toResponseDto(savedCategory);
  }

  async deleteCategory(id: number): Promise<CategoryDeletedResponseDto> {
    const existingCategory = await this.repository.findById(id);
    if (!existingCategory) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }

    await this.repository.delete(id);
    return CategoryMapper.toDeletedResponse(id);
  }
}