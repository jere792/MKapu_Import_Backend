/* ============================================
   UNIT TESTS - Category Command Service
   apps/logistics/test/catalog/category/category-command.service.spec.ts
   ============================================ */

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoryCommandService } from '../../../src/core/catalog/category/application/service/category-comand.service';
import { ICategoryRepositoryPort } from '../../../src/core/catalog/category/domain/ports/out/category-ports-out';
import { Category } from '../../../src/core/catalog/category/domain/entity/category-domain-entity';

describe('CategoryCommandService', () => {
  let service: CategoryCommandService;
  let mockRepository: jest.Mocked<ICategoryRepositoryPort>;

  beforeEach(async () => {
    mockRepository = {
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      existsByName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryCommandService,
        {
          provide: 'ICategoryRepositoryPort',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoryCommandService>(CategoryCommandService);
  });

  describe('registerCategory', () => {
    it('should create a new category successfully', async () => {
      const registerDto = {
        nombre: 'Electrónicos',
        descripcion: 'Productos electrónicos',
      };

      const mockCategory = Category.create({
        id_categoria: 1,
        nombre: 'Electrónicos',
        descripcion: 'Productos electrónicos',
        activo: true,
      });

      mockRepository.existsByName.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue(mockCategory);

      const result = await service.registerCategory(registerDto);

      expect(mockRepository.existsByName).toHaveBeenCalledWith('Electrónicos');
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.nombre).toBe('Electrónicos');
    });

    it('should throw ConflictException when category name already exists', async () => {
      const registerDto = {
        nombre: 'Electrónicos',
        descripcion: 'Productos electrónicos',
      };

      mockRepository.existsByName.mockResolvedValue(true);

      await expect(service.registerCategory(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      const updateDto = {
        id_categoria: 1,
        nombre: 'Electrónicos Actualizados',
        descripcion: 'Nueva descripción',
      };

      const existingCategory = Category.create({
        id_categoria: 1,
        nombre: 'Electrónicos',
        descripcion: 'Descripción original',
        activo: true,
      });

      const updatedCategory = Category.create({
        id_categoria: 1,
        nombre: 'Electrónicos Actualizados',
        descripcion: 'Nueva descripción',
        activo: true,
      });

      mockRepository.findById.mockResolvedValue(existingCategory);
      mockRepository.update.mockResolvedValue(updatedCategory);

      const result = await service.updateCategory(updateDto);

      expect(result.nombre).toBe('Electrónicos Actualizados');
    });

    it('should throw NotFoundException when category does not exist', async () => {
      const updateDto = {
        id_categoria: 999,
        nombre: 'Test',
      };

      mockRepository.findById.mockResolvedValue(null);

      await expect(service.updateCategory(updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('changeCategoryStatus', () => {
    it('should change category status to inactive', async () => {
      const statusDto = {
        id_categoria: 1,
        activo: false,
      };

      const existingCategory = Category.create({
        id_categoria: 1,
        nombre: 'Electrónicos',
        descripcion: 'Test',
        activo: true,
      });

      const updatedCategory = Category.create({
        id_categoria: 1,
        nombre: 'Electrónicos',
        descripcion: 'Test',
        activo: false,
      });

      mockRepository.findById.mockResolvedValue(existingCategory);
      mockRepository.update.mockResolvedValue(updatedCategory);

      const result = await service.changeCategoryStatus(statusDto);

      expect(result.activo).toBe(false);
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      const categoryId = 1;

      const existingCategory = Category.create({
        id_categoria: categoryId,
        nombre: 'Electrónicos',
        descripcion: 'Test',
        activo: true,
      });

      mockRepository.findById.mockResolvedValue(existingCategory);
      mockRepository.delete.mockResolvedValue(undefined);

      const result = await service.deleteCategory(categoryId);

      expect(result.id_categoria).toBe(categoryId);
      expect(result.message).toContain('eliminada');
    });
  });
});