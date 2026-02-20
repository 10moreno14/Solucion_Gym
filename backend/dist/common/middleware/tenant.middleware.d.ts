import { NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
export declare class TenantMiddleware implements NestMiddleware {
    use(req: any, res: Response, next: NextFunction): Promise<void>;
}
