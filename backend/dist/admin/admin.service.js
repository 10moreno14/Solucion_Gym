"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
let AdminService = class AdminService {
    async getAllGyms() {
        const allTenants = await db_1.db.query.tenants.findMany({
            with: {
                config: true,
            },
        });
        return allTenants.map((tenant) => ({
            id: tenant.id,
            nombre: tenant.name,
            isActive: tenant.isActive ?? true,
            plan: tenant.config?.plan || 'Sin Plan',
            modulos: tenant.config?.modulos || {
                dashboard: true,
                planes: false,
                afiliados: false,
                accesos: false,
                caja: false,
            },
        }));
    }
    async getOneConfig(tenantId, orgId) {
        try {
            await this.ensureTenant(tenantId, orgId);
            const tenant = await db_1.db.query.tenants.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_1.tenants.id, tenantId),
            });
            if (tenant && tenant.isActive === false) {
                return { isActive: false, modulos: {} };
            }
            const config = await db_1.db.query.gymConfigs.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_1.gymConfigs.tenantId, tenantId),
            });
            if (!config) {
                return {
                    isActive: true,
                    modulos: {
                        dashboard: true,
                        planes: false,
                        afiliados: false,
                        accesos: false,
                        caja: false,
                    },
                };
            }
            return {
                isActive: true,
                modulos: config.modulos
            };
        }
        catch (error) {
            console.error("Error al obtener config del gimnasio:", error);
            throw error;
        }
    }
    async toggleModulo(tenantId, modulo, activo) {
        try {
            await this.ensureTenant(tenantId);
            let config = await db_1.db.query.gymConfigs.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_1.gymConfigs.tenantId, tenantId),
            });
            if (!config) {
                const [newConfig] = await db_1.db.insert(schema_1.gymConfigs).values({
                    tenantId: tenantId,
                    plan: 'Básico',
                    modulos: {
                        dashboard: true,
                        planes: false,
                        afiliados: false,
                        accesos: false,
                        caja: false
                    }
                }).returning();
                config = newConfig;
            }
            const nuevosModulos = {
                ...config.modulos,
                [modulo]: activo,
            };
            await db_1.db
                .update(schema_1.gymConfigs)
                .set({
                modulos: nuevosModulos,
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.gymConfigs.tenantId, tenantId));
            return { success: true };
        }
        catch (error) {
            console.error("Error en AdminService al actualizar módulo:", error);
            throw error;
        }
    }
    async toggleGymStatus(tenantId, isActive) {
        try {
            await db_1.db.update(schema_1.tenants)
                .set({ isActive })
                .where((0, drizzle_orm_1.eq)(schema_1.tenants.id, tenantId));
            return { success: true, isActive };
        }
        catch (error) {
            console.error("Error al cambiar estado del gimnasio:", error);
            throw error;
        }
    }
    async ensureTenant(tenantId, orgId) {
        const actualOrgId = orgId && orgId !== 'undefined' && orgId !== '' ? orgId : null;
        await db_1.db.insert(schema_1.tenants)
            .values({
            id: tenantId,
            name: 'Gimnasio Nuevo',
            clerkOrgId: actualOrgId,
        })
            .onConflictDoUpdate({
            target: schema_1.tenants.id,
            set: {
                clerkOrgId: actualOrgId
            }
        });
        await db_1.db.insert(schema_1.gymConfigs)
            .values({
            tenantId: tenantId,
            plan: 'Básico',
            modulos: { dashboard: true, planes: true, afiliados: true, accesos: false, caja: false }
        })
            .onConflictDoNothing();
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)()
], AdminService);
//# sourceMappingURL=admin.service.js.map