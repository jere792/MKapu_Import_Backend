// libs/common/src/common.module.ts
import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [CommonService, JwtStrategy],
  exports: [CommonService, JwtStrategy, PassportModule, ConfigModule],
})
export class CommonModule {}
