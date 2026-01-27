
/* ============================================
   UNIT TESTS - Category Query Service
   apps/logistics/test/catalog/category/category-query.service.spec.ts
   ============================================ */

import { Test, TestingModule } from '@nestjs/testing';
import { CategoryQueryService } from '../../../src/core/catalog/category/application/service/category.query.service';
import { Category } from '../../../src/core/catalog/category/domain/entity/category-domain-entity';
import { ICategoryRepositoryPort } from '../../../src/core/catalog/category/domain/ports/out/category-ports-out';

describe('CategoryQueryService', () => {
  let service: CategoryQueryService;
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
        CategoryQueryService,
        {
          provide: 'ICategoryRepositoryPort',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoryQueryService>(CategoryQueryService);
  });

  describe('listCategories', () => {
    it('should return list of categories', async () => {
      const mockCategories = [
        Category.create({
          id_categoria: 1,
          nombre: 'Electrónicos',
          descripcion: 'Productos electrónicos',
          activo: true,
        }),
        Category.create({
          id_categoria: 2,
          nombre: 'Ropa',
          descripcion: 'Prendas de vestir',
          activo: true,
        }),
      ];

      mockRepository.findAll.mockResolvedValue(mockCategories);

      const result = await service.listCategories();

      expect(result.categories).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter categories by activo status', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      await service.listCategories({ activo: true });

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        activo: true,
        search: undefined,
      });
    });

    it('should search categories by text', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      await service.listCategories({ search: 'Electr' });

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        activo: undefined,
        search: 'Electr',
      });
    });
  });

  describe('getCategoryById', () => {
    it('should return category when found', async () => {
      const mockCategory = Category.create({
        id_categoria: 1,
        nombre: 'Electrónicos',
        descripcion: 'Test',
        activo: true,
      });

      mockRepository.findById.mockResolvedValue(mockCategory);

      const result = await service.getCategoryById(1);

      expect(result).not.toBeNull();
      expect(result?.id_categoria).toBe(1);
    });

    it('should return null when category not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.getCategoryById(999);

      expect(result).toBeNull();
    });
  });
});
