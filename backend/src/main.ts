import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { API_URL } from "./config";
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // 1. Creamos la aplicación UNA sola vez con el tipo Express
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 2. Habilitamos CORS para que el Frontend (puerto 3001) pueda comunicarse
  app.enableCors();
  
  // 3. Activamos el ValidationPipe para que los DTOs y los interruptores funcionen
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // 4. Servir la carpeta de 'uploads' públicamente
  // Se accede vía: http://localhost:3000/uploads/archivo.ext
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  
  // 5. Iniciamos el servidor en el puerto 3000
  await app.listen(3000);

  // Mensajes de confirmación en consola
  console.log(`🚀 Backend corriendo en: ${API_URL}`);
  console.log(`📂 Carpeta pública: ${API_URL}/uploads/`);
  console.log(`🛠️  Validaciones y CORS activos`);
}
bootstrap();