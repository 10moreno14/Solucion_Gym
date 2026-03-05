"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gymConfigsRelations = exports.tenantsRelations = exports.accessesRelations = exports.membershipsRelations = exports.plansRelations = exports.affiliatesRelations = exports.maintenanceReportsRelations = exports.machinesRelations = exports.clientsRelations = exports.cashRegister = exports.accesses = exports.memberships = exports.affiliates = exports.plans = exports.maintenanceReports = exports.machines = exports.clients = exports.gymConfigs = exports.auditLogs = exports.payments = exports.users = exports.tenants = exports.userRoleEnum = exports.paymentStatusEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.paymentStatusEnum = (0, pg_core_1.pgEnum)('payment_status', [
    'pending',
    'completed',
    'failed',
    'refunded'
]);
exports.userRoleEnum = (0, pg_core_1.pgEnum)('user_role', [
    'tecnico',
    'gimnasio',
    'afiliado'
]);
exports.tenants = (0, pg_core_1.pgTable)('tenants', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    clerkOrgId: (0, pg_core_1.text)('clerk_org_id').unique(),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.text)('tenant_id').references(() => exports.tenants.id),
    fullName: (0, pg_core_1.text)('full_name').notNull(),
    email: (0, pg_core_1.text)('email').notNull(),
    clerkId: (0, pg_core_1.text)('clerk_id').unique(),
    role: (0, exports.userRoleEnum)('role').default('afiliado').notNull(),
});
exports.payments = (0, pg_core_1.pgTable)('payments', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.text)('tenant_id').references(() => exports.tenants.id).notNull(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id).notNull(),
    amount: (0, pg_core_1.numeric)('amount', { precision: 12, scale: 2 }).notNull(),
    status: (0, exports.paymentStatusEnum)('payment_status').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => ({
    tenantIdx: (0, pg_core_1.index)('payments_tenant_idx').on(table.tenantId),
}));
exports.auditLogs = (0, pg_core_1.pgTable)('audit_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.text)('tenant_id').references(() => exports.tenants.id).notNull(),
    action: (0, pg_core_1.text)('action').notNull(),
    entityType: (0, pg_core_1.text)('entity_type').notNull(),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.gymConfigs = (0, pg_core_1.pgTable)('gym_configs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.text)('tenant_id').references(() => exports.tenants.id).notNull().unique(),
    plan: (0, pg_core_1.text)('plan').default('Básico').notNull(),
    modulos: (0, pg_core_1.jsonb)('modulos').$type().default({
        dashboard: true,
        planes: true,
        afiliados: true,
        accesos: false,
        caja: false
    }).notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.clients = (0, pg_core_1.pgTable)('clients', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.text)('tenant_id').references(() => exports.tenants.id).notNull(),
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
    tenantId: (0, pg_core_1.text)('tenant_id').references(() => exports.tenants.id).notNull(),
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
    tenantId: (0, pg_core_1.text)('tenant_id').references(() => exports.tenants.id).notNull(),
    clientId: (0, pg_core_1.uuid)('client_id').references(() => exports.clients.id).notNull(),
    machineId: (0, pg_core_1.uuid)('machine_id').references(() => exports.machines.id).notNull(),
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
exports.plans = (0, pg_core_1.pgTable)('plans', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    tenantId: (0, pg_core_1.text)('tenant_id').references(() => exports.tenants.id).notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    price: (0, pg_core_1.numeric)('price', { precision: 12, scale: 2 }).notNull(),
    durationDays: (0, pg_core_1.integer)('duration_days').notNull(),
    description: (0, pg_core_1.text)('description'),
    status: (0, pg_core_1.text)('status').default('ACTIVE').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => ({
    tenantIdx: (0, pg_core_1.index)('plans_tenant_idx').on(table.tenantId),
}));
exports.affiliates = (0, pg_core_1.pgTable)('affiliates', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    tenantId: (0, pg_core_1.text)('tenant_id').references(() => exports.tenants.id).notNull(),
    fullName: (0, pg_core_1.text)('full_name').notNull(),
    documentType: (0, pg_core_1.text)('document_type'),
    documentNumber: (0, pg_core_1.text)('document_number'),
    phone: (0, pg_core_1.text)('phone'),
    photoUrl: (0, pg_core_1.text)('photo_url'),
    status: (0, pg_core_1.text)('status').default('ACTIVE').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => ({
    tenantIdx: (0, pg_core_1.index)('affiliates_tenant_idx').on(table.tenantId),
    docIdx: (0, pg_core_1.index)('affiliates_document_idx').on(table.documentNumber),
}));
exports.memberships = (0, pg_core_1.pgTable)('memberships', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    tenantId: (0, pg_core_1.text)('tenant_id').references(() => exports.tenants.id).notNull(),
    memberId: (0, pg_core_1.uuid)('member_id').references(() => exports.affiliates.id).notNull(),
    planId: (0, pg_core_1.uuid)('plan_id').references(() => exports.plans.id).notNull(),
    startDate: (0, pg_core_1.timestamp)('start_date').notNull(),
    endDate: (0, pg_core_1.timestamp)('end_date').notNull(),
    pricePaid: (0, pg_core_1.numeric)('price_paid', { precision: 12, scale: 2 }).notNull(),
    status: (0, pg_core_1.text)('status').default('ACTIVE').notNull(),
    autoRenew: (0, pg_core_1.boolean)('auto_renew').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
}, (table) => ({
    tenantIdx: (0, pg_core_1.index)('memberships_tenant_idx').on(table.tenantId),
}));
exports.accesses = (0, pg_core_1.pgTable)('accesses', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    tenantId: (0, pg_core_1.text)('tenant_id').references(() => exports.tenants.id).notNull(),
    memberId: (0, pg_core_1.uuid)('member_id').references(() => exports.affiliates.id).notNull(),
    accessTime: (0, pg_core_1.timestamp)('access_time').defaultNow().notNull(),
    method: (0, pg_core_1.text)('method').notNull(),
    status: (0, pg_core_1.text)('status').notNull(),
}, (table) => ({
    tenantIdx: (0, pg_core_1.index)('accesses_tenant_idx').on(table.tenantId),
    timeIdx: (0, pg_core_1.index)('accesses_time_idx').on(table.accessTime),
}));
exports.cashRegister = (0, pg_core_1.pgTable)('cash_register', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    tenantId: (0, pg_core_1.text)('tenant_id').references(() => exports.tenants.id).notNull(),
    type: (0, pg_core_1.text)('type').notNull(),
    category: (0, pg_core_1.text)('category').notNull(),
    amount: (0, pg_core_1.numeric)('amount', { precision: 12, scale: 2 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    date: (0, pg_core_1.timestamp)('date').defaultNow().notNull(),
}, (table) => ({
    tenantIdx: (0, pg_core_1.index)('cash_register_tenant_idx').on(table.tenantId),
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
exports.affiliatesRelations = (0, drizzle_orm_1.relations)(exports.affiliates, ({ many }) => ({
    memberships: many(exports.memberships),
    accesses: many(exports.accesses),
}));
exports.plansRelations = (0, drizzle_orm_1.relations)(exports.plans, ({ many }) => ({
    memberships: many(exports.memberships),
}));
exports.membershipsRelations = (0, drizzle_orm_1.relations)(exports.memberships, ({ one }) => ({
    affiliate: one(exports.affiliates, {
        fields: [exports.memberships.memberId],
        references: [exports.affiliates.id],
    }),
    plan: one(exports.plans, {
        fields: [exports.memberships.planId],
        references: [exports.plans.id],
    }),
}));
exports.accessesRelations = (0, drizzle_orm_1.relations)(exports.accesses, ({ one }) => ({
    affiliate: one(exports.affiliates, {
        fields: [exports.accesses.memberId],
        references: [exports.affiliates.id],
    }),
}));
exports.tenantsRelations = (0, drizzle_orm_1.relations)(exports.tenants, ({ one }) => ({
    config: one(exports.gymConfigs, {
        fields: [exports.tenants.id],
        references: [exports.gymConfigs.tenantId],
    }),
}));
exports.gymConfigsRelations = (0, drizzle_orm_1.relations)(exports.gymConfigs, ({ one }) => ({
    tenant: one(exports.tenants, {
        fields: [exports.gymConfigs.tenantId],
        references: [exports.tenants.id],
    }),
}));
//# sourceMappingURL=schema.js.map