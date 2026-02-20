"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const drizzle_kit_1 = require("drizzle-kit");
exports.default = (0, drizzle_kit_1.defineConfig)({
    dialect: "postgresql",
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dbCredentials: {
        url: "postgres://admin:Soluciong1m@localhost:5432/solucion_gym_db",
    },
});
//# sourceMappingURL=drizzle.config.js.map