import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { AppController } from './app.controller';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    AdminModule,
  ],
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