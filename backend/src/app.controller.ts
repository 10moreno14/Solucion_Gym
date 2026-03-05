import { Controller, Get, Post, Body, UseInterceptors, UploadedFiles, Query } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { db } from './db';
import { users, gymConfigs, tenants, maintenanceReports, clients, machines, plans, affiliates, memberships, cashRegister, accesses } from './db/schema';
import { eq, desc, ilike, and, gte, lte, asc, or } from 'drizzle-orm';
import { API_URL } from "./config";


@Controller()
export class AppController {

  // 🛡️ PROVISIONADOR DE GIMNASIO
  // Este método asegura que el ID de Clerk esté registrado en nuestra tabla 'tenants'
  // 🛡️ PROVISIONADOR DE GIMNASIO (Con nombre personalizado)
private async ensureTenant(
  clerkId: string, 
  fullName?: string, 
  orgId?: string, 
  orgName?: string // 🌟 Nuevo parámetro
): Promise<string | null> {
  try {
    if (!clerkId) return null;

    // 🌟 Identificador principal: Prioridad a la Organización
    const mainIdentifier = orgId || clerkId; 
    
    // 🌟 LÓGICA DE NOMBRE:
    // 1. Si hay nombre de organización (orgName), usamos ese (ej: "gim2")
    // 2. Si no, usamos el nombre del usuario (fullName)
    // 3. Si nada existe, un genérico
    let gymName = 'Mi Gimnasio';
    
    if (orgName && orgName !== 'undefined' && orgName !== '') {
      gymName = orgName; 
    } else if (fullName && fullName !== 'undefined' && fullName !== '') {
      gymName = `Gimnasio de ${fullName}`;
    }

    // 1. Insertamos o actualizamos el Tenant
    await db.insert(tenants)
      .values({
        id: mainIdentifier,
        name: gymName,
        clerkOrgId: orgId || null,
      })
      .onConflictDoUpdate({
        target: tenants.id,
        set: { 
          name: gymName, // 👈 Esto actualizará "Mi Gimnasio" por el nombre real de Clerk
          clerkOrgId: orgId || null
        }
      });

    // 2. Aseguramos la configuración inicial
    await db.insert(gymConfigs)
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
  } catch (error) {
    console.error("Error al asegurar Tenant:", error);
    return null;
  }
}

  @Get()
  getWelcome() {
    return { status: 'success', message: 'API Solución Gym v1.1 (Direct Clerk ID) 🚀' };
  }

// ==========================================
  // 1. USUARIOS (Sincronización Clerk) 🔄
  // ==========================================
  @Post('sync-user')
  async syncUser(@Body() body: { clerkId: string; email: string; fullName: string }) {
    try {
      const { clerkId, email, fullName } = body;

      if (!clerkId) return { status: 'error', message: 'Falta clerkId' };

      // 1. Aseguramos que el gimnasio (Tenant) exista.
      // Usamos el clerkId del usuario/org como el ID de la tabla tenants.
      await db.insert(tenants)
        .values({ 
          id: clerkId, // 👈 IMPORTANTE: Aquí pasamos el ID para evitar el error anterior
          name: `Gimnasio de ${fullName}` 
        })
        .onConflictDoNothing();

      // 2. Verificamos si el usuario ya existe en nuestra tabla local
      const userResult = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
      const user = userResult[0];

      if (user) {
        return { 
          status: 'success', 
          message: '¡Bienvenido de vuelta!', 
          tenantId: clerkId // Ahora el tenantId es el mismo string de Clerk
        };
      }

      // 3. Si es un usuario nuevo, lo creamos vinculado al clerkId (que es su tenant)
      await db.insert(users).values({
        clerkId: clerkId,
        email: email,
        fullName: fullName,
        tenantId: clerkId, // 👈 Relación directa texto a texto
        role: 'gimnasio'   // Le asignamos el rol de gimnasio por defecto
      });

      // 4. Aseguramos configuración inicial de módulos
      await db.insert(gymConfigs)
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
    } catch (error) {
      console.error("Error en sync-user:", error);
      return { status: 'error', message: 'Error en sincronización' };
    }
  }

  // ==========================================
  // 2. SUBIDA DE IMÁGENES
  // ==========================================
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: diskStorage({
      destination: './uploads', 
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  uploadFiles(@UploadedFiles() files: Array<any>) {
    return files.map(file => `${API_URL}/uploads/${file.filename}`);
  }

  // ==========================================
  // 3. MÓDULO DE CLIENTES 👥
  // ==========================================

  @Get('get-clients')
  async getClients(@Query('clerkId') clerkId: string) {
    try {
      const userResult = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
      const user = userResult[0];
      if (!user || !user.tenantId) return [];

      return await db.select()
        .from(clients)
        .where(eq(clients.tenantId, user.tenantId))
        .orderBy(asc(clients.name));
    } catch (e) { return []; }
  }

  @Get('search-clients')
  async searchClients(@Query('q') query: string) {
     try {
       if (!query) return [];
       return await db.select().from(clients).where(ilike(clients.name, `%${query}%`)).limit(5);
     } catch (e) { return []; }
  }

  @Post('save-client')
  async saveClient(@Body() body: any) {
    try {
      const userResult = await db.select().from(users).where(eq(users.clerkId, body.clerkId)).limit(1);
      const user = userResult[0];
      if (!user || !user.tenantId) return { status: 'error', message: 'Usuario no válido' };

      const clientData = {
        name: body.name,
        nit: body.nit,
        address: body.address,
        phone: body.phone,
        email: body.email
      };

      if (body.id) {
        await db.update(clients).set(clientData).where(eq(clients.id, body.id));
        return { status: 'success', message: 'Cliente actualizado' };
      } else {
        await db.insert(clients).values({ ...clientData, tenantId: user.tenantId });
        return { status: 'success', message: 'Cliente creado' };
      }
    } catch (e) { return { status: 'error', message: 'Error al guardar' }; }
  }

  @Post('delete-client')
  async deleteClient(@Body() body: { id: string }) {
    try {
      await db.delete(clients).where(eq(clients.id, body.id));
      return { status: 'success' };
    } catch (error) {
      return { status: 'error', message: 'No se puede eliminar porque tiene reportes asociados.' };
    }
  }

  // ==========================================
  // 4. MÓDULO DE EQUIPOS / MÁQUINAS ⚙️
  // ==========================================

  @Get('get-all-machines')
  async getAllMachines(@Query('clerkId') clerkId: string) {
    try {
      const userResult = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
      const user = userResult[0];
      if (!user || !user.tenantId) return [];

      return await db.query.machines.findMany({
        where: eq(machines.tenantId, user.tenantId),
        with: { client: true },
        orderBy: [asc(machines.name)]
      });
    } catch (e) { return []; }
  }

  @Get('get-machines')
  async getMachines(@Query('clientId') clientId: string) {
     try {
       if (!clientId) return [];
       const result = await db.select().from(machines).where(eq(machines.clientId, clientId));
       return Array.isArray(result) ? result : []; // 🛡️ Forzamos que sea un array
     } catch (error) {
       console.error("Error get-machines:", error);
       return []; // 🛡️ Si falla la DB, devolvemos array vacío para evitar crash .map
     }
  }

  @Post('save-machine')
  async saveMachine(@Body() body: any) {
    try {
      const userResult = await db.select().from(users).where(eq(users.clerkId, body.clerkId)).limit(1);
      const user = userResult[0];
      if (!user || !user.tenantId) return { status: 'error', message: 'Usuario no válido' };

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
        await db.update(machines).set(machineData).where(eq(machines.id, body.id));
        return { status: 'success', message: 'Equipo actualizado' };
      } else {
        await db.insert(machines).values({ ...machineData, tenantId: user.tenantId });
        return { status: 'success', message: 'Equipo creado' };
      }
    } catch (e) { return { status: 'error', message: 'Error al guardar máquina' }; }
  }

  @Post('delete-machine')
  async deleteMachine(@Body() body: { id: string }) {
    try {
      await db.delete(machines).where(eq(machines.id, body.id));
      return { status: 'success' };
    } catch (error) {
      return { status: 'error', message: 'No se pudo eliminar el equipo.' };
    }
  }

  // ==========================================
  // 5. MÓDULO DE REPORTES 📋
  // ==========================================

  @Get('get-reports')
  async getReports(
    @Query('clerkId') clerkId: string,
    @Query('clientId') clientId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string
  ) {
     try {
       const userResult = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
       const user = userResult[0];
       if (!user || !user.tenantId) return [];
       const tenantId = user.tenantId;

       const reports = await db.query.maintenanceReports.findMany({
            where: (reports, { and, eq, gte, lte }) => {
                const conditions = [eq(reports.tenantId, tenantId)];
                if (clientId) conditions.push(eq(reports.clientId, clientId));
                if (start) conditions.push(gte(reports.date, new Date(start)));
                if (end) {
                    const dEnd = new Date(end);
                    dEnd.setHours(23, 59, 59);
                    conditions.push(lte(reports.date, dEnd));
                }
                return and(...conditions);
            },
            orderBy: [desc(maintenanceReports.date)],
            with: { client: true, machine: true }
        });
        return Array.isArray(reports) ? reports : [];
     } catch (error) { return []; }
  }

  @Post('save-report')
  async saveReport(@Body() body: any) {
    try {
      const userResult = await db.select().from(users).where(eq(users.clerkId, body.clerkId)).limit(1);
      const user = userResult[0];
      if (!user || !user.tenantId) return { status: 'error', message: 'Usuario no válido' };
      
      const tenantId = user.tenantId;
      const lastReport = await db.select().from(maintenanceReports)
          .where(eq(maintenanceReports.tenantId, tenantId))
          .orderBy(desc(maintenanceReports.reportNumber)).limit(1);
      
      const nextNumber = (lastReport[0]?.reportNumber || 0) + 1;

      await db.insert(maintenanceReports).values({
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
    } catch (error) { return { status: 'error', message: 'Error en base de datos.' }; }
  }

  @Post('update-report')
  async updateReport(@Body() body: any) {
    try {
        await db.update(maintenanceReports)
            .set({
                machineId: body.equipoId,
                type: body.tipo,
                technicianName: body.tecnicoNombre,
                technicianCc: body.tecnicoCc,
                observations: body.observaciones,
                photosBefore: body.fotosAntes,
                photosAfter: body.fotosDespues,
            })
            .where(eq(maintenanceReports.id, body.id));
        return { status: 'success' };
    } catch (error) { return { status: 'error', message: 'No se pudo actualizar.' }; }
  }

  @Post('delete-report')
  async deleteReport(@Body() body: { id: string }) {
    try {
      await db.delete(maintenanceReports).where(eq(maintenanceReports.id, body.id));
      return { status: 'success' };
    } catch (e) { return { status: 'error' }; }
  }

// ==========================================
  // 6. ESTADÍSTICAS 📊 (Versión Directa Clerk ID)
  // ==========================================
  @Get('get-stats')
  async getStats(@Query('clerkId') clerkId: string) {
    try {
      if (!clerkId) return { stats: { reports: 0, clients: 0, machines: 0 }, latestReports: [] };

      // 🛡️ Aseguramos que el gimnasio exista (opcional en GET, pero bueno para consistencia)
      await this.ensureTenant(clerkId);

      // Consultamos las métricas usando directamente el clerkId como tenantId
      const totalReports = await db.select().from(maintenanceReports)
        .where(eq(maintenanceReports.tenantId, clerkId));
        
      const totalClients = await db.select().from(clients)
        .where(eq(clients.tenantId, clerkId));
        
      const totalMachines = await db.select().from(machines)
        .where(eq(machines.tenantId, clerkId));

      const latestReports = await db.query.maintenanceReports.findMany({
        where: eq(maintenanceReports.tenantId, clerkId),
        limit: 5,
        orderBy: [desc(maintenanceReports.date)],
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
    } catch (error) {
      console.error("Error en get-stats:", error);
      return { stats: { reports: 0, clients: 0, machines: 0 }, latestReports: [] };
    }
  }

// ==========================================
  // 7. MÓDULO GYM: PLANES DE MEMBRESÍA 🏋️‍♂️ (Versión Directa Clerk ID)
  // ==========================================

  @Get('get-plans')
  async getPlans(@Query('clerkId') clerkId: string) {
    try {
      if (!clerkId) return [];
      
      // 🛡️ No necesitamos traducir, solo filtrar directamente
      return await db.select()
        .from(plans)
        .where(eq(plans.tenantId, clerkId))
        .orderBy(desc(plans.createdAt));
    } catch (e) {
      console.error("Error get-plans:", e);
      return []; 
    }
  }

  @Post('save-plan')
  async savePlan(@Body() body: any) {
    try {
      const { clerkId, id, name, price, durationDays, description, status } = body;
      
      if (!clerkId) return { status: 'error', message: 'Falta el clerkId' };

      // 🛡️ Aseguramos que el gimnasio exista en la tabla tenants
      await this.ensureTenant(clerkId);

      const planData = {
        name,
        price: String(price),
        durationDays: Number(durationDays),
        description,
        status: status || 'ACTIVE',
        tenantId: clerkId // 👈 Guardamos el ID de Clerk (texto) directamente
      };

      if (id) {
        // Actualizamos validando que pertenezca al tenant (clerkId)
        await db.update(plans)
          .set(planData)
          .where(and(eq(plans.id, id), eq(plans.tenantId, clerkId)));
        
        return { status: 'success', message: 'Plan actualizado' };
      } else {
        // Creamos nuevo usando el clerkId
        await db.insert(plans).values(planData);
        return { status: 'success', message: 'Plan creado' };
      }
    } catch (e) { 
      console.error("Error save-plan:", e);
      return { status: 'error', message: 'Error al guardar el plan' }; 
    }
  }

  @Post('toggle-plan')
  async togglePlan(@Body() body: { id: string, status: string, clerkId: string }) {
    try {
      const { id, status, clerkId } = body;

      if (!id || !status || !clerkId) {
        return { status: 'error', message: 'Faltan datos' };
      }

      // 🛡️ Solo actualizamos si el plan pertenece a este clerkId
      await db.update(plans)
        .set({ status: String(status) })
        .where(and(eq(plans.id, id), eq(plans.tenantId, clerkId)));

      return { status: 'success' };
    } catch (error) {
      console.error("Error toggle-plan:", error);
      return { status: 'error', message: 'Error al procesar el plan' };
    }
  }

  @Post('delete-plan')
  async deletePlan(@Body() body: { id: string, clerkId: string }) {
    try {
      const { id, clerkId } = body;
      if (!id || !clerkId) return { status: 'error', message: 'Faltan datos' };

      // 🛡️ Intentamos eliminar asegurando la propiedad del tenant (clerkId)
      await db.delete(plans).where(
        and(
          eq(plans.id, id),
          eq(plans.tenantId, clerkId)
        )
      );
      
      return { status: 'success', message: 'Plan eliminado correctamente' };
    } catch (error) {
      console.error("Error delete-plan:", error);
      return { 
        status: 'error', 
        message: 'No se puede eliminar: Este plan tiene historial de ventas asociado. Te sugerimos "Archivarlo".' 
      };
    }
  }

// ==========================================
  // 8. MÓDULO GYM: AFILIADOS 👥 (Versión Directa Clerk ID)
  // ==========================================

  @Get('get-affiliates')
  async getAffiliates(@Query('clerkId') clerkId: string) {
    try {
      if (!clerkId) return [];
      
      const today = new Date();

      // Consultamos directamente usando el ID de Clerk como tenantId
      const affiliatesData = await db.query.affiliates.findMany({
        where: eq(affiliates.tenantId, clerkId), 
        orderBy: [desc(affiliates.createdAt)],
        with: { memberships: true }
      });

      return affiliatesData.map(aff => {
        // Buscamos la membresía activa más reciente
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
    } catch (e) {
      console.error("Error get-affiliates:", e);
      return []; 
    }
  }

  @Post('save-affiliate')
  async saveAffiliate(@Body() body: any) {
    try {
      const { clerkId, id, fullName, documentType, documentNumber, phone, status, photoUrl } = body; 
      
      if (!clerkId) return { status: 'error', message: 'Falta el clerkId' };

      // 🛡️ Aseguramos que el gimnasio exista en la tabla tenants
      await this.ensureTenant(clerkId);

      const affiliateData = {
        fullName,
        documentType: documentType || 'CC',
        documentNumber,
        phone,
        status: status || 'ACTIVE',
        photoUrl,
        tenantId: clerkId // 👈 Guardamos el ID de Clerk (texto) directamente
      };

      if (id) {
        // Actualizar (Validamos propiedad por seguridad)
        await db.update(affiliates)
          .set(affiliateData)
          .where(and(eq(affiliates.id, id), eq(affiliates.tenantId, clerkId)));
        
        return { status: 'success', message: 'Afiliado actualizado' };
      } else {
        // Crear nuevo
        await db.insert(affiliates).values(affiliateData);
        return { status: 'success', message: 'Afiliado registrado' };
      }
    } catch (e) { 
      console.error("Error save-affiliate:", e);
      return { status: 'error', message: 'Error al guardar el afiliado' }; 
    }
  }

  @Post('toggle-affiliate')
  async toggleAffiliate(@Body() body: { id: string, status: string, clerkId: string }) {
    try {
      const { id, status, clerkId } = body;
      if (!id || !status || !clerkId) return { status: 'error', message: 'Faltan datos' };

      // Actualizamos asegurando que el afiliado pertenezca a este clerkId
      await db.update(affiliates)
        .set({ status: String(status) })
        .where(and(eq(affiliates.id, id), eq(affiliates.tenantId, clerkId)));

      return { status: 'success' };
    } catch (error) {
      console.error("Error toggle-affiliate:", error);
      return { status: 'error', message: 'Error al cambiar estado' };
    }
  }

  @Post('delete-affiliate')
  async deleteAffiliate(@Body() body: { id: string, clerkId: string }) {
    try {
      const { id, clerkId } = body;
      if (!id || !clerkId) return { status: 'error', message: 'Faltan datos' };

      // Borrado seguro: solo si pertenece al gimnasio (clerkId)
      await db.delete(affiliates).where(
        and(
          eq(affiliates.id, id),
          eq(affiliates.tenantId, clerkId)
        )
      );
      
      return { status: 'success', message: 'Afiliado eliminado correctamente' };
    } catch (error) {
      console.error("Error delete-affiliate:", error);
      return { 
        status: 'error', 
        message: 'No se puede eliminar: El afiliado tiene registros asociados. Intenta inactivarlo.' 
      };
    }
  }

// ==========================================
  // 9. MÓDULO GYM: MEMBRESÍAS Y CAJA 💰 (Versión Directa Clerk ID)
  // ==========================================
  
  @Get('get-affiliate-status')
  async getAffiliateStatus(@Query('clerkId') clerkId: string, @Query('memberId') memberId: string) {
    try {
      if (!clerkId || !memberId) return { hasActivePlan: false, endDate: null };

      const today = new Date();
      
      // Buscamos la membresía activa usando directamente el clerkId como tenantId
      const latestMembership = await db.select().from(memberships)
        .where(
          and(
            eq(memberships.tenantId, clerkId), // 👈 Filtro directo por texto
            eq(memberships.memberId, memberId),
            eq(memberships.status, 'ACTIVE'),
            gte(memberships.endDate, today)
          )
        )
        .orderBy(desc(memberships.endDate))
        .limit(1);

      if (latestMembership.length > 0) {
        return { hasActivePlan: true, endDate: latestMembership[0].endDate };
      } else {
        return { hasActivePlan: false, endDate: null };
      }
    } catch (error) {
      console.error("Error get-affiliate-status:", error);
      return { hasActivePlan: false, endDate: null };
    }
  }

  @Post('save-membership')
  async saveMembership(@Body() body: any) {
    try {
      const { clerkId, memberId, planId, startDate, pricePaid } = body;
      
      if (!clerkId || !memberId || !planId) return { status: 'error', message: 'Faltan datos requeridos' };

      // 🛡️ Aseguramos que el gimnasio esté registrado
      await this.ensureTenant(clerkId);

      // 1. Validar que el Plan pertenezca a este gimnasio (usando clerkId)
      const planResult = await db.select().from(plans)
        .where(and(eq(plans.id, planId), eq(plans.tenantId, clerkId))).limit(1);
      
      if (planResult.length === 0) return { status: 'error', message: 'Plan no encontrado o no pertenece a este gym' };
      
      // 2. Validar que el Afiliado pertenezca a este gimnasio
      const affiliateResult = await db.select().from(affiliates)
        .where(and(eq(affiliates.id, memberId), eq(affiliates.tenantId, clerkId))).limit(1);
      
      const affiliateName = affiliateResult.length > 0 ? affiliateResult[0].fullName : 'Cliente Desconocido';
      const planDuration = planResult[0].durationDays;

      // 🛑 LÓGICA DE FECHAS: Evitar solapamientos
      const latestMembership = await db.select().from(memberships)
        .where(
          and(
            eq(memberships.tenantId, clerkId),
            eq(memberships.memberId, memberId),
            eq(memberships.status, 'ACTIVE')
          )
        )
        .orderBy(desc(memberships.endDate))
        .limit(1);

      let start = new Date(startDate || new Date());
      
      if (latestMembership.length > 0) {
        const ultimaFechaFin = new Date(latestMembership[0].endDate);
        if (ultimaFechaFin > start) {
          start = ultimaFechaFin; // Empieza justo cuando acabe la actual
        }
      }

      const end = new Date(start);
      end.setDate(end.getDate() + planDuration);

      // 3. Insertar la Membresía usando clerkId como tenantId
      await db.insert(memberships).values({
        tenantId: clerkId, 
        memberId,
        planId,
        startDate: start,
        endDate: end,
        pricePaid: String(pricePaid),
        status: 'ACTIVE'
      });

      // 4. Registro automático en CAJA (Ingreso)
      await db.insert(cashRegister).values({
        tenantId: clerkId, 
        type: 'INCOME',
        category: `Membresía ${planResult[0].name} - ${affiliateName}`,
        amount: String(pricePaid),
        description: `Venta de membresía registrada desde panel`, 
        date: new Date()
      });

      return { status: 'success', message: 'Venta procesada y dinero registrado en caja' };
    } catch (e) { 
      console.error("Error save-membership:", e);
      return { status: 'error', message: 'Error al procesar la operación financiera' }; 
    }
  }

// ==========================================
  // 10. MÓDULO GYM: CONTROL DE ACCESOS 🚪 (Versión Directa Clerk ID)
  // ==========================================

  @Post('verify-access')
  async verifyAccess(@Body() body: { clerkId: string, documentNumber: string }) {
    try {
      const { clerkId, documentNumber } = body;
      if (!clerkId || !documentNumber) return { status: 'error', message: 'Faltan datos' };

      // 🛡️ Aseguramos que el gimnasio exista
      await this.ensureTenant(clerkId);

      // 1. Buscar al afiliado por su documento dentro de este gimnasio (clerkId)
      const affiliateResult = await db.select().from(affiliates)
        .where(
          and(
            eq(affiliates.tenantId, clerkId), // 👈 Comparación directa de texto
            eq(affiliates.documentNumber, documentNumber)
          )
        ).limit(1);

      const affiliate = affiliateResult[0];

      if (!affiliate) {
        return { status: 'error', message: 'Afiliado no encontrado. Verifica el documento.' };
      }

      // 🛑 VALIDACIÓN: Perfil inactivo o suspendido
      if (affiliate.status !== 'ACTIVE') {
        await db.insert(accesses).values({
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

      // 2. Verificar si tiene membresía vigente
      const today = new Date();
      const activeMemberships = await db.select().from(memberships)
        .where(
          and(
            eq(memberships.tenantId, clerkId),
            eq(memberships.memberId, affiliate.id),
            eq(memberships.status, 'ACTIVE'),
            gte(memberships.endDate, today)
          )
        );

      const hasAccess = activeMemberships.length > 0;
      const accessStatus = hasAccess ? 'ALLOWED' : 'DENIED';

      // 3. Registrar el intento de acceso usando el clerkId
      await db.insert(accesses).values({
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

    } catch (e) {
      console.error("Error verify-access:", e);
      return { status: 'error', message: 'Error interno en el servidor' };
    }
  }

  // 1. Obtener accesos de HOY
  @Get('get-recent-accesses')
  async getRecentAccesses(@Query('clerkId') clerkId: string) {
    try {
      if (!clerkId) return [];

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const recentAccesses = await db.query.accesses.findMany({
        where: and(
          eq(accesses.tenantId, clerkId), // 👈 Filtro directo
          gte(accesses.accessTime, startOfToday)
        ),
        orderBy: [desc(accesses.accessTime)],
        with: { affiliate: true }
      });

      return Array.isArray(recentAccesses) ? recentAccesses : [];
    } catch (e) {
      console.error("Error get-recent-accesses:", e);
      return [];
    }
  }

  // 2. Obtener historial con filtro de fecha
  @Get('get-all-accesses')
  async getAllAccesses(@Query('clerkId') clerkId: string, @Query('date') dateString?: string) {
    try {
      if (!clerkId) return [];

      let conditions = [eq(accesses.tenantId, clerkId)];

      if (dateString) {
        const [year, month, day] = dateString.split('-').map(Number);
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
        
        conditions.push(gte(accesses.accessTime, startOfDay));
        conditions.push(lte(accesses.accessTime, endOfDay));
      }

      const history = await db.query.accesses.findMany({
        where: and(...conditions),
        orderBy: [desc(accesses.accessTime)],
        limit: 100,
        with: { affiliate: true }
      });

      return Array.isArray(history) ? history : [];
    } catch (e) {
      console.error("Error get-all-accesses:", e);
      return [];
    }
  }

// ==========================================
  // 11. MÓDULO GYM: DASHBOARD PRINCIPAL 📊 (Versión Directa Clerk ID)
  // ==========================================

  @Get('get-gym-dashboard')
async getGymDashboard(
  @Query('clerkId') clerkId: string,
  @Query('orgId') orgId?: string,      // 🌟 Recibimos el ID de la organización
  @Query('fullName') fullName?: string, // 🌟 Recibimos el nombre del usuario
  @Query('orgName') orgName?: string    // 🌟 Recibimos el nombre real de Clerk
) {
  try {
    if (!clerkId) return { status: 'error', message: 'Falta el clerkId' };

    // 1. DETERMINAMOS EL TENANT ID (La llave compartida)
    const tenantId = orgId || clerkId;

    // 2. ASEGURAMOS EL TENANT (Sincroniza el nombre real de Clerk)
    await this.ensureTenant(clerkId, fullName, orgId, orgName);

    // Definimos los rangos de tiempo
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    // --- CONSULTAS UNIFICADAS POR TENANT ID ---

    // 1. Afiliados Activos
    const activeAffs = await db.select().from(affiliates)
      .where(and(
        eq(affiliates.tenantId, tenantId), // 👈 Usamos tenantId compartido
        or(
          eq(affiliates.status, 'ACTIVE'),
          eq(affiliates.status, 'active')
        )
      ));

    // 2. Ingresos del mes
    const incomes = await db.select().from(cashRegister)
      .where(and(
        eq(cashRegister.tenantId, tenantId), // 👈 Usamos tenantId compartido
        eq(cashRegister.type, 'INCOME'),
        gte(cashRegister.date, startOfMonth)
      ));
    
    const totalIncome = incomes.reduce((acc, curr) => acc + Number(curr.amount), 0);

    // 3. Accesos de HOY
    const accessesToday = await db.select().from(accesses)
      .where(and(
        eq(accesses.tenantId, tenantId), // 👈 Usamos tenantId compartido
        gte(accesses.accessTime, startOfToday),
        lte(accesses.accessTime, endOfToday)
      ));

    // 4. Membresías por vencer (Próximos 7 días)
    const expiring = await db.query.memberships.findMany({
      where: and(
        eq(memberships.tenantId, tenantId), // 👈 Usamos tenantId compartido
        eq(memberships.status, 'ACTIVE'),
        gte(memberships.endDate, startOfToday),
        lte(memberships.endDate, nextWeek)
      ),
      with: {
        affiliate: true,
        plan: true
      },
      orderBy: [asc(memberships.endDate)]
    });

    // 🚀 RETORNO LIMPIO (Sin console.logs)
    return {
      status: 'success',
      stats: {
        activeAffiliates: activeAffs.length,
        monthlyIncome: totalIncome,
        todayAccesses: accessesToday.length
      },
      expiringMemberships: Array.isArray(expiring) ? expiring : []
    };

  } catch (e) {
    console.error("❌ Error en Dashboard:", e);
    return { 
      status: 'error', 
      stats: { activeAffiliates: 0, monthlyIncome: 0, todayAccesses: 0 },
      expiringMemberships: [] 
    };
  }
}

@Get('get-modules-config')
async getModulesConfig(
  @Query('clerkId') clerkId: string,
  @Query('orgId') orgId?: string,      // 🌟 Añadir
  @Query('fullName') fullName?: string, // 🌟 Añadir
  @Query('orgName') orgName?: string    // 🌟 Añadir
) {
  try {
    // 1. Identificamos el tenant (Prioridad a la organización)
    const tenantId = orgId || clerkId;

    // 2. Sincronizamos los datos del Tenant (Nombre, ID de Clerk, etc.)
    await this.ensureTenant(clerkId, fullName, orgId, orgName);

    // 3. Buscamos la configuración específica de este gimnasio
    const config = await db.select().from(gymConfigs)
      .where(eq(gymConfigs.tenantId, tenantId))
      .limit(1);

    if (config.length === 0) {
      return { status: 'error', message: 'No se encontró configuración' };
    }

    return {
      status: 'success',
      modulos: config[0].modulos, // Retorna qué botones se ven en el menú
      plan: config[0].plan
    };
  } catch (e) {
    console.error("❌ Error cargando módulos:", e);
    return { status: 'error', message: 'Error interno del servidor' };
  }
}
// ==========================================
  // 12. MÓDULO GYM: CAJA (FINANZAS) 💵 (Versión Directa Clerk ID)
  // ==========================================

  @Get('get-transactions')
  async getTransactions(@Query('clerkId') clerkId: string) {
    try {
      if (!clerkId) return [];

      // 🛡️ Filtramos directamente por el ID de Clerk (texto)
      const transactions = await db.select()
        .from(cashRegister)
        .where(eq(cashRegister.tenantId, clerkId)) 
        .orderBy(desc(cashRegister.date));

      return transactions;
    } catch (e) {
      console.error("Error get-transactions:", e);
      return [];
    }
  }

  @Post('save-transaction')
  async saveTransaction(@Body() body: any) {
    try {
      const { clerkId, type, category, amount, description } = body;
      
      if (!clerkId || !type || !category || !amount) {
        return { status: 'error', message: 'Faltan datos requeridos' };
      }

      // 🛡️ Aseguramos que el gimnasio esté registrado en la tabla tenants
      await this.ensureTenant(clerkId);

      // Insertamos el movimiento usando el clerkId directamente como tenantId
      await db.insert(cashRegister).values({
        tenantId: clerkId, 
        type, // 'INCOME' o 'EXPENSE'
        category,
        amount: String(amount),
        description,
        date: new Date()
      });

      return { status: 'success', message: 'Transacción registrada correctamente' };
    } catch (e) { 
      console.error("Error save-transaction:", e);
      return { status: 'error', message: 'Error al registrar el movimiento en caja' }; 
    }
  }

  @Post('delete-transaction')
  async deleteTransaction(@Body() body: { id: string, clerkId: string }) {
    try {
      const { id, clerkId } = body;
      if (!id || !clerkId) return { status: 'error', message: 'Faltan datos' };

      // Seguridad: Solo borramos si la transacción pertenece a este clerkId
      await db.delete(cashRegister).where(
        and(
          eq(cashRegister.id, id),
          eq(cashRegister.tenantId, clerkId)
        )
      );
      
      return { status: 'success', message: 'Transacción eliminada' };
    } catch (error) {
      console.error("Error delete-transaction:", error);
      return { status: 'error', message: 'No se pudo eliminar el registro de caja.' };
    }
  }
}