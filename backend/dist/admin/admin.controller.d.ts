import { AdminService } from './admin.service';
import { UpdateModuleDto } from './dto/update-module.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getGyms(): Promise<{
        id: string;
        nombre: string;
        isActive: boolean;
        plan: string;
        modulos: import("../db/schema").ModulosGym;
    }[]>;
    updateModule(tenantId: string, updateData: UpdateModuleDto): Promise<{
        success: boolean;
    }>;
    getGymConfig(tenantId: string, orgId?: string, userId?: string): Promise<{
        isActive: boolean;
        modulos: {
            dashboard?: undefined;
            planes?: undefined;
            afiliados?: undefined;
            accesos?: undefined;
            caja?: undefined;
        };
    } | {
        isActive: boolean;
        modulos: {
            dashboard: boolean;
            planes: boolean;
            afiliados: boolean;
            accesos: boolean;
            caja: boolean;
        };
    }>;
    toggleGymStatus(id: string, isActive: boolean): Promise<{
        success: boolean;
        isActive: boolean;
    }>;
}
