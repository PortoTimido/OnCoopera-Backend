import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ArtigoModule } from './api/artigo/artigo.module.js';
import { RadarApoioModule } from './api/radar-apoio/radar-apoio.module.js';
import { AuthModule } from './api/usuario-autenticacao/auth.module.js';
import { PrismaModule } from './infrastructure/database/prisma.module.js';
import { DiarioSintomasModule } from './api/diario-sintomas/diario-sintomas.module.js';
import { ArmazenamentoImagemModule } from './infrastructure/armazenamento-imagem/armazenamento-imagem.module.js';
import { validateEnvironment } from './app.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    ArmazenamentoImagemModule,
    AuthModule,
    ArtigoModule,
    RadarApoioModule,
    DiarioSintomasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
