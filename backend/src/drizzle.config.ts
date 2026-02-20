import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql", 
  schema: "./src/db/schema.ts", 
  out: "./drizzle",
  dbCredentials: {
    url: "postgres://admin:Soluciong1m@localhost:5432/solucion_gym_db",
  },
});