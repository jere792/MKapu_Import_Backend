

/* ============================================
   E2E TESTS - Category REST API
   apps/logistics/test/catalog/category/category.e2e-spec.ts
   ============================================ */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { LogisticsModule } from '../../../src/logistics.module';

describe('Category REST API (e2e)', () => {
  let app: INestApplication;
  let createdCategoryId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [LogisticsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /categories', () => {
    it('should create a new category', async () => {
      const createCategoryDto = {
        nombre: 'Test Category E2E',
        descripcion: 'Descripción de prueba',
      };

      const response = await request(app.getHttpServer())
        .post('/categories')
        .send(createCategoryDto)
        .expect(201);

      expect(response.body).toHaveProperty('id_categoria');
      expect(response.body.nombre).toBe('Test Category E2E');
      expect(response.body.activo).toBe(true);

      createdCategoryId = response.body.id_categoria;
    });

    it('should return 409 when creating category with duplicate name', async () => {
      const createCategoryDto = {
        nombre: 'Test Category E2E',
        descripcion: 'Test',
      };

      await request(app.getHttpServer())
        .post('/categories')
        .send(createCategoryDto)
        .expect(409);
    });
  });

  describe('GET /categories', () => {
    it('should return list of categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      expect(response.body).toHaveProperty('categories');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.categories)).toBe(true);
    });

    it('should filter categories by activo', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories?activo=true')
        .expect(200);

      if (response.body.total > 0) {
        expect(response.body.categories.every((c: any) => c.activo === true)).toBe(true);
      }
    });
  });

  describe('GET /categories/:id', () => {
    it('should return a category by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/categories/${createdCategoryId}`)
        .expect(200);

      expect(response.body.id_categoria).toBe(createdCategoryId);
    });
  });

  describe('PUT /categories/:id', () => {
    it('should update category', async () => {
      const updateDto = {
        nombre: 'Test Category Updated',
        descripcion: 'Descripción actualizada',
      };

      const response = await request(app.getHttpServer())
        .put(`/categories/${createdCategoryId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.nombre).toBe('Test Category Updated');
    });
  });

  describe('PUT /categories/:id/status', () => {
    it('should change category status', async () => {
      const response = await request(app.getHttpServer())
        .put(`/categories/${createdCategoryId}/status`)
        .send({ activo: false })
        .expect(200);

      expect(response.body.activo).toBe(false);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should delete category', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/categories/${createdCategoryId}`)
        .expect(200);

      expect(response.body.message).toContain('eliminada');
    });
  });
});
