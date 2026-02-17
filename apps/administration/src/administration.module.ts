/* eslint-disable prettier/prettier */
/* administration/src/administration.module.ts */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdministrationController } from './administration.controller';
import { AdministrationService } from './administration.service';

//orm entities
import { UserOrmEntity } from './core/user/infrastructure/entity/user-orm.entity';
import { HeadquartersOrmEntity } from './core/headquarters/infrastructure/entity/headquarters-orm.entity';
import { RoleOrmEntity } from './core/role/infrastructure/entity/role-orm.entity';
import { PermissionOrmEntity } from './core/permission/infrastructure/entity/permission-orm.entity';

//modules
import { UserModule } from './core/user/user.module';
import { PermissionModule } from './core/permission/permission.module';
import { RoleModule } from './core/role/role.module';
import { HeadquartersModule } from './core/headquarters/headquarters.module';

import { UsersTcpController } from './core/user/infrastructure/adapters/in/TCP/users-tcp.controller';
@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', 
    }),

    // Configuración dinámica de TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('ADMIN_DB_HOST'),
        port: Number(configService.get<string>('ADMIN_DB_PORT')),
        username: configService.get('ADMIN_DB_USERNAME'),
        password: configService.get('ADMIN_DB_PASSWORD') || '',
        database: configService.get('ADMIN_DB_DATABASE'),
        entities: [UserOrmEntity, HeadquartersOrmEntity, RoleOrmEntity, PermissionOrmEntity],
        synchronize: false,
        logging: true,
      }),
      inject: [ConfigService],
    }),

    // Módulos del microservicio
    HeadquartersModule,
    UserModule,
    RoleModule,
    PermissionModule,
  ],
  controllers: [
    AdministrationController,
    UsersTcpController, 
  ],
  providers: [AdministrationService],
})
export class AdministrationModule {}