/* administration/src/administration.module.ts */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdministrationController } from './administration.controller';
import { AdministrationService } from './administration.service';
import { UserModule } from './core/user/user.module';
import { UserOrmEntity } from './core/user/infrastructure/entity/user-orm.entity';
import { SedeOrmEntity } from './core/headquarters/infrastructure/entity/sede-orm.entity';

@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Lee el .env de la raíz
    }),

    // Configuración dinámica de TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('ADMIN_DB_HOST'),
        port: configService.get<number>('ADMIN_DB_PORT'),
        username: configService.get('ADMIN_DB_USERNAME'),
        password: configService.get('ADMIN_DB_PASSWORD') || '',
        database: configService.get('ADMIN_DB_DATABASE'),
        entities: [UserOrmEntity, SedeOrmEntity],
        synchronize: false,
        logging: true,
      }),
      inject: [ConfigService],
    }),

    // Módulos del microservicio
    UserModule,
  ],
  controllers: [AdministrationController],
  providers: [AdministrationService],
})
export class AdministrationModule {}
