import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { REFRESH_TOKEN_COOKIE } from './api/usuario-autenticacao/auth-cookie.service.js';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('OnCoopera API')
    .setDescription('Documentação oficial da API do OnCoopera')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth(REFRESH_TOKEN_COOKIE, undefined, 'refreshToken')
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
