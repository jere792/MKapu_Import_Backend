/* auth/src/auth.module.ts */
/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { BcryptHasherAdapter } from './core/infrastructure/adapters/bcrypt-hash-adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountUserOrmEntity, UserOrmEntity } from './core/infrastructure/entity/account-user-orm-entity';
import { JwtModule } from '@nestjs/jwt';
import { AuthRepository } from './core/infrastructure/repository/auth-repository';
import { HeadQuartersOrmEntity } from './core/infrastructure/entity/headquarters-orm-entity';
import { RoleOrmEntity } from './core/infrastructure/entity/role-orm-entity';
import { AuthController } from './core/infrastructure/controllers/auth.controller';
import { AuthService } from './core/application/service/auth-service';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
  }),
  TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('AUTH_DB_HOST'),
        port: configService.get<number>('AUTH_DB_PORT') || 3306,
        username: configService.get<string>('AUTH_DB_USER'),
        password: configService.get<string>('AUTH_DB_PASSWORD') || '',
        database: configService.get<string>('AUTH_DB_NAME'),
        // Carga todas las entidades
        entities: [AccountUserOrmEntity, UserOrmEntity, RoleOrmEntity, HeadQuartersOrmEntity],
        synchronize: true,
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
    {
      provide: 'PasswordHasherPort',
      useClass: BcryptHasherAdapter,
    },
    {
      provide: 'AccountUserPortsOut',
      useClass: AuthRepository,
    }
  ],
  exports: [AuthService,JwtModule],
})
export class AuthModule {}
