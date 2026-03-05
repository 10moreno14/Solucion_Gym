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
const config_1 = require("./config");
let AppController = class AppController {
    async ensureTenant(clerkId, fullName, orgId, orgName) {
        try {
            if (!clerkId)
                return null;
            const mainIdentifier = orgId || clerkId;
            let gymName = 'Mi Gimnasio';
            if (orgName && orgName !== 'undefined' && orgName !== '') {
                gymName = orgName;
            }
            else if (fullName && fullName !== 'undefined' && fullName !== '') {
                gymName = `Gimnasio de ${fullName}`;
            }
            await db_1.db.insert(schema_1.tenants)
                .values({
                id: mainIdentifier,
                name: gymName,
                clerkOrgId: orgId || null,
            })
                .onConflictDoUpdate({
                target: schema_1.tenants.id,
                set: {
                    name: gymName,
                    clerkOrgId: orgId || null
                }
            });
            await db_1.db.insert(schema_1.gymConfigs)
                .values({
                tenantId: mainIdentifier,
                plan: 'Básico',
                modulos: {
                    dashboard: true,
                    planes: true,
                    afiliados: true,
                    accesos: true,
                    caja: true
                }
            })
                .onConflictDoNothing();
            return mainIdentifier;
        }
        catch (error) {
            console.error("Error al asegurar Tenant:", error);
            return null;
        }
    }
    getWelcome() {
        return { status: 'success', message: 'API Solución Gym v1.1 (Direct Clerk ID) 🚀' };
    }
    async syncUser(body) {
        try {
            const { clerkId, email, fullName } = body;
            if (!clerkId)
                return { status: 'error', message: 'Falta clerkId' };
            await db_1.db.insert(schema_1.tenants)
                .values({
                id: clerkId,
                name: `Gimnasio de ${fullName}`
            })
                .onConflictDoNothing();
            const userResult = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.clerkId, clerkId)).limit(1);
            const user = userResult[0];
            if (user) {
                return {
                    status: 'success',
                    message: '¡Bienvenido de vuelta!',
                    tenantId: clerkId
                };
            }
            await db_1.db.insert(schema_1.users).values({
                clerkId: clerkId,
                email: email,
                fullName: fullName,
                tenantId: clerkId,
                role: 'gimnasio'
            });
            await db_1.db.insert(schema_1.gymConfigs)
                .values({
                tenantId: clerkId,
                plan: 'Básico',
                modulos: { dashboard: true, planes: true, afiliados: true, accesos: false, caja: false }
            })
                .onConflictDoNothing();
            return {
                status: 'success',
                message: 'Usuario y gimnasio sincronizados',
                tenantId: clerkId
            };
        }
        catch (error) {
            console.error("Error en sync-user:", error);
            return { status: 'error', message: 'Error en sincronización' };
        }
    }
    uploadFiles(files) {
        return files.map(file => `${config_1.API_URL}/uploads/${file.filename}`);
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
            if (!clerkId)
                return { stats: { reports: 0, clients: 0, machines: 0 }, latestReports: [] };
            await this.ensureTenant(clerkId);
            const totalReports = await db_1.db.select().from(schema_1.maintenanceReports)
                .where((0, drizzle_orm_1.eq)(schema_1.maintenanceReports.tenantId, clerkId));
            const totalClients = await db_1.db.select().from(schema_1.clients)
                .where((0, drizzle_orm_1.eq)(schema_1.clients.tenantId, clerkId));
            const totalMachines = await db_1.db.select().from(schema_1.machines)
                .where((0, drizzle_orm_1.eq)(schema_1.machines.tenantId, clerkId));
            const latestReports = await db_1.db.query.maintenanceReports.findMany({
                where: (0, drizzle_orm_1.eq)(schema_1.maintenanceReports.tenantId, clerkId),
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
            console.error("Error en get-stats:", error);
            return { stats: { reports: 0, clients: 0, machines: 0 }, latestReports: [] };
        }
    }
    async getPlans(clerkId) {
        try {
            if (!clerkId)
                return [];
            return await db_1.db.select()
                .from(schema_1.plans)
                .where((0, drizzle_orm_1.eq)(schema_1.plans.tenantId, clerkId))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.plans.createdAt));
        }
        catch (e) {
            console.error("Error get-plans:", e);
            return [];
        }
    }
    async savePlan(body) {
        try {
            const { clerkId, id, name, price, durationDays, description, status } = body;
            if (!clerkId)
                return { status: 'error', message: 'Falta el clerkId' };
            await this.ensureTenant(clerkId);
            const planData = {
                name,
                price: String(price),
                durationDays: Number(durationDays),
                description,
                status: status || 'ACTIVE',
                tenantId: clerkId
            };
            if (id) {
                await db_1.db.update(schema_1.plans)
                    .set(planData)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.plans.id, id), (0, drizzle_orm_1.eq)(schema_1.plans.tenantId, clerkId)));
                return { status: 'success', message: 'Plan actualizado' };
            }
            else {
                await db_1.db.insert(schema_1.plans).values(planData);
                return { status: 'success', message: 'Plan creado' };
            }
        }
        catch (e) {
            console.error("Error save-plan:", e);
            return { status: 'error', message: 'Error al guardar el plan' };
        }
    }
    async togglePlan(body) {
        try {
            const { id, status, clerkId } = body;
            if (!id || !status || !clerkId) {
                return { status: 'error', message: 'Faltan datos' };
            }
            await db_1.db.update(schema_1.plans)
                .set({ status: String(status) })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.plans.id, id), (0, drizzle_orm_1.eq)(schema_1.plans.tenantId, clerkId)));
            return { status: 'success' };
        }
        catch (error) {
            console.error("Error toggle-plan:", error);
            return { status: 'error', message: 'Error al procesar el plan' };
        }
    }
    async deletePlan(body) {
        try {
            const { id, clerkId } = body;
            if (!id || !clerkId)
                return { status: 'error', message: 'Faltan datos' };
            await db_1.db.delete(schema_1.plans).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.plans.id, id), (0, drizzle_orm_1.eq)(schema_1.plans.tenantId, clerkId)));
            return { status: 'success', message: 'Plan eliminado correctamente' };
        }
        catch (error) {
            console.error("Error delete-plan:", error);
            return {
                status: 'error',
                message: 'No se puede eliminar: Este plan tiene historial de ventas asociado. Te sugerimos "Archivarlo".'
            };
        }
    }
    async getAffiliates(clerkId) {
        try {
            if (!clerkId)
                return [];
            const today = new Date();
            const affiliatesData = await db_1.db.query.affiliates.findMany({
                where: (0, drizzle_orm_1.eq)(schema_1.affiliates.tenantId, clerkId),
                orderBy: [(0, drizzle_orm_1.desc)(schema_1.affiliates.createdAt)],
                with: { memberships: true }
            });
            return affiliatesData.map(aff => {
                const activeMem = aff.memberships.find(m => m.status === 'ACTIVE' && new Date(m.endDate) >= today);
                return {
                    id: aff.id,
                    fullName: aff.fullName,
                    documentType: aff.documentType,
                    documentNumber: aff.documentNumber,
                    phone: aff.phone,
                    status: aff.status,
                    photoUrl: aff.photoUrl,
                    hasActivePlan: !!activeMem,
                    expirationDate: activeMem ? activeMem.endDate : null
                };
            });
        }
        catch (e) {
            console.error("Error get-affiliates:", e);
            return [];
        }
    }
    async saveAffiliate(body) {
        try {
            const { clerkId, id, fullName, documentType, documentNumber, phone, status, photoUrl } = body;
            if (!clerkId)
                return { status: 'error', message: 'Falta el clerkId' };
            await this.ensureTenant(clerkId);
            const affiliateData = {
                fullName,
                documentType: documentType || 'CC',
                documentNumber,
                phone,
                status: status || 'ACTIVE',
                photoUrl,
                tenantId: clerkId
            };
            if (id) {
                await db_1.db.update(schema_1.affiliates)
                    .set(affiliateData)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.affiliates.id, id), (0, drizzle_orm_1.eq)(schema_1.affiliates.tenantId, clerkId)));
                return { status: 'success', message: 'Afiliado actualizado' };
            }
            else {
                await db_1.db.insert(schema_1.affiliates).values(affiliateData);
                return { status: 'success', message: 'Afiliado registrado' };
            }
        }
        catch (e) {
            console.error("Error save-affiliate:", e);
            return { status: 'error', message: 'Error al guardar el afiliado' };
        }
    }
    async toggleAffiliate(body) {
        try {
            const { id, status, clerkId } = body;
            if (!id || !status || !clerkId)
                return { status: 'error', message: 'Faltan datos' };
            await db_1.db.update(schema_1.affiliates)
                .set({ status: String(status) })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.affiliates.id, id), (0, drizzle_orm_1.eq)(schema_1.affiliates.tenantId, clerkId)));
            return { status: 'success' };
        }
        catch (error) {
            console.error("Error toggle-affiliate:", error);
            return { status: 'error', message: 'Error al cambiar estado' };
        }
    }
    async deleteAffiliate(body) {
        try {
            const { id, clerkId } = body;
            if (!id || !clerkId)
                return { status: 'error', message: 'Faltan datos' };
            await db_1.db.delete(schema_1.affiliates).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.affiliates.id, id), (0, drizzle_orm_1.eq)(schema_1.affiliates.tenantId, clerkId)));
            return { status: 'success', message: 'Afiliado eliminado correctamente' };
        }
        catch (error) {
            console.error("Error delete-affiliate:", error);
            return {
                status: 'error',
                message: 'No se puede eliminar: El afiliado tiene registros asociados. Intenta inactivarlo.'
            };
        }
    }
    async getAffiliateStatus(clerkId, memberId) {
        try {
            if (!clerkId || !memberId)
                return { hasActivePlan: false, endDate: null };
            const today = new Date();
            const latestMembership = await db_1.db.select().from(schema_1.memberships)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.memberships.tenantId, clerkId), (0, drizzle_orm_1.eq)(schema_1.memberships.memberId, memberId), (0, drizzle_orm_1.eq)(schema_1.memberships.status, 'ACTIVE'), (0, drizzle_orm_1.gte)(schema_1.memberships.endDate, today)))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.memberships.endDate))
                .limit(1);
            if (latestMembership.length > 0) {
                return { hasActivePlan: true, endDate: latestMembership[0].endDate };
            }
            else {
                return { hasActivePlan: false, endDate: null };
            }
        }
        catch (error) {
            console.error("Error get-affiliate-status:", error);
            return { hasActivePlan: false, endDate: null };
        }
    }
    async saveMembership(body) {
        try {
            const { clerkId, memberId, planId, startDate, pricePaid } = body;
            if (!clerkId || !memberId || !planId)
                return { status: 'error', message: 'Faltan datos requeridos' };
            await this.ensureTenant(clerkId);
            const planResult = await db_1.db.select().from(schema_1.plans)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.plans.id, planId), (0, drizzle_orm_1.eq)(schema_1.plans.tenantId, clerkId))).limit(1);
            if (planResult.length === 0)
                return { status: 'error', message: 'Plan no encontrado o no pertenece a este gym' };
            const affiliateResult = await db_1.db.select().from(schema_1.affiliates)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.affiliates.id, memberId), (0, drizzle_orm_1.eq)(schema_1.affiliates.tenantId, clerkId))).limit(1);
            const affiliateName = affiliateResult.length > 0 ? affiliateResult[0].fullName : 'Cliente Desconocido';
            const planDuration = planResult[0].durationDays;
            const latestMembership = await db_1.db.select().from(schema_1.memberships)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.memberships.tenantId, clerkId), (0, drizzle_orm_1.eq)(schema_1.memberships.memberId, memberId), (0, drizzle_orm_1.eq)(schema_1.memberships.status, 'ACTIVE')))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.memberships.endDate))
                .limit(1);
            let start = new Date(startDate || new Date());
            if (latestMembership.length > 0) {
                const ultimaFechaFin = new Date(latestMembership[0].endDate);
                if (ultimaFechaFin > start) {
                    start = ultimaFechaFin;
                }
            }
            const end = new Date(start);
            end.setDate(end.getDate() + planDuration);
            await db_1.db.insert(schema_1.memberships).values({
                tenantId: clerkId,
                memberId,
                planId,
                startDate: start,
                endDate: end,
                pricePaid: String(pricePaid),
                status: 'ACTIVE'
            });
            await db_1.db.insert(schema_1.cashRegister).values({
                tenantId: clerkId,
                type: 'INCOME',
                category: `Membresía ${planResult[0].name} - ${affiliateName}`,
                amount: String(pricePaid),
                description: `Venta de membresía registrada desde panel`,
                date: new Date()
            });
            return { status: 'success', message: 'Venta procesada y dinero registrado en caja' };
        }
        catch (e) {
            console.error("Error save-membership:", e);
            return { status: 'error', message: 'Error al procesar la operación financiera' };
        }
    }
    async verifyAccess(body) {
        try {
            const { clerkId, documentNumber } = body;
            if (!clerkId || !documentNumber)
                return { status: 'error', message: 'Faltan datos' };
            await this.ensureTenant(clerkId);
            const affiliateResult = await db_1.db.select().from(schema_1.affiliates)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.affiliates.tenantId, clerkId), (0, drizzle_orm_1.eq)(schema_1.affiliates.documentNumber, documentNumber))).limit(1);
            const affiliate = affiliateResult[0];
            if (!affiliate) {
                return { status: 'error', message: 'Afiliado no encontrado. Verifica el documento.' };
            }
            if (affiliate.status !== 'ACTIVE') {
                await db_1.db.insert(schema_1.accesses).values({
                    tenantId: clerkId,
                    memberId: affiliate.id,
                    method: 'MANUAL',
                    status: 'DENIED',
                    accessTime: new Date()
                });
                return {
                    status: 'success',
                    access: 'DENIED',
                    affiliateName: affiliate.fullName,
                    message: 'ACCESO DENEGADO (Afiliado inactivo o suspendido)'
                };
            }
            const today = new Date();
            const activeMemberships = await db_1.db.select().from(schema_1.memberships)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.memberships.tenantId, clerkId), (0, drizzle_orm_1.eq)(schema_1.memberships.memberId, affiliate.id), (0, drizzle_orm_1.eq)(schema_1.memberships.status, 'ACTIVE'), (0, drizzle_orm_1.gte)(schema_1.memberships.endDate, today)));
            const hasAccess = activeMemberships.length > 0;
            const accessStatus = hasAccess ? 'ALLOWED' : 'DENIED';
            await db_1.db.insert(schema_1.accesses).values({
                tenantId: clerkId,
                memberId: affiliate.id,
                method: 'MANUAL',
                status: accessStatus,
                accessTime: new Date()
            });
            return {
                status: 'success',
                access: accessStatus,
                affiliateName: affiliate.fullName,
                message: hasAccess ? 'ACCESO PERMITIDO' : 'ACCESO DENEGADO (Membresía vencida o sin plan)'
            };
        }
        catch (e) {
            console.error("Error verify-access:", e);
            return { status: 'error', message: 'Error interno en el servidor' };
        }
    }
    async getRecentAccesses(clerkId) {
        try {
            if (!clerkId)
                return [];
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const recentAccesses = await db_1.db.query.accesses.findMany({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.accesses.tenantId, clerkId), (0, drizzle_orm_1.gte)(schema_1.accesses.accessTime, startOfToday)),
                orderBy: [(0, drizzle_orm_1.desc)(schema_1.accesses.accessTime)],
                with: { affiliate: true }
            });
            return Array.isArray(recentAccesses) ? recentAccesses : [];
        }
        catch (e) {
            console.error("Error get-recent-accesses:", e);
            return [];
        }
    }
    async getAllAccesses(clerkId, dateString) {
        try {
            if (!clerkId)
                return [];
            let conditions = [(0, drizzle_orm_1.eq)(schema_1.accesses.tenantId, clerkId)];
            if (dateString) {
                const [year, month, day] = dateString.split('-').map(Number);
                const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
                const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
                conditions.push((0, drizzle_orm_1.gte)(schema_1.accesses.accessTime, startOfDay));
                conditions.push((0, drizzle_orm_1.lte)(schema_1.accesses.accessTime, endOfDay));
            }
            const history = await db_1.db.query.accesses.findMany({
                where: (0, drizzle_orm_1.and)(...conditions),
                orderBy: [(0, drizzle_orm_1.desc)(schema_1.accesses.accessTime)],
                limit: 100,
                with: { affiliate: true }
            });
            return Array.isArray(history) ? history : [];
        }
        catch (e) {
            console.error("Error get-all-accesses:", e);
            return [];
        }
    }
    async getGymDashboard(clerkId, orgId, fullName, orgName) {
        try {
            if (!clerkId)
                return { status: 'error', message: 'Falta el clerkId' };
            const tenantId = orgId || clerkId;
            await this.ensureTenant(clerkId, fullName, orgId, orgName);
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            const nextWeek = new Date(now);
            nextWeek.setDate(now.getDate() + 7);
            const activeAffs = await db_1.db.select().from(schema_1.affiliates)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.affiliates.tenantId, tenantId), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.affiliates.status, 'ACTIVE'), (0, drizzle_orm_1.eq)(schema_1.affiliates.status, 'active'))));
            const incomes = await db_1.db.select().from(schema_1.cashRegister)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cashRegister.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.cashRegister.type, 'INCOME'), (0, drizzle_orm_1.gte)(schema_1.cashRegister.date, startOfMonth)));
            const totalIncome = incomes.reduce((acc, curr) => acc + Number(curr.amount), 0);
            const accessesToday = await db_1.db.select().from(schema_1.accesses)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.accesses.tenantId, tenantId), (0, drizzle_orm_1.gte)(schema_1.accesses.accessTime, startOfToday), (0, drizzle_orm_1.lte)(schema_1.accesses.accessTime, endOfToday)));
            const expiring = await db_1.db.query.memberships.findMany({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.memberships.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.memberships.status, 'ACTIVE'), (0, drizzle_orm_1.gte)(schema_1.memberships.endDate, startOfToday), (0, drizzle_orm_1.lte)(schema_1.memberships.endDate, nextWeek)),
                with: {
                    affiliate: true,
                    plan: true
                },
                orderBy: [(0, drizzle_orm_1.asc)(schema_1.memberships.endDate)]
            });
            return {
                status: 'success',
                stats: {
                    activeAffiliates: activeAffs.length,
                    monthlyIncome: totalIncome,
                    todayAccesses: accessesToday.length
                },
                expiringMemberships: Array.isArray(expiring) ? expiring : []
            };
        }
        catch (e) {
            console.error("❌ Error en Dashboard:", e);
            return {
                status: 'error',
                stats: { activeAffiliates: 0, monthlyIncome: 0, todayAccesses: 0 },
                expiringMemberships: []
            };
        }
    }
    async getModulesConfig(clerkId, orgId, fullName, orgName) {
        try {
            const tenantId = orgId || clerkId;
            await this.ensureTenant(clerkId, fullName, orgId, orgName);
            const config = await db_1.db.select().from(schema_1.gymConfigs)
                .where((0, drizzle_orm_1.eq)(schema_1.gymConfigs.tenantId, tenantId))
                .limit(1);
            if (config.length === 0) {
                return { status: 'error', message: 'No se encontró configuración' };
            }
            return {
                status: 'success',
                modulos: config[0].modulos,
                plan: config[0].plan
            };
        }
        catch (e) {
            console.error("❌ Error cargando módulos:", e);
            return { status: 'error', message: 'Error interno del servidor' };
        }
    }
    async getTransactions(clerkId) {
        try {
            if (!clerkId)
                return [];
            const transactions = await db_1.db.select()
                .from(schema_1.cashRegister)
                .where((0, drizzle_orm_1.eq)(schema_1.cashRegister.tenantId, clerkId))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.cashRegister.date));
            return transactions;
        }
        catch (e) {
            console.error("Error get-transactions:", e);
            return [];
        }
    }
    async saveTransaction(body) {
        try {
            const { clerkId, type, category, amount, description } = body;
            if (!clerkId || !type || !category || !amount) {
                return { status: 'error', message: 'Faltan datos requeridos' };
            }
            await this.ensureTenant(clerkId);
            await db_1.db.insert(schema_1.cashRegister).values({
                tenantId: clerkId,
                type,
                category,
                amount: String(amount),
                description,
                date: new Date()
            });
            return { status: 'success', message: 'Transacción registrada correctamente' };
        }
        catch (e) {
            console.error("Error save-transaction:", e);
            return { status: 'error', message: 'Error al registrar el movimiento en caja' };
        }
    }
    async deleteTransaction(body) {
        try {
            const { id, clerkId } = body;
            if (!id || !clerkId)
                return { status: 'error', message: 'Faltan datos' };
            await db_1.db.delete(schema_1.cashRegister).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cashRegister.id, id), (0, drizzle_orm_1.eq)(schema_1.cashRegister.tenantId, clerkId)));
            return { status: 'success', message: 'Transacción eliminada' };
        }
        catch (error) {
            console.error("Error delete-transaction:", error);
            return { status: 'error', message: 'No se pudo eliminar el registro de caja.' };
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
__decorate([
    (0, common_1.Get)('get-plans'),
    __param(0, (0, common_1.Query)('clerkId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Post)('save-plan'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "savePlan", null);
__decorate([
    (0, common_1.Post)('toggle-plan'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "togglePlan", null);
__decorate([
    (0, common_1.Post)('delete-plan'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deletePlan", null);
__decorate([
    (0, common_1.Get)('get-affiliates'),
    __param(0, (0, common_1.Query)('clerkId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAffiliates", null);
__decorate([
    (0, common_1.Post)('save-affiliate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "saveAffiliate", null);
__decorate([
    (0, common_1.Post)('toggle-affiliate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "toggleAffiliate", null);
__decorate([
    (0, common_1.Post)('delete-affiliate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteAffiliate", null);
__decorate([
    (0, common_1.Get)('get-affiliate-status'),
    __param(0, (0, common_1.Query)('clerkId')),
    __param(1, (0, common_1.Query)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAffiliateStatus", null);
__decorate([
    (0, common_1.Post)('save-membership'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "saveMembership", null);
__decorate([
    (0, common_1.Post)('verify-access'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "verifyAccess", null);
__decorate([
    (0, common_1.Get)('get-recent-accesses'),
    __param(0, (0, common_1.Query)('clerkId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getRecentAccesses", null);
__decorate([
    (0, common_1.Get)('get-all-accesses'),
    __param(0, (0, common_1.Query)('clerkId')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAllAccesses", null);
__decorate([
    (0, common_1.Get)('get-gym-dashboard'),
    __param(0, (0, common_1.Query)('clerkId')),
    __param(1, (0, common_1.Query)('orgId')),
    __param(2, (0, common_1.Query)('fullName')),
    __param(3, (0, common_1.Query)('orgName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getGymDashboard", null);
__decorate([
    (0, common_1.Get)('get-modules-config'),
    __param(0, (0, common_1.Query)('clerkId')),
    __param(1, (0, common_1.Query)('orgId')),
    __param(2, (0, common_1.Query)('fullName')),
    __param(3, (0, common_1.Query)('orgName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getModulesConfig", null);
__decorate([
    (0, common_1.Get)('get-transactions'),
    __param(0, (0, common_1.Query)('clerkId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Post)('save-transaction'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "saveTransaction", null);
__decorate([
    (0, common_1.Post)('delete-transaction'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "deleteTransaction", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)()
], AppController);
//# sourceMappingURL=app.controller.js.map