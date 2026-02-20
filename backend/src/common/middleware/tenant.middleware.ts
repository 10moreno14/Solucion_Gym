import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { db } from '../../db'; 
import { sql } from 'drizzle-orm';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: any, res: Response, next: NextFunction) {
    const tenantId = req.auth?.claims?.tenant_id; 
    if (tenantId) {
      await db.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`);
    }
    next();
  }
}