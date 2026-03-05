export declare class AdminService {
    getAllGyms(): Promise<{
        id: string;
        nombre: string;
        isActive: boolean;
        plan: string;
        modulos: import("../db/schema").ModulosGym;
    }[]>;
    getOneConfig(tenantId: string, orgId?: string): Promise<{
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
    toggleModulo(tenantId: string, modulo: string, activo: boolean): Promise<{
        success: boolean;
    }>;
    toggleGymStatus(tenantId: string, isActive: boolean): Promise<{
        success: boolean;
        isActive: boolean;
    }>;
    private ensureTenant;
}
