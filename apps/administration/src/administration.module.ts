/* eslint-disable prettier/prettier */
/* administration/src/administration.module.ts */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdministrationController } from './administration.controller';
import { AdministrationService } from './administration.service';

import { UserOrmEntity } from './core/user/infrastructure/entity/user-orm.entity';
import { HeadquartersOrmEntity } from './core/headquarters/infrastructure/entity/headquarters-orm.entity';
import { RoleOrmEntity } from './core/role/infrastructure/entity/role-orm.entity';
import { PermissionOrmEntity } from './core/permission/infrastructure/entity/permission-orm.entity';
import { SedeAlmacenOrmEntity } from './core/headquarters-warehouse/infrastructure/entity/sede-almacen-orm.entity';

import { UserModule } from './core/user/user.module';
import { PermissionModule } from './core/permission/permission.module';
import { RoleModule } from './core/role/role.module';
import { HeadquartersModule } from './core/headquarters/headquarters.module';

import { UsersTcpController } from './core/user/infrastructure/adapters/in/TCP/users-tcp.controller';
import { SedeAlmacenModule } from './core/headquarters-warehouse/sede-almacen.module';
import { CuentaRolOrmEntity } from './core/user/infrastructure/entity/cuenta-rol-orm.entity';
import { CuentaUsuarioOrmEntity } from './core/user/infrastructure/entity/cuenta-usuario-orm.entity';
import { RolePermissionOrmEntity } from './core/role-permission/infrastructure/entity/role-permission-orm.entity';
import { RolePermissionModule } from './core/role-permission/role-permission.module';
import { EmpresaOrmEntity } from './core/company/infrastructure/entity/empresa.orm-entity';
import { CompanyModule } from './core/company/company.module';
import { CommonModule } from '@app/common';
import { TerminosCondicionesEntity } from './core/terms-conditions/infrastructure/entity/terms-conditions.entity';
import { TerminosSeccionEntity } from './core/terms-conditions/infrastructure/entity/terms-section.entity';
import { TerminosItemEntity } from './core/terms-conditions/infrastructure/entity/terms-item.entity';
import { TerminosParrafoEntity } from './core/terms-conditions/infrastructure/entity/terms-paragraph.entity';
import { TerminosCondicionesModule } from './core/terms-conditions/terms-conditions.module';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', 
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('ADMIN_DB_HOST'),
        port: Number(configService.get<string>('ADMIN_DB_PORT')),
        username: configService.get('ADMIN_DB_USERNAME'),
        password: configService.get('ADMIN_DB_PASSWORD') || '',
        database: configService.get('ADMIN_DB_DATABASE'),
        entities: [
          UserOrmEntity,
          HeadquartersOrmEntity,
          RoleOrmEntity,
          PermissionOrmEntity,
          SedeAlmacenOrmEntity,
          CuentaUsuarioOrmEntity,  
          CuentaRolOrmEntity, 
          RolePermissionOrmEntity,    
          EmpresaOrmEntity,      
          TerminosCondicionesEntity,  
          TerminosItemEntity,
          TerminosParrafoEntity,
          TerminosSeccionEntity,
        ],
        synchronize: false
        ,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    HeadquartersModule,
    UserModule,
    RoleModule,
    PermissionModule,
    SedeAlmacenModule,
    RolePermissionModule,
    CompanyModule,
    CommonModule,
    TerminosCondicionesModule,
  ],
  controllers: [
    AdministrationController,
    UsersTcpController, 
  ],
  providers: [AdministrationService],
})
export class AdministrationModule {}