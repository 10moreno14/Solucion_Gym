import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { AppController } from './app.controller'; // <-- 1. Importa el archivo

@Module({
  imports: [],
  controllers: [AppController], // <-- 2. Ponlo aquí para que el servidor lo reconozca
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}