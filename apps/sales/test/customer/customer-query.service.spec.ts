/* ============================================
   FIXED: Customer Query Service Tests with UUID Mock
   apps/sales/test/customer/customer-query.service.spec.ts
   ============================================ */

import { Test, TestingModule } from '@nestjs/testing';
import { CustomerQueryService } from '../../src/core/customer/application/service/customer-query.service';
import { Customer } from '../../src/core/customer/domain/entity/customer-domain-entity';
import { ICustomerRepositoryPort } from '../../src/core/customer/domain/ports/out/customer-port-out';

// ⚠️ IMPORTANTE: Mock de uuid ANTES de cualquier otro import
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

describe('CustomerQueryService', () => {
  let service: CustomerQueryService;
  let mockRepository: jest.Mocked<ICustomerRepositoryPort>;

  beforeEach(async () => {
    mockRepository = {
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByDocument: jest.fn(),
      findAll: jest.fn(),
      existsByDocument: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerQueryService,
        {
          provide: 'ICustomerRepositoryPort',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CustomerQueryService>(CustomerQueryService);
  });

  describe('listCustomers', () => {
    it('should return list of customers', async () => {
      const mockCustomers = [
        Customer.create({
          id_cliente: 'uuid-1',
          tipo_doc: 'DNI',
          num_doc: '12345678',
          nombres: 'User 1',
          estado: true,
        }),
        Customer.create({
          id_cliente: 'uuid-2',
          tipo_doc: 'RUC',
          num_doc: '20123456789',
          razon_social: 'Company 1',
          estado: true,
        }),
      ];

      mockRepository.findAll.mockResolvedValue(mockCustomers);

      const result = await service.listCustomers();

      expect(result.customers).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });

    it('should filter customers by estado', async () => {
      const filters = { estado: true };
      mockRepository.findAll.mockResolvedValue([]);

      await service.listCustomers(filters);

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        estado: true,
        search: undefined,
        tipo_doc: undefined,
      });
    });

    it('should filter customers by search term', async () => {
      const filters = { search: 'Test' };
      mockRepository.findAll.mockResolvedValue([]);

      await service.listCustomers(filters);

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        estado: undefined,
        search: 'Test',
        tipo_doc: undefined,
      });
    });

    it('should filter customers by tipo_doc', async () => {
      const filters = { tipo_doc: 'RUC' as const };
      mockRepository.findAll.mockResolvedValue([]);

      await service.listCustomers(filters);

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        estado: undefined,
        search: undefined,
        tipo_doc: 'RUC',
      });
    });

    it('should apply multiple filters', async () => {
      const filters = {
        estado: true,
        search: 'Test',
        tipo_doc: 'DNI' as const,
      };
      mockRepository.findAll.mockResolvedValue([]);

      await service.listCustomers(filters);

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        estado: true,
        search: 'Test',
        tipo_doc: 'DNI',
      });
    });
  });

  describe('getCustomerById', () => {
    it('should return customer when found', async () => {
      const mockCustomer = Customer.create({
        id_cliente: 'test-uuid',
        tipo_doc: 'DNI',
        num_doc: '12345678',
        estado: true,
      });

      mockRepository.findById.mockResolvedValue(mockCustomer);

      const result = await service.getCustomerById('test-uuid');

      expect(result).not.toBeNull();
      expect(result?.id_cliente).toBe('test-uuid');
      expect(mockRepository.findById).toHaveBeenCalledWith('test-uuid');
    });

    it('should return null when customer not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.getCustomerById('non-existent-uuid');

      expect(result).toBeNull();
      expect(mockRepository.findById).toHaveBeenCalledWith('non-existent-uuid');
    });
  });

  describe('getCustomerByDocument', () => {
    it('should return customer when found by document', async () => {
      const mockCustomer = Customer.create({
        id_cliente: 'test-uuid',
        tipo_doc: 'DNI',
        num_doc: '12345678',
        estado: true,
      });

      mockRepository.findByDocument.mockResolvedValue(mockCustomer);

      const result = await service.getCustomerByDocument('12345678');

      expect(result).not.toBeNull();
      expect(result?.num_doc).toBe('12345678');
      expect(mockRepository.findByDocument).toHaveBeenCalledWith('12345678');
    });

    it('should return null when customer not found by document', async () => {
      mockRepository.findByDocument.mockResolvedValue(null);

      const result = await service.getCustomerByDocument('00000000');

      expect(result).toBeNull();
      expect(mockRepository.findByDocument).toHaveBeenCalledWith('00000000');
    });

    it('should handle RUC documents', async () => {
      const mockCustomer = Customer.create({
        id_cliente: 'test-uuid',
        tipo_doc: 'RUC',
        num_doc: '20123456789',
        razon_social: 'Test Company SAC',
        estado: true,
      });

      mockRepository.findByDocument.mockResolvedValue(mockCustomer);

      const result = await service.getCustomerByDocument('20123456789');

      expect(result).not.toBeNull();
      expect(result?.tipo_doc).toBe('RUC');
      expect(result?.num_doc).toBe('20123456789');
    });
  });
});
