import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [CommonService, JwtStrategy],
  exports: [CommonService, JwtStrategy, PassportModule],
})
export class CommonModule {}
