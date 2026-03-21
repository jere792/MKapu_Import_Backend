import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresaOrmEntity } from './infrastructure/entity/empresa.orm-entity';
import { EmpresaRepository } from './infrastructure/adapters/out/repository/empresa.repository';
import { GetEmpresaService } from './application/service/query/get-empresa.service';
import { UpdateEmpresaService } from './application/service/command/update-empresa.service';
import { EmpresaController } from './infrastructure/adapters/in/controller/empresa.controller';
import { EmpresaGateway } from './infrastructure/adapters/in/websocket/empresa.gateway';
import { EMPRESA_REPOSITORY } from './domain/ports/out/empresa.repository.port';
import { GET_EMPRESA_USE_CASE } from './domain/ports/in/get-empresa.port';
import { UPDATE_EMPRESA_USE_CASE } from './domain/ports/in/update-empresa.port';
import { CloudinaryService } from './infrastructure/cloudinary/cloudinary.service';
import { ConfigModule } from '@nestjs/config';
import { EmpresaTcpController } from './infrastructure/adapters/in/controller/TCP/empresa.tcp.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EmpresaOrmEntity]), ConfigModule],
  controllers: [EmpresaController, EmpresaTcpController],
  providers: [
    EmpresaGateway,
    CloudinaryService,
    { provide: EMPRESA_REPOSITORY, useClass: EmpresaRepository },
    { provide: GET_EMPRESA_USE_CASE, useClass: GetEmpresaService },
    { provide: UPDATE_EMPRESA_USE_CASE, useClass: UpdateEmpresaService },
  ],
  exports: [GET_EMPRESA_USE_CASE],
})
export class CompanyModule {}
