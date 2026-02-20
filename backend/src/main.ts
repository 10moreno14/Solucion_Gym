import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  // 1. Indicamos que es una aplicación Express explícitamente
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 2. Habilitamos CORS para que el Frontend (puerto 3001) pueda hablarle
  app.enableCors();
  
  // 3. Servir la carpeta de 'uploads' públicamente
  // Esto permite entrar a: http://localhost:3000/uploads/foto.jpg
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(3000);
  console.log(`🚀 Backend corriendo en: http://localhost:3000`);
  console.log(`📂 Carpeta pública: http://localhost:3000/uploads/`);
}
bootstrap();