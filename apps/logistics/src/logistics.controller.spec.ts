import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';
import { InventoryCommandService } from '../src/core/warehouse/inventory/application/service/inventory-command.service';


describe('LogisticsController (e2e)', () => {
  let app: INestApplication;

  const mockInventoryCommandService = {
  };

  const mockLogisticsService = {
    root: jest.fn().mockReturnValue('Hello World!'),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [LogisticsController],
      providers: [
        { provide: LogisticsService, useValue: mockLogisticsService },
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