/* auth/src/auth.module.ts */
/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { BcryptHasherAdapter } from './core/infrastructure/adapters/out/bcrypt-hash-adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountUserOrmEntity, UserOrmEntity } from './core/infrastructure/entity/account-user-orm-entity';
import { JwtModule } from '@nestjs/jwt';
import { RoleOrmEntity } from './core/infrastructure/entity/role-orm-entity';
import { AuthService } from './core/application/service/auth-service';
import { AuthController } from './core/infrastructure/adapters/in/controllers/auth.controller';
import { AuthRepository } from './core/infrastructure/adapters/out/repository/auth-repository';
import { PermissionOrmEntity } from './core/infrastructure/entity/permission-orm-entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SedeTcpProxy } from './core/infrastructure/adapters/out/TCP/sede-tcp.proxy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ClientsModule.register([
      {
        name: 'SEDE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.SEDE_SERVICE_HOST || '127.0.0.1',
          port: Number(process.env.SEDE_SERVICE_PORT || 3011),
        },
      },
    ]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('AUTH_DB_HOST'),
        port: Number(configService.get<string>('AUTH_DB_PORT')),
        username: configService.get<string>('AUTH_DB_USERNAME'),
        password: configService.get<string>('AUTH_DB_PASSWORD') || '',
        database: configService.get<string>('AUTH_DB_DATABASE'),
        entities: [AccountUserOrmEntity, UserOrmEntity, RoleOrmEntity, PermissionOrmEntity],
        synchronize: false,
        logging: true,
      }),
    }),

    TypeOrmModule.forFeature([AccountUserOrmEntity]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'mkapu_secret_2025',
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,

    SedeTcpProxy,

    {
      provide: 'PasswordHasherPort',
      useClass: BcryptHasherAdapter,
    },
    {
      provide: 'AccountUserPortsOut',
      useClass: AuthRepository,
    },
  ],

  exports: [AuthService, JwtModule],
})
export class AuthModule {}