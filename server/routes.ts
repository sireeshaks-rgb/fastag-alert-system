import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

// Helper to append the computed isLowBalance field
function computeAlert(vehicle: any) {
  return {
    ...vehicle,
    isLowBalance: vehicle.fastagBalance < 200,
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.vehicles.list.path, async (req, res) => {
    try {
      const search = req.query.search ? String(req.query.search) : undefined;
      const data = await storage.getVehicles(search);
      res.json(data.map(computeAlert));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get(api.vehicles.get.path, async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(Number(req.params.id));
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
      res.json(computeAlert(vehicle));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  app.post(api.vehicles.create.path, async (req, res) => {
    try {
      // Coerce input values
      const bodySchema = api.vehicles.create.input.extend({
        mileage: z.coerce.number(),
        fastagBalance: z.coerce.number().default(0),
      });
      const input = bodySchema.parse(req.body);
      const vehicle = await storage.createVehicle(input);
      res.status(201).json(computeAlert(vehicle));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      // If unique constraint violation
      if (err.code === '23505') {
        return res.status(400).json({ message: "Vehicle number already exists" });
      }
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  app.put(api.vehicles.update.path, async (req, res) => {
    try {
      const bodySchema = api.vehicles.update.input.extend({
        mileage: z.coerce.number().optional(),
        fastagBalance: z.coerce.number().optional(),
      });
      const input = bodySchema.parse(req.body);
      const vehicle = await storage.updateVehicle(Number(req.params.id), input);
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
      res.json(computeAlert(vehicle));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      if (err.code === '23505') {
        return res.status(400).json({ message: "Vehicle number already exists" });
      }
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  app.delete(api.vehicles.delete.path, async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(Number(req.params.id));
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
      await storage.deleteVehicle(Number(req.params.id));
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  app.post(api.vehicles.recharge.path, async (req, res) => {
    try {
      const bodySchema = api.vehicles.recharge.input.extend({
        amount: z.coerce.number().positive(),
      });
      const input = bodySchema.parse(req.body);
      const vehicle = await storage.rechargeFastag(Number(req.params.id), input.amount);
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
      res.json(computeAlert(vehicle));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to recharge" });
    }
  });

  // Seed data function
  async function seedDatabase() {
    try {
      const existingItems = await storage.getVehicles();
      if (existingItems.length === 0) {
        await storage.createVehicle({
          vehicleNumber: "KA-01-AB-1234",
          ownerName: "Rahul Sharma",
          model: "Toyota Innova",
          mileage: 45000,
          fastagBalance: 150, // Low balance example
          lastServiceDate: "2023-10-15",
        });
        await storage.createVehicle({
          vehicleNumber: "MH-12-PQ-5678",
          ownerName: "Priya Patel",
          model: "Honda City",
          mileage: 32000,
          fastagBalance: 850,
          lastServiceDate: "2023-11-20",
        });
        await storage.createVehicle({
          vehicleNumber: "DL-04-XYZ-9012",
          ownerName: "Amit Singh",
          model: "Maruti Swift",
          mileage: 12000,
          fastagBalance: 50, // Low balance example
          lastServiceDate: "2024-01-05",
        });
      }
    } catch (err) {
      console.error("Error seeding database", err);
    }
  }

  // Run seeding
  seedDatabase();

  return httpServer;
}