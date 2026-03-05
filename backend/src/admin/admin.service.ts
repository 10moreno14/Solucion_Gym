import { Injectable } from '@nestjs/common';
import { db } from '../db'; 
import { tenants, gymConfigs } from '../db/schema'; 
import { eq } from 'drizzle-orm';

@Injectable()
export class AdminService {
  
  // 1. OBTENER TODOS LOS GIMNASIOS (Para el Super Admin)
  async getAllGyms() {
    const allTenants = await db.query.tenants.findMany({
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

  // 2. OBTENER CONFIGURACIÓN (Para el Sidebar y Validación de Acceso)
  // 🌟 MODIFICADO: Recibe el orgId y se lo pasa al provisionador
  async getOneConfig(tenantId: string, orgId?: string) {
    try {
      // 🛡️ Aseguramos que el tenant exista y guardamos su orgId
      await this.ensureTenant(tenantId, orgId);

      // 🛑 VERIFICACIÓN DE ESTADO (Bloqueo por mora)
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
      });

      if (tenant && tenant.isActive === false) {
        return { isActive: false, modulos: {} };
      }

      const config = await db.query.gymConfigs.findFirst({
        where: eq(gymConfigs.tenantId, tenantId), 
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
    } catch (error) {
      console.error("Error al obtener config del gimnasio:", error);
      throw error;
    }
  }

  // 3. ACTUALIZAR UN MÓDULO (Desde el Super Admin)
  async toggleModulo(tenantId: string, modulo: string, activo: boolean) {
    try {
      await this.ensureTenant(tenantId);

      let config = await db.query.gymConfigs.findFirst({
        where: eq(gymConfigs.tenantId, tenantId),
      });

      if (!config) {
        const [newConfig] = await db.insert(gymConfigs).values({
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

      await db
        .update(gymConfigs)
        .set({
          modulos: nuevosModulos,
          updatedAt: new Date(),
        })
        .where(eq(gymConfigs.tenantId, tenantId));

      return { success: true };
    } catch (error) {
      console.error("Error en AdminService al actualizar módulo:", error);
      throw error;
    }
  }

  // 4. ACTIVAR / DESACTIVAR GIMNASIO (Kill Switch para el Super Admin) 🔴
  async toggleGymStatus(tenantId: string, isActive: boolean) {
    try {
      await db.update(tenants)
        .set({ isActive })
        .where(eq(tenants.id, tenantId));
        
      return { success: true, isActive };
    } catch (error) {
      console.error("Error al cambiar estado del gimnasio:", error);
      throw error;
    }
  }

  // 5. 🛡️ PROVISIONADOR DE TENANT
  // 🌟 MODIFICADO: Ahora hace un "Upsert" para guardar/actualizar el clerkOrgId
  private async ensureTenant(tenantId: string, orgId?: string): Promise<void> {
    // Limpiamos el orgId por si llega como el string "undefined" o vacío
    const actualOrgId = orgId && orgId !== 'undefined' && orgId !== '' ? orgId : null;

    // 1. Insertamos el gimnasio o actualizamos su orgId si ya existía
    await db.insert(tenants)
      .values({
        id: tenantId,
        name: 'Gimnasio Nuevo',
        clerkOrgId: actualOrgId, // 👈 Guardamos el ID de la organización
      })
      .onConflictDoUpdate({
        target: tenants.id,
        set: { 
          clerkOrgId: actualOrgId // Si el usuario antes no tenía org y ahora sí, se actualiza
        }
      });

    // 2. Insertamos la configuración base si no existe
    await db.insert(gymConfigs)
      .values({
        tenantId: tenantId,
        plan: 'Básico',
        modulos: { dashboard: true, planes: true, afiliados: true, accesos: false, caja: false }
      })
      .onConflictDoNothing();
  }
}