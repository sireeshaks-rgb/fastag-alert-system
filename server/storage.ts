import { db } from "./db";
import {
  vehicles,
  users,
  auditLogs,
  fleetGroups,
  roles,
  type InsertVehicle,
  type Vehicle,
  type User,
  type InsertUser,
  type FleetGroup,
  type InsertFleetGroup,
  type AuditLog,
  type Role,
} from "@shared/schema";
import { eq, ilike, or, desc, and } from "drizzle-orm";

export interface IStorage {
  // Vehicle methods
  getVehicles(search?: string): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<void>;
  rechargeFastag(id: number, amount: number): Promise<Vehicle | undefined>;

  // User methods
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;

  // Fleet Group methods
  getFleetGroups(): Promise<FleetGroup[]>;
  getFleetGroup(id: number): Promise<FleetGroup | undefined>;
  createFleetGroup(group: InsertFleetGroup): Promise<FleetGroup>;
  updateFleetGroup(id: number, updates: Partial<InsertFleetGroup>): Promise<FleetGroup | undefined>;
  deleteFleetGroup(id: number): Promise<void>;

  // Role methods
  getRoles(): Promise<Role[]>;
  createRole?(role: Partial<Role> & { name: string; permissions: string }): Promise<Role>;

  // Audit Log methods
  createAuditLog(
    userId: number,
    action: string,
    entityType: string,
    entityId: number,
    changes?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog>;
  getAuditLogs(entityType?: string, entityId?: number): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // ==================== VEHICLES ====================
  async getVehicles(search?: string): Promise<Vehicle[]> {
    if (search) {
      return await db.select().from(vehicles).where(
        or(
          ilike(vehicles.vehicleNumber, `%${search}%`),
          ilike(vehicles.ownerName, `%${search}%`)
        )
      );
    }
    return await db.select().from(vehicles);
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    await db.insert(vehicles).values(insertVehicle);
    // SQLite: fetch the last inserted vehicle by ordering by id descending
    const [vehicle] = await db.select().from(vehicles).orderBy(desc(vehicles.id)).limit(1);
    return vehicle as Vehicle;
  }

  async updateVehicle(id: number, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    await db
      .update(vehicles)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(vehicles.id, id));
    return await this.getVehicle(id);
  }

  async deleteVehicle(id: number): Promise<void> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  async rechargeFastag(id: number, amount: number): Promise<Vehicle | undefined> {
    const vehicle = await this.getVehicle(id);
    if (!vehicle) return undefined;

    await db
      .update(vehicles)
      .set({ fastagBalance: vehicle.fastagBalance + amount, updatedAt: new Date().toISOString() })
      .where(eq(vehicles.id, id));
    return await this.getVehicle(id);
  }

  // ==================== USERS ====================
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await db.insert(users).values(insertUser);
    const [user] = await db.select().from(users).orderBy(desc(users.id)).limit(1);
    return user as User;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(users.id, id));
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // ==================== FLEET GROUPS ====================
  async getFleetGroups(): Promise<FleetGroup[]> {
    return await db.select().from(fleetGroups);
  }

  async getFleetGroup(id: number): Promise<FleetGroup | undefined> {
    const [group] = await db.select().from(fleetGroups).where(eq(fleetGroups.id, id));
    return group;
  }

  async createFleetGroup(insertGroup: InsertFleetGroup): Promise<FleetGroup> {
    await db.insert(fleetGroups).values(insertGroup);
    const [group] = await db.select().from(fleetGroups).orderBy(desc(fleetGroups.id)).limit(1);
    return group as FleetGroup;
  }

  async updateFleetGroup(id: number, updates: Partial<InsertFleetGroup>): Promise<FleetGroup | undefined> {
    await db
      .update(fleetGroups)
      .set(updates)
      .where(eq(fleetGroups.id, id));
    return await this.getFleetGroup(id);
  }

  async deleteFleetGroup(id: number): Promise<void> {
    await db.delete(fleetGroups).where(eq(fleetGroups.id, id));
  }

  // ==================== ROLES ====================
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }

  async createRole(role: Partial<Role> & { name: string; permissions: string }): Promise<Role> {
    const [r] = await db.insert(roles).values(role as any).returning();
    return r;
  }

  // ==================== AUDIT LOGS ====================
  async createAuditLog(
    userId: number,
    action: string,
    entityType: string,
    entityId: number,
    changes?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    await db
      .insert(auditLogs)
      .values({
        userId,
        action,
        entityType,
        entityId,
        changes: changes ? JSON.stringify(changes) : undefined,
        ipAddress,
        userAgent,
      });
    const [log] = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.id))
      .limit(1);
    return log as AuditLog;
  }

  async getAuditLogs(entityType?: string, entityId?: number): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs).$dynamic();

    if (entityType && entityId) {
      query = query.where(
        and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId))
      );
    } else if (entityType) {
      query = query.where(eq(auditLogs.entityType, entityType));
    } else if (entityId) {
      query = query.where(eq(auditLogs.entityId, entityId));
    }

    return await query.orderBy(desc(auditLogs.createdAt)).limit(1000);
  }
}

export const storage = new DatabaseStorage();