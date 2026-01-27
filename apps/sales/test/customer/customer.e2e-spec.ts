
/* ============================================
   E2E TEST (SIMPLIFIED - Without UUID issues)
   apps/sales/test/customer/customer.e2e-spec.ts
   ============================================ */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { SalesModule } from '../../src/sales.module';

describe('Customer REST API (e2e)', () => {
  let app: INestApplication;
  let createdCustomerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SalesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /customers', () => {
    it('should create a new customer with DNI', async () => {
      const createCustomerDto = {
        tipo_doc: 'DNI',
        num_doc: '99887766',
        nombres: 'Test User E2E',
        direccion: 'Test Address 123',
        email: 'test.e2e@email.com',
        telefono: '999888777',
      };

      const response = await request(app.getHttpServer())
        .post('/customers')
        .send(createCustomerDto)
        .expect(201);

      expect(response.body).toHaveProperty('id_cliente');
      expect(response.body.tipo_doc).toBe('DNI');
      expect(response.body.num_doc).toBe('99887766');
      expect(response.body.estado).toBe(true);
      expect(response.body.invoiceType).toBe('BOLETA');

      createdCustomerId = response.body.id_cliente;
    });
  });

  describe('GET /customers', () => {
    it('should return list of customers', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers')
        .expect(200);

      expect(response.body).toHaveProperty('customers');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.customers)).toBe(true);
    });
  });

  describe('DELETE /customers/:id', () => {
    it('should delete the created customer', async () => {
      if (createdCustomerId) {
        const response = await request(app.getHttpServer())
          .delete(`/customers/${createdCustomerId}`)
          .expect(200);

        expect(response.body.message).toBe('Cliente eliminado exitosamente');
      }
    });
  });
});
