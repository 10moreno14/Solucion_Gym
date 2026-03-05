import { Controller, Get, Patch, Param, Body, UseGuards, Query } from '@nestjs/common'; // 👈 1. Agregamos Query aquí
import { AdminService } from './admin.service';
import { UpdateModuleDto } from './dto/update-module.dto';
// Importa aquí tu Guard de autenticación de Clerk si ya lo tienes configurado
// import { ClerkAuthGuard } from '../auth/clerk-auth.guard'; 

@Controller('admin')
// @UseGuards(ClerkAuthGuard) // 👈 Es VITAL proteger esta ruta para que solo tú (técnico) puedas usarla
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Ruta: GET http://localhost:3000/admin/gyms
  @Get('gyms')
  async getGyms() {
    return this.adminService.getAllGyms();
  }

  // Ruta: PATCH http://localhost:3000/admin/gyms/:tenantId/modules
  @Patch('gyms/:tenantId/modules')
  async updateModule(
    @Param('tenantId') tenantId: string,
    @Body() updateData: UpdateModuleDto,
  ) {
    return this.adminService.toggleModulo(tenantId, updateData.modulo, updateData.activo);
  }
  
  // 🌟 2. MODIFICADO: Atrapamos los parámetros de la URL
  @Get('gyms/:tenantId/modules-config')
  async getGymConfig(
    @Param('tenantId') tenantId: string,
    @Query('orgId') orgId?: string, // 👈 Extrae ?orgId=... de la URL
    @Query('userId') userId?: string  // 👈 Extrae ?userId=... de la URL
  ) {
    // 3. Le pasamos el orgId a tu servicio para que pueda guardarlo en la BD
    return await this.adminService.getOneConfig(tenantId, orgId);
  }

  @Patch('gyms/:id/status')
  async toggleGymStatus(
    @Param('id') id: string, 
    @Body('isActive') isActive: boolean
  ) {
    return this.adminService.toggleGymStatus(id, isActive);
  }
}