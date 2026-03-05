import { IsString, IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateModuleDto {
  @IsString()
  @IsNotEmpty()
  modulo!: string; // Ejemplo: 'caja', 'afiliados'

  @IsBoolean()
  @IsNotEmpty()
  activo!: boolean; // true o false
}