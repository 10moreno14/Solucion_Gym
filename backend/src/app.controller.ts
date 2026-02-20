import { Controller, Get, Post, Body, UseInterceptors, UploadedFiles, Query } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { db } from './db';
import { users, tenants, maintenanceReports, clients, machines } from './db/schema';
import { eq, desc, ilike, and, gte, lte, asc } from 'drizzle-orm';

@Controller()
export class AppController {

  @Get()
  getWelcome() {
    return { status: 'success', message: 'API Solución Gym v1.0 🚀' };
  }

  // ==========================================
  // 1. USUARIOS (Sincronización Clerk)
  // ==========================================
  @Post('sync-user')
  async syncUser(@Body() body: { clerkId: string; email: string; fullName: string }) {
    try {
      const { clerkId, email, fullName } = body;
      const existingUsers = await db.select().from(users).where(eq(users.clerkId, clerkId));

      if (existingUsers.length > 0) {
        return { status: 'success', message: '¡Bienvenido de vuelta!', tenantId: existingUsers[0].tenantId };
      }

      const newTenant = await db.insert(tenants).values({ name: `Gimnasio de ${fullName}` }).returning();
      const tenantId = newTenant[0].id;
      await db.insert(users).values({ clerkId, email, fullName, tenantId });

      return { status: 'success', message: 'Usuario creado', tenantId };
    } catch (error) {
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
    return files.map(file => `http://localhost:3000/uploads/${file.filename}`);
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
  // 6. ESTADÍSTICAS 📊
  // ==========================================
  @Get('get-stats')
  async getStats(@Query('clerkId') clerkId: string) {
    try {
      const userResult = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
      const user = userResult[0];

      if (!user || !user.tenantId) {
        return { stats: { reports: 0, clients: 0, machines: 0 }, latestReports: [] };
      }
      
      const tenantId = user.tenantId;

      const totalReports = await db.select().from(maintenanceReports).where(eq(maintenanceReports.tenantId, tenantId));
      const totalClients = await db.select().from(clients).where(eq(clients.tenantId, tenantId));
      const totalMachines = await db.select().from(machines).where(eq(machines.tenantId, tenantId));

      const latestReports = await db.query.maintenanceReports.findMany({
        where: eq(maintenanceReports.tenantId, tenantId),
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
      return { stats: { reports: 0, clients: 0, machines: 0 }, latestReports: [] };
    }
  }
}