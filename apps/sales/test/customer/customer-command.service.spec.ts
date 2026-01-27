
/* ============================================
   FIXED: Customer Command Service Tests
   apps/sales/test/customer/customer-command.service.spec.ts
   ============================================ */

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CustomerCommandService } from '../../src/core/customer/application/service/customer-command.service';
import { ICustomerRepositoryPort } from '../../src/core/customer/domain/ports/out/customer-port-out';
import { Customer } from '../../src/core/customer/domain/entity/customer-domain-entity';

// Mock uuid para evitar problemas con ESM
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

describe('CustomerCommandService', () => {
  let service: CustomerCommandService;
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
        CustomerCommandService,
        {
          provide: 'ICustomerRepositoryPort',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CustomerCommandService>(CustomerCommandService);
  });

  describe('registerCustomer', () => {
    it('should create a new customer successfully', async () => {
      const registerDto = {
        tipo_doc: 'DNI' as const,
        num_doc: '12345678',
        nombres: 'Test User',
        direccion: 'Test Address',
        email: 'test@email.com',
        telefono: '987654321',
      };

      const mockCustomer = Customer.create({
        id_cliente: 'test-uuid',
        tipo_doc: 'DNI',
        num_doc: '12345678',
        nombres: 'Test User',
        direccion: 'Test Address',
        email: 'test@email.com',
        telefono: '987654321',
        estado: true,
      });

      mockRepository.existsByDocument.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue(mockCustomer);

      const result = await service.registerCustomer(registerDto);

      expect(mockRepository.existsByDocument).toHaveBeenCalledWith('12345678');
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('num_doc', '12345678');
    });

    it('should throw ConflictException when document already exists', async () => {
      const registerDto = {
        tipo_doc: 'DNI' as const,
        num_doc: '12345678',
        nombres: 'Test User',
      };

      mockRepository.existsByDocument.mockResolvedValue(true);

      await expect(service.registerCustomer(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateCustomer', () => {
    it('should update customer successfully', async () => {
      const updateDto = {
        id_cliente: 'test-uuid',
        nombres: 'Updated Name',
        email: 'updated@email.com',
      };

      const existingCustomer = Customer.create({
        id_cliente: 'test-uuid',
        tipo_doc: 'DNI',
        num_doc: '12345678',
        nombres: 'Original Name',
        estado: true,
      });

      const updatedCustomer = Customer.create({
        id_cliente: 'test-uuid',
        tipo_doc: 'DNI',
        num_doc: '12345678',
        nombres: 'Updated Name',
        email: 'updated@email.com',
        estado: true,
      });

      mockRepository.findById.mockResolvedValue(existingCustomer);
      mockRepository.update.mockResolvedValue(updatedCustomer);

      const result = await service.updateCustomer(updateDto);

      expect(mockRepository.findById).toHaveBeenCalledWith('test-uuid');
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      const updateDto = {
        id_cliente: 'non-existent-uuid',
        nombres: 'Test',
      };

      mockRepository.findById.mockResolvedValue(null);

      await expect(service.updateCustomer(updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('changeCustomerStatus', () => {
    it('should change customer status successfully', async () => {
      const statusDto = {
        id_cliente: 'test-uuid',
        estado: false,
      };

      const existingCustomer = Customer.create({
        id_cliente: 'test-uuid',
        tipo_doc: 'DNI',
        num_doc: '12345678',
        estado: true,
      });

      const updatedCustomer = Customer.create({
        id_cliente: 'test-uuid',
        tipo_doc: 'DNI',
        num_doc: '12345678',
        estado: false,
      });

      mockRepository.findById.mockResolvedValue(existingCustomer);
      mockRepository.update.mockResolvedValue(updatedCustomer);

      await service.changeCustomerStatus(statusDto);

      expect(mockRepository.findById).toHaveBeenCalledWith('test-uuid');
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      const statusDto = {
        id_cliente: 'non-existent-uuid',
        estado: false,
      };

      mockRepository.findById.mockResolvedValue(null);

      await expect(service.changeCustomerStatus(statusDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteCustomer', () => {
    it('should delete customer successfully', async () => {
      const customerId = 'test-uuid';

      const existingCustomer = Customer.create({
        id_cliente: customerId,
        tipo_doc: 'DNI',
        num_doc: '12345678',
        estado: true,
      });

      mockRepository.findById.mockResolvedValue(existingCustomer);
      mockRepository.delete.mockResolvedValue(undefined);

      const result = await service.deleteCustomer(customerId);

      expect(mockRepository.findById).toHaveBeenCalledWith(customerId);
      expect(mockRepository.delete).toHaveBeenCalledWith(customerId);
      expect(result.id_cliente).toBe(customerId);
      expect(result.message).toBe('Cliente eliminado exitosamente');
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      const customerId = 'non-existent-uuid';

      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deleteCustomer(customerId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
