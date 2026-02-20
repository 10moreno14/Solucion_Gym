import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema'; // <--- IMPORTANTE: Importar todo el esquema

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://admin:Soluciong1m@localhost:5432/solucion_gym_db', 
  // Asegúrate que tu contraseña y puerto sean los correctos
});

// Inicializamos Drizzle PASÁNDOLE EL ESQUEMA
// Sin la parte de { schema }, las relaciones no funcionan
export const db = drizzle(pool, { schema });