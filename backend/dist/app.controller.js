"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const db_1 = require("./db");
const schema_1 = require("./db/schema");
const drizzle_orm_1 = require("drizzle-orm");
let AppController = class AppController {
    getWelcome() {
        return { status: 'success', message: 'API Solución Gym v1.0 🚀' };
    }
    async syncUser(body) {
        try {
            const { clerkId, email, fullName } = body;
            const existingUsers = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.clerkId, clerkId));
            if (existingUsers.length > 0) {
                return { status: 'success', message: '¡Bienvenido de vuelta!', tenantId: existingUsers[0].tenantId };
            }
            const newTenant = await db_1.db.insert(schema_1.tenants).values({ name: `Gimnasio de ${fullName}` }).returning();
            const tenantId = newTenant[0].id;
            await db_1.db.insert(schema_1.users).values({ clerkId, email, fullName, tenantId });
            return { status: 'success', message: 'Usuario creado', tenantId };
        }
        catch (error) {
            return { status: 'error', message: 'Error en sincronización' };
        }
    }
    uploadFiles(files) {
        return files.map(file => `http://localhost:3000/uploads/${file.filename}`);
    }
    async getClients(clerkId) {
        try {
            const userResult = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.clerkId, clerkId)).limit(1);
            const user = userResult[0];
            if (!user || !user.tenantId)
                return [];
            return await db_1.db.select()
                .from(schema_1.clients)
                .where((0, drizzle_orm_1.eq)(schema_1.clients.tenantId, user.tenantId))
                .orderBy((0, drizzle_orm_1.asc)(schema_1.clients.name));
        }
        catch (e) {
            return [];
        }
    }
    async searchClients(query) {
        try {
            if (!query)
                return [];
            return await db_1.db.select().from(schema_1.clients).where((0, drizzle_orm_1.ilike)(schema_1.clients.name, `%${query}%`)).limit(5);
        }
        catch (e) {
            return [];
        }
    }
    async saveClient(body) {
        try {
            const userResult = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.clerkId, body.clerkId)).limit(1);
            const user = userResult[0];
            if (!user || !user.tenantId)
                return { status: 'error', message: 'Usuario no válido' };
            const clientData = {
                name: body.name,
                nit: body.nit,
                address: body.address,
                phone: body.phone,
                email: body.email
            };
            if (body.id) {
                await db_1.db.update(schema_1.clients).set(clientData).where((0, drizzle_orm_1.eq)(schema_1.clients.id, body.id));
                return { status: 'success', message: 'Cliente actualizado' };
            }
            else {
                await db_1.db.insert(schema_1.clients).values({ ...clientData, tenantId: user.tenantId });
                return { status: 'success', message: 'Cliente creado' };
            }
        }
        catch (e) {
            return { status: 'error', message: 'Error al guardar' };
        }
    }
    async deleteClient(body) {
        try {
            await db_1.db.delete(schema_1.clients).where((0, drizzle_orm_1.eq)(schema_1.clients.id, body.id));
            return { status: 'success' };
        }
        catch (error) {
            return { status: 'error', message: 'No se puede eliminar porque tiene reportes asociados.' };
        }
    }
    async getAllMachines(clerkId) {
        try {
            const userResult = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.clerkId, clerkId)).limit(1);
            const user = userResult[0];
            if (!user || !user.tenantId)
                return [];
            return await db_1.db.query.machines.findMany({
                where: (0, drizzle_orm_1.eq)(schema_1.machines.tenantId, user.tenantId),
                with: { client: true },
                orderBy: [(0, drizzle_orm_1.asc)(schema_1.machines.name)]
            });
        }
        catch (e) {
            return [];
        }
    }
    async getMachines(clientId) {
        try {
            if (!clientId)
                return [];
            const result = await db_1.db.select().from(schema_1.machines).where((0, drizzle_orm_1.eq)(schema_1.machines.clientId, clientId));
            return Array.isArray(result) ? result : [];
        }
        catch (error) {
            console.error("Error get-machines:", error);
            return [];
        }
    }
    async saveMachine(body) {
        try {
            const userResult = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.clerkId, body.clerkId)).limit(1);
            const user = userResult[0];
            if (!user || !user.tenantId)
                return { status: 'error', message: 'Usuario no válido' };
            const machineData = {
                clientId: body.clientId,
                name: body.name,
                brand: body.brand,
                model: body.model,
                serial: body.serial,
                location: body.location,
                qrCode: body.qrCode
            };
            if (body.id) {
                await db_1.db.update(schema_1.machines).set(machineData).where((0, drizzle_orm_1.eq)(schema_1.machines.id, body.id));
                return { status: 'success', message: 'Equipo actualizado' };
            }
            else {
                await db_1.db.insert(schema_1.machines).values({ ...machineData, tenantId: user.tenantId });
                return { status: 'success', message: 'Equipo creado' };
            }
        }
        catch (e) {
            return { status: 'error', message: 'Error al guardar máquina' };
        }
    }
    async deleteMachine(body) {
        try {
            await db_1.db.delete(schema_1.machines).where((0, drizzle_orm_1.eq)(schema_1.machines.id, body.id));
            return { status: 'success' };
        }
        catch (error) {
            return { status: 'error', message: 'No se pudo eliminar el equipo.' };
        }
    }
    async getReports(clerkId, clientId, start, end) {
        try {
            const userResult = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.clerkId, clerkId)).limit(1);
            const user = userResult[0];
            if (!user || !user.tenantId)
                return [];
            const tenantId = user.tenantId;
            const reports = await db_1.db.query.maintenanceReports.findMany({
                where: (reports, { and, eq, gte, lte }) => {
                    const conditions = [eq(reports.tenantId, tenantId)];
                    if (clientId)
                        conditions.push(eq(reports.clientId, clientId));
                    if (start)
                        conditions.push(gte(reports.date, new Date(start)));
                    if (end) {
                        const dEnd = new Date(end);
                        dEnd.setHours(23, 59, 59);
                        conditions.push(lte(reports.date, dEnd));
                    }
                    return and(...conditions);
                },
                orderBy: [(0, drizzle_orm_1.desc)(schema_1.maintenanceReports.date)],
                with: { client: true, machine: true }
            });
            return Array.isArray(reports) ? reports : [];
        }
        catch (error) {
            return [];
        }
    }
    async saveReport(body) {
        try {
            const userResult = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.clerkId, body.clerkId)).limit(1);
            const user = userResult[0];
            if (!user || !user.tenantId)
                return { status: 'error', message: 'Usuario no válido' };
            const tenantId = user.tenantId;
            const lastReport = await db_1.db.select().from(schema_1.maintenanceReports)
                .where((0, drizzle_orm_1.eq)(schema_1.maintenanceReports.tenantId, tenantId))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.maintenanceReports.reportNumber)).limit(1);
            const nextNumber = (lastReport[0]?.reportNumber || 0) + 1;
            await db_1.db.insert(schema_1.maintenanceReports).values({
                tenantId,
                clientId: body.clientId,
                machineId: body.equipoId,
                reportNumber: nextNumber,
                type: body.tipo,
                technicianName: body.tecnicoNombre,
                technicianCc: body.tecnicoCc,
                activities: body.actividades,
                observations: body.observations,
                photosBefore: body.fotosAntes,
                photosAfter: body.fotosDespues,
                status: 'COMPLETED',
                date: new Date()
            });
            return { status: 'success', reportNumber: nextNumber };
        }
        catch (error) {
            return { status: 'error', message: 'Error en base de datos.' };
        }
    }
    async updateReport(body) {
        try {
            await db_1.db.update(schema_1.maintenanceReports)
                .set({
                machineId: body.equipoId,
                type: body.tipo,
                technicianName: body.tecnicoNombre,
                technicianCc: body.tecnicoCc,
                observations: body.observaciones,
                photosBefore: body.fotosAntes,
                photosAfter: body.fotosDespues,
            })
                .where((0, drizzle_orm_1.eq)(schema_1.maintenanceReports.id, body.id));
            return { status: 'success' };
        }
        catch (error) {
            return { status: 'error', message: 'No se pudo actualizar.' };
        }
    }
    async deleteReport(body) {
        try {
            await db_1.db.delete(schema_1.maintenanceReports).where((0, drizzle_orm_1.eq)(schema_1.maintenanceReports.id, body.id));
            return { status: 'success' };
        }
        catch (e) {
            return { status: 'error' };
        }
    }
    async getStats(clerkId) {
        try {
            const userResult = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.clerkId, clerkId)).limit(1);
            const user = userResult[0];
            if (!user || !user.tenantId) {
                return { stats: { reports: 0, clients: 0, machines: 0 }, latestReports: [] };
            }
            const tenantId = user.tenantId;
            const totalReports = await db_1.db.select().from(schema_1.maintenanceReports).where((0, drizzle_orm_1.eq)(schema_1.maintenanceReports.tenantId, tenantId));
            const totalClients = await db_1.db.select().from(schema_1.clients).where((0, drizzle_orm_1.eq)(schema_1.clients.tenantId, tenantId));
            const totalMachines = await db_1.db.select().from(schema_1.machines).where((0, drizzle_orm_1.eq)(schema_1.machines.tenantId, tenantId));
            const latestReports = await db_1.db.query.maintenanceReports.findMany({
                where: (0, drizzle_orm_1.eq)(schema_1.maintenanceReports.tenantId, tenantId),
                limit: 5,
                orderBy: [(0, drizzle_orm_1.desc)(schema_1.maintenanceReports.date)],
                with: { client: true }
            });
            return {
                stats: {
                    reports: totalReports.length,
                    clients: totalClients.length,
                    machines: totalMachines.length
                },
                latestReports: Array.isArray(latestReports) ? latestReports : []
            };
        }
        catch (error) {
            return { stats: { reports: 0, clients: 0, machines: 0 }, latestReports: [] };
        }
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getWelcome", null);
__decorate([
    (0, common_1.Post)('sync-user'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "syncUser", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10, {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            }
        })
    })),
    __param(0, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "uploadFiles", null);
__decorate([
    (0, common_1.Get)('get-clients'),
    __param(0, (0, common_1.Query)('clerkId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getClients", null);
__decorate([
    (0, common_1.Get)('search-clients'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "searchClients", null);
__decorate([
    (0, common_1.Post)('save-client'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "saveClient", null);
__decorate([
    (0, common_1.Post)('delete-client'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteClient", null);
__decorate([
    (0, common_1.Get)('get-all-machines'),
    __param(0, (0, common_1.Query)('clerkId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAllMachines", null);
__decorate([
    (0, common_1.Get)('get-machines'),
    __param(0, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getMachines", null);
__decorate([
    (0, common_1.Post)('save-machine'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "saveMachine", null);
__decorate([
    (0, common_1.Post)('delete-machine'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteMachine", null);
__decorate([
    (0, common_1.Get)('get-reports'),
    __param(0, (0, common_1.Query)('clerkId')),
    __param(1, (0, common_1.Query)('clientId')),
    __param(2, (0, common_1.Query)('start')),
    __param(3, (0, common_1.Query)('end')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getReports", null);
__decorate([
    (0, common_1.Post)('save-report'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "saveReport", null);
__decorate([
    (0, common_1.Post)('update-report'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateReport", null);
__decorate([
    (0, common_1.Post)('delete-report'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteReport", null);
__decorate([
    (0, common_1.Get)('get-stats'),
    __param(0, (0, common_1.Query)('clerkId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getStats", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)()
], AppController);
//# sourceMappingURL=app.controller.js.map