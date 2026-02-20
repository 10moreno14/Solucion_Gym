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
  uniqueIndex 
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

/* ================================
   CORE TABLES
================================ */

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  clerkId: text('clerk_id').unique(),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  status: paymentStatusEnum('payment_status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('payments_tenant_idx').on(table.tenantId),
}));

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/* ================================
   CLIENTS
================================ */

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
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
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
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

  tenantId: uuid('tenant_id')
    .references(() => tenants.id)
    .notNull(),

  clientId: uuid('client_id')
    .references(() => clients.id)
    .notNull(),

  machineId: uuid('machine_id')
    .references(() => machines.id)
    .notNull(),

  // Consecutivo por tenant
  reportNumber: integer('report_number').notNull(),

  date: timestamp('date').defaultNow().notNull(),

  type: text('type').default('PREVENTIVO'),

  // Técnico
  technicianName: text('technician_name').notNull(),
  technicianCc: text('technician_cc'),

  // Actividades (Guardadas como array de strings)
  activities: jsonb('activities').$type<string[]>(),

  observations: text('observations'),

  // Evidencias
  photosBefore: jsonb('photos_before').$type<string[]>(),
  photosAfter: jsonb('photos_after').$type<string[]>(),

  // Firmas
  technicianSignature: text('technician_signature'),
  clientSignature: text('client_signature'),

  status: text('status').default('COMPLETED'),

  pdfUrl: text('pdf_url'),

  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  tenantIdx: index('reports_tenant_idx').on(table.tenantId),
  // MEJORA CLAVE: Índice único compuesto.
  // Garantiza que en un mismo Tenant NO existan dos reportes con el mismo número.
  uniqueReportPerTenant: uniqueIndex('unique_report_number_per_tenant').on(table.tenantId, table.reportNumber),
}));

/* ================================
   RELATIONS (La magia de Drizzle)
================================ */

// Relaciones de Clientes
export const clientsRelations = relations(clients, ({ many }) => ({
  machines: many(machines),
  reports: many(maintenanceReports),
}));

// Relaciones de Máquinas
export const machinesRelations = relations(machines, ({ one, many }) => ({
  client: one(clients, {
    fields: [machines.clientId],
    references: [clients.id],
  }),
  reports: many(maintenanceReports),
}));

// Relaciones de Reportes
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