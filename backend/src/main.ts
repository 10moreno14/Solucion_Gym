import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { API_URL } from "./config";
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs'; // Importamos File System de Node

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 1. CORS Robusto para producción y Clerk
  app.enableCors({
    origin: '*', // Permite cualquier frontend (luego lo restringiremos por seguridad)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // 2. Prevención de caída en Docker: Crear la carpeta 'uploads' si no existe
  const uploadDir = join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    console.log(`🔨 Creando directorio de uploads en: ${uploadDir}`);
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Servir la carpeta estática
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
  });
  
  await app.listen(3000);

  console.log(`🚀 Backend corriendo en el puerto 3000`);
  console.log(`📂 Carpeta pública lista`);
  console.log(`🛠️ Validaciones y CORS activos`);
}
bootstrap();