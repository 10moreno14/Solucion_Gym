"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maintenanceReportsRelations = exports.machinesRelations = exports.clientsRelations = exports.maintenanceReports = exports.machines = exports.clients = exports.auditLogs = exports.payments = exports.users = exports.tenants = exports.paymentStatusEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.paymentStatusEnum = (0, pg_core_1.pgEnum)('payment_status', [
    'pending',
    'completed',
    'failed',
    'refunded'
]);
exports.tenants = (0, pg_core_1.pgTable)('tenants', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)('tenant_id').references(() => exports.tenants.id),
    fullName: (0, pg_core_1.text)('full_name').notNull(),
    email: (0, pg_core_1.text)('email').notNull(),
    clerkId: (0, pg_core_1.text)('clerk_id').unique(),
});
exports.payments = (0, pg_core_1.pgTable)('payments', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)('tenant_id').references(() => exports.tenants.id).notNull(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id).notNull(),
    amount: (0, pg_core_1.numeric)('amount', { precision: 12, scale: 2 }).notNull(),
    status: (0, exports.paymentStatusEnum)('payment_status').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => ({
    tenantIdx: (0, pg_core_1.index)('payments_tenant_idx').on(table.tenantId),
}));
exports.auditLogs = (0, pg_core_1.pgTable)('audit_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)('tenant_id').references(() => exports.tenants.id).notNull(),
    action: (0, pg_core_1.text)('action').notNull(),
    entityType: (0, pg_core_1.text)('entity_type').notNull(),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.clients = (0, pg_core_1.pgTable)('clients', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)('tenant_id').references(() => exports.tenants.id).notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    nit: (0, pg_core_1.text)('nit'),
    phone: (0, pg_core_1.text)('phone'),
    address: (0, pg_core_1.text)('address'),
    email: (0, pg_core_1.text)('email'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (table) => ({
    tenantIdx: (0, pg_core_1.index)('clients_tenant_idx').on(table.tenantId),
}));
exports.machines = (0, pg_core_1.pgTable)('machines', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)('tenant_id').references(() => exports.tenants.id).notNull(),
    clientId: (0, pg_core_1.uuid)('client_id').references(() => exports.clients.id),
    name: (0, pg_core_1.text)('name').notNull(),
    brand: (0, pg_core_1.text)('brand'),
    model: (0, pg_core_1.text)('model'),
    serial: (0, pg_core_1.text)('serial'),
    location: (0, pg_core_1.text)('location'),
    qrCode: (0, pg_core_1.text)('qr_code'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (table) => ({
    tenantIdx: (0, pg_core_1.index)('machines_tenant_idx').on(table.tenantId),
}));
exports.maintenanceReports = (0, pg_core_1.pgTable)('maintenance_reports', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)('tenant_id')
        .references(() => exports.tenants.id)
        .notNull(),
    clientId: (0, pg_core_1.uuid)('client_id')
        .references(() => exports.clients.id)
        .notNull(),
    machineId: (0, pg_core_1.uuid)('machine_id')
        .references(() => exports.machines.id)
        .notNull(),
    reportNumber: (0, pg_core_1.integer)('report_number').notNull(),
    date: (0, pg_core_1.timestamp)('date').defaultNow().notNull(),
    type: (0, pg_core_1.text)('type').default('PREVENTIVO'),
    technicianName: (0, pg_core_1.text)('technician_name').notNull(),
    technicianCc: (0, pg_core_1.text)('technician_cc'),
    activities: (0, pg_core_1.jsonb)('activities').$type(),
    observations: (0, pg_core_1.text)('observations'),
    photosBefore: (0, pg_core_1.jsonb)('photos_before').$type(),
    photosAfter: (0, pg_core_1.jsonb)('photos_after').$type(),
    technicianSignature: (0, pg_core_1.text)('technician_signature'),
    clientSignature: (0, pg_core_1.text)('client_signature'),
    status: (0, pg_core_1.text)('status').default('COMPLETED'),
    pdfUrl: (0, pg_core_1.text)('pdf_url'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (table) => ({
    tenantIdx: (0, pg_core_1.index)('reports_tenant_idx').on(table.tenantId),
    uniqueReportPerTenant: (0, pg_core_1.uniqueIndex)('unique_report_number_per_tenant').on(table.tenantId, table.reportNumber),
}));
exports.clientsRelations = (0, drizzle_orm_1.relations)(exports.clients, ({ many }) => ({
    machines: many(exports.machines),
    reports: many(exports.maintenanceReports),
}));
exports.machinesRelations = (0, drizzle_orm_1.relations)(exports.machines, ({ one, many }) => ({
    client: one(exports.clients, {
        fields: [exports.machines.clientId],
        references: [exports.clients.id],
    }),
    reports: many(exports.maintenanceReports),
}));
exports.maintenanceReportsRelations = (0, drizzle_orm_1.relations)(exports.maintenanceReports, ({ one }) => ({
    client: one(exports.clients, {
        fields: [exports.maintenanceReports.clientId],
        references: [exports.clients.id],
    }),
    machine: one(exports.machines, {
        fields: [exports.maintenanceReports.machineId],
        references: [exports.machines.id],
    }),
    tenant: one(exports.tenants, {
        fields: [exports.maintenanceReports.tenantId],
        references: [exports.tenants.id],
    }),
}));
//# sourceMappingURL=schema.js.map