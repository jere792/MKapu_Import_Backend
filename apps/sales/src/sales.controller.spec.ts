import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

// Ajusta rutas
import { SalesController } from './../src/sales.controller';
import { SalesService } from './../src/sales.service';
import { DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';

describe('SalesController (e2e)', () => {
  let app: INestApplication;

  // Mocks mínimos
  const mockDataSource: Partial<DataSource> = {
    // agrega lo que SalesService realmente use (getRepository, manager, etc.) si llega a invocarlo
  };

  const mockHttpService: Partial<HttpService> = {
    get: jest.fn(),
    post: jest.fn(),
  };

  const mockSalesService = {
    root: jest.fn().mockReturnValue('Hello World!'),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [
        { provide: SalesService, useValue: mockSalesService },
        { provide: DataSource, useValue: mockDataSource },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});