import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  numeric, 
  jsonb, 
  pgEnum, 
  index, 
  integer,
  uniqueIndex,
  boolean
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/* ================================
   ENUMS
================================ */

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'completed',
  'failed',
  'refunded'
]);

export const userRoleEnum = pgEnum('user_role', [
  'tecnico', 
  'gimnasio', 
  'afiliado'
]);

/* ================================
   CORE TABLES
================================ */

export const tenants = pgTable('tenants', {
  // 🔑 El ID ahora es el de Clerk (org_... o user_...)
  id: text('id').primaryKey(), 
  name: text('name').notNull(),
  clerkOrgId: text('clerk_org_id').unique(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').references(() => tenants.id), // 👈 Cambiado a text
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  clerkId: text('clerk_id').unique(),
  role: userRoleEnum('role').default('afiliado').notNull(),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').references(() => tenants.id).notNull(), // 👈 Cambiado a text
  userId: uuid('user_id').references(() => users.id).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  status: paymentStatusEnum('payment_status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('payments_tenant_idx').on(table.tenantId),
}));

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').references(() => tenants.id).notNull(), // 👈 Cambiado a text
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/* ================================
   CONFIGURACIÓN Y MÓDULOS (SUPER ADMIN)
================================ */

export type ModulosGym = {
  dashboard: boolean;
  planes: boolean;
  afiliados: boolean;
  accesos: boolean;
  caja: boolean;
};

export const gymConfigs = pgTable('gym_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').references(() => tenants.id).notNull().unique(), // 👈 Cambiado a text
  plan: text('plan').default('Básico').notNull(),
  modulos: jsonb('modulos').$type<ModulosGym>().default({
    dashboard: true,
    planes: true,
    afiliados: true,
    accesos: false, 
    caja: false     
  }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/* ================================
   CLIENTS (Clientes del Técnico)
================================ */

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').references(() => tenants.id).notNull(), // 👈 Cambiado a text
  name: text('name').notNull(),
  nit: text('nit'),
  phone: text('phone'),
  address: text('address'),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  tenantIdx: index('clients_tenant_idx').on(table.tenantId),
}));

/* ================================
   MACHINES
================================ */

export const machines = pgTable('machines', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').references(() => tenants.id).notNull(), // 👈 Cambiado a text
  clientId: uuid('client_id').references(() => clients.id),
  name: text('name').notNull(),
  brand: text('brand'),
  model: text('model'),
  serial: text('serial'),
  location: text('location'),
  qrCode: text('qr_code'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  tenantIdx: index('machines_tenant_idx').on(table.tenantId),
}));

/* ================================
   MAINTENANCE REPORTS
================================ */

export const maintenanceReports = pgTable('maintenance_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: text('tenant_id').references(() => tenants.id).notNull(), // 👈 Cambiado a text
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  machineId: uuid('machine_id').references(() => machines.id).notNull(),
  reportNumber: integer('report_number').notNull(),
  date: timestamp('date').defaultNow().notNull(),
  type: text('type').default('PREVENTIVO'),
  technicianName: text('technician_name').notNull(),
  technicianCc: text('technician_cc'),
  activities: jsonb('activities').$type<string[]>(),
  observations: text('observations'),
  photosBefore: jsonb('photos_before').$type<string[]>(),
  photosAfter: jsonb('photos_after').$type<string[]>(),
  technicianSignature: text('technician_signature'),
  clientSignature: text('client_signature'),
  status: text('status').default('COMPLETED'),
  pdfUrl: text('pdf_url'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  tenantIdx: index('reports_tenant_idx').on(table.tenantId),
  uniqueReportPerTenant: uniqueIndex('unique_report_number_per_tenant').on(table.tenantId, table.reportNumber),
}));


/* ============================================================================
   🏋️ MÓDULO: GESTIÓN DE GIMNASIOS (PANEL GYM)
============================================================================ */

export const plans = pgTable('plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.id).notNull(), // 👈 Cambiado a text
  name: text('name').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  durationDays: integer('duration_days').notNull(), 
  description: text('description'),
  status: text('status').default('ACTIVE').notNull(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('plans_tenant_idx').on(table.tenantId),
}));

export const affiliates = pgTable('affiliates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.id).notNull(), // 👈 Cambiado a text
  fullName: text('full_name').notNull(),
  documentType: text('document_type'), 
  documentNumber: text('document_number'),
  phone: text('phone'),
  photoUrl: text('photo_url'),
  status: text('status').default('ACTIVE').notNull(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('affiliates_tenant_idx').on(table.tenantId),
  docIdx: index('affiliates_document_idx').on(table.documentNumber),
}));

export const memberships = pgTable('memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.id).notNull(), // 👈 Cambiado a text
  memberId: uuid('member_id').references(() => affiliates.id).notNull(),
  planId: uuid('plan_id').references(() => plans.id).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  pricePaid: numeric('price_paid', { precision: 12, scale: 2 }).notNull(), 
  status: text('status').default('ACTIVE').notNull(), 
  autoRenew: boolean('auto_renew').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('memberships_tenant_idx').on(table.tenantId),
}));

export const accesses = pgTable('accesses', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.id).notNull(), // 👈 Cambiado a text
  memberId: uuid('member_id').references(() => affiliates.id).notNull(),
  accessTime: timestamp('access_time').defaultNow().notNull(),
  method: text('method').notNull(), 
  status: text('status').notNull(), 
}, (table) => ({
  tenantIdx: index('accesses_tenant_idx').on(table.tenantId),
  timeIdx: index('accesses_time_idx').on(table.accessTime),
}));

export const cashRegister = pgTable('cash_register', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.id).notNull(), // 👈 Cambiado a text
  type: text('type').notNull(), 
  category: text('category').notNull(), 
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  date: timestamp('date').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('cash_register_tenant_idx').on(table.tenantId),
}));

/* ================================
   RELATIONS
================================ */

export const clientsRelations = relations(clients, ({ many }) => ({
  machines: many(machines),
  reports: many(maintenanceReports),
}));

export const machinesRelations = relations(machines, ({ one, many }) => ({
  client: one(clients, {
    fields: [machines.clientId],
    references: [clients.id],
  }),
  reports: many(maintenanceReports),
}));

export const maintenanceReportsRelations = relations(maintenanceReports, ({ one }) => ({
  client: one(clients, {
    fields: [maintenanceReports.clientId],
    references: [clients.id],
  }),
  machine: one(machines, {
    fields: [maintenanceReports.machineId],
    references: [machines.id],
  }),
  tenant: one(tenants, {
    fields: [maintenanceReports.tenantId],
    references: [tenants.id],
  }),
}));

export const affiliatesRelations = relations(affiliates, ({ many }) => ({
  memberships: many(memberships),
  accesses: many(accesses),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  affiliate: one(affiliates, {
    fields: [memberships.memberId],
    references: [affiliates.id],
  }),
  plan: one(plans, {
    fields: [memberships.planId],
    references: [plans.id],
  }),
}));

export const accessesRelations = relations(accesses, ({ one }) => ({
  affiliate: one(affiliates, {
    fields: [accesses.memberId],
    references: [affiliates.id],
  }),
}));

export const tenantsRelations = relations(tenants, ({ one }) => ({
  config: one(gymConfigs, {
    fields: [tenants.id],
    references: [gymConfigs.tenantId],
  }),
}));

export const gymConfigsRelations = relations(gymConfigs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [gymConfigs.tenantId],
    references: [tenants.id],
  }),
}));