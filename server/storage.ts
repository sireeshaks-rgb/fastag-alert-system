import { db } from "./db";
import { vehicles, type InsertVehicle, type Vehicle } from "@shared/schema";
import { eq, ilike, or } from "drizzle-orm";

export interface IStorage {
  getVehicles(search?: string): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<void>;
  rechargeFastag(id: number, amount: number): Promise<Vehicle | undefined>;
}

export class DatabaseStorage implements IStorage {
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
    const [vehicle] = await db.insert(vehicles).values(insertVehicle).returning();
    return vehicle;
  }

  async updateVehicle(id: number, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [vehicle] = await db
      .update(vehicles)
      .set(updates)
      .where(eq(vehicles.id, id))
      .returning();
    return vehicle;
  }

  async deleteVehicle(id: number): Promise<void> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  async rechargeFastag(id: number, amount: number): Promise<Vehicle | undefined> {
    const vehicle = await this.getVehicle(id);
    if (!vehicle) return undefined;
    
    const [updated] = await db
      .update(vehicles)
      .set({ fastagBalance: vehicle.fastagBalance + amount })
      .where(eq(vehicles.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();