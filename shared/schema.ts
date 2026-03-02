import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Fleet Groups Table
export const fleetGroups = sqliteTable("fleet_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Roles Table
export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: text("permissions").notNull(), // JSON string of permissions
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Users Table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Will store hashed password
  name: text("name").notNull(),
  roleId: integer("role_id").notNull(),
  fleetGroupId: integer("fleet_group_id"),
  // SQLite stores integers: 1 for true, 0 for false
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Vehicles Table
export const vehicles = sqliteTable("vehicles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vehicleNumber: text("vehicle_number").notNull().unique(),
  ownerName: text("owner_name").notNull(),
  model: text("model").notNull(),
  mileage: integer("mileage").notNull(),
  fastagBalance: integer("fastag_balance").notNull().default(0),
  lastServiceDate: text("last_service_date").notNull(),
  fleetGroupId: integer("fleet_group_id"),
  createdBy: integer("created_by"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Audit Logs Table
export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(), // create, update, delete, recharge
  entityType: text("entity_type").notNull(), // vehicle, user, fleetgroup
  entityId: integer("entity_id").notNull(),
  changes: text("changes"), // JSON string of what changed
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("audit_logs_user_id_idx").on(table.userId),
  index("audit_logs_entity_idx").on(table.entityType, table.entityId),
]);

// Schemas for insert operations
export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  roleId: z.number().int().positive(),
  fleetGroupId: z.number().int().positive().optional().nullable(),
});

export const insertFleetGroupSchema = z.object({
  name: z.string().min(2, "Fleet group name is required"),
  description: z.string().optional(),
});

export const insertRoleSchema = z.object({
  name: z.string().min(2, "Role name is required"),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});

// Types
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type FleetGroup = typeof fleetGroups.$inferSelect;
export type InsertFleetGroup = z.infer<typeof insertFleetGroupSchema>;
export type Role = typeof roles.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
