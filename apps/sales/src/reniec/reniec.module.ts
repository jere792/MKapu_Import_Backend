import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReniecController } from './reniec.controller';
import { ReniecService } from './reniec.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 8000,
      maxRedirects: 3,
    }),
  ],
  controllers: [ReniecController],
  providers:   [ReniecService],
})
export class ReniecModule {}