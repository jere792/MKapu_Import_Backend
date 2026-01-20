/* logistics/src/logistics.controller.spec.ts */
import { Test, TestingModule } from '@nestjs/testing';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';

describe('LogisticsController', () => {
  let logisticsController: LogisticsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [LogisticsController],
      providers: [LogisticsService],
    }).compile();

    logisticsController = app.get<LogisticsController>(LogisticsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(logisticsController.getHello()).toBe('Hello World!');
    });
  });
});
