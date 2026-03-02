import type { Express, Request } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { hashPassword, verifyPassword, generateToken, loginSchema, registerSchema } from "./auth";
import { authMiddleware, requireAuth, requireRole } from "./middleware";

// Helper to append the computed isLowBalance field
function computeAlert(vehicle: any) {
  return {
    ...vehicle,
    isLowBalance: vehicle.fastagBalance < 200,
  };
}

// Helper to get client IP
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  return typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress || '';
}

const ROLE_IDS = {
  ADMIN: 1,
  MANAGER: 2,
  DRIVER: 3,
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ==================== AUTH ROUTES ====================
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(input.email);
      
      if (!user || !verifyPassword(input.password, user.password)) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'User account is inactive' });
      }

      const token = generateToken(user.id, user.email);
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        user: userWithoutPassword,
        token,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = registerSchema.parse(req.body);
      
      const existing = await storage.getUserByEmail(input.email);
      if (existing) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const hashedPassword = hashPassword(input.password);
      const user = await storage.createUser({
        ...input,
        password: hashedPassword,
      });

      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.get(api.auth.me.path, authMiddleware, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post(api.auth.logout.path, authMiddleware, (req, res) => {
    // Token-based auth, logout is handled on client side by removing token
    res.status(204).end();
  });

  // ==================== VEHICLE ROUTES ====================
  app.get(api.vehicles.list.path, authMiddleware, async (req, res) => {
    try {
      const search = req.query.search ? String(req.query.search) : undefined;
      const data = await storage.getVehicles(search);
      res.json(data.map(computeAlert));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get(api.vehicles.get.path, authMiddleware, async (req, res) => {
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

  app.post(api.vehicles.create.path, authMiddleware, async (req, res) => {
    try {
      const bodySchema = api.vehicles.create.input.extend({
        mileage: z.coerce.number(),
        fastagBalance: z.coerce.number().default(0),
      });
      const input = bodySchema.parse(req.body);
      
      const vehicle = await storage.createVehicle({
        ...input,
        createdBy: req.userId,
      });

      // Create audit log
      await storage.createAuditLog(
        req.userId!,
        'create',
        'vehicle',
        vehicle.id,
        vehicle,
        getClientIp(req),
        req.headers['user-agent']
      );

      res.status(201).json(computeAlert(vehicle));
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
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  app.put(api.vehicles.update.path, authMiddleware, async (req, res) => {
    try {
      const oldVehicle = await storage.getVehicle(Number(req.params.id));
      if (!oldVehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      const bodySchema = api.vehicles.update.input.extend({
        mileage: z.coerce.number().optional(),
        fastagBalance: z.coerce.number().optional(),
      });
      const input = bodySchema.parse(req.body);
      
      const vehicle = await storage.updateVehicle(Number(req.params.id), input);
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      // Create audit log with changes
      const changes: Record<string, any> = {};
      Object.keys(input).forEach(key => {
        if ((oldVehicle as any)[key] !== (input as any)[key]) {
          changes[key] = { from: (oldVehicle as any)[key], to: (input as any)[key] };
        }
      });

      if (Object.keys(changes).length > 0) {
        await storage.createAuditLog(
          req.userId!,
          'update',
          'vehicle',
          vehicle.id,
          changes,
          getClientIp(req),
          req.headers['user-agent']
        );
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

  app.delete(api.vehicles.delete.path, authMiddleware, async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(Number(req.params.id));
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      await storage.deleteVehicle(Number(req.params.id));

      // Create audit log
      await storage.createAuditLog(
        req.userId!,
        'delete',
        'vehicle',
        vehicle.id,
        vehicle,
        getClientIp(req),
        req.headers['user-agent']
      );

      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  app.post(api.vehicles.recharge.path, authMiddleware, async (req, res) => {
    try {
      const bodySchema = api.vehicles.recharge.input.extend({
        amount: z.coerce.number().positive(),
      });
      const input = bodySchema.parse(req.body);
      
      const oldVehicle = await storage.getVehicle(Number(req.params.id));
      if (!oldVehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      const vehicle = await storage.rechargeFastag(Number(req.params.id), input.amount);
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      // Create audit log
      await storage.createAuditLog(
        req.userId!,
        'recharge',
        'vehicle',
        vehicle.id,
        {
          amount: input.amount,
          previousBalance: oldVehicle.fastagBalance,
          newBalance: vehicle.fastagBalance,
        },
        getClientIp(req),
        req.headers['user-agent']
      );

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

  // ==================== USER ROUTES ====================
  app.get(api.users.list.path, authMiddleware, requireRole(ROLE_IDS.ADMIN), async (req, res) => {
    try {
      const users = await storage.getUsers();
      const usersWithoutPasswords = users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get(api.users.get.path, authMiddleware, async (req, res) => {
    try {
      const isAdmin = req.userRole === ROLE_IDS.ADMIN;
      const userId = Number(req.params.id);
      
      // Only admins can view other users' details
      if (!isAdmin && userId !== req.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put(api.users.update.path, authMiddleware, async (req, res) => {
    try {
      const isAdmin = req.userRole === ROLE_IDS.ADMIN;
      const userId = Number(req.params.id);
      
      // Users can only update their own profile, admins can update anyone
      if (!isAdmin && userId !== req.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const bodySchema = registerSchema.partial();
      const input = bodySchema.parse(req.body);

      // Hash password if provided
      const updateData = { ...input };
      if (input.password) {
        updateData.password = hashPassword(input.password);
      }

      const user = await storage.updateUser(userId, updateData as any);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete(api.users.delete.path, authMiddleware, requireRole(ROLE_IDS.ADMIN), async (req, res) => {
    try {
      const user = await storage.getUser(Number(req.params.id));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await storage.deleteUser(Number(req.params.id));
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ==================== FLEET GROUP ROUTES ====================
  app.get(api.fleetGroups.list.path, authMiddleware, async (req, res) => {
    try {
      const groups = await storage.getFleetGroups();
      res.json(groups);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch fleet groups" });
    }
  });

  app.post(api.fleetGroups.create.path, authMiddleware, requireRole(ROLE_IDS.ADMIN), async (req, res) => {
    try {
      const input = z.object({
        name: z.string().min(2),
        description: z.string().optional(),
      }).parse(req.body);

      const group = await storage.createFleetGroup(input);
      res.status(201).json(group);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create fleet group" });
    }
  });

  app.put(api.fleetGroups.update.path, authMiddleware, requireRole(ROLE_IDS.ADMIN), async (req, res) => {
    try {
      const input = z.object({
        name: z.string().min(2).optional(),
        description: z.string().optional(),
      }).parse(req.body);

      const group = await storage.updateFleetGroup(Number(req.params.id), input);
      if (!group) {
        return res.status(404).json({ message: 'Fleet group not found' });
      }
      res.json(group);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to update fleet group" });
    }
  });

  app.delete(api.fleetGroups.delete.path, authMiddleware, requireRole(ROLE_IDS.ADMIN), async (req, res) => {
    try {
      const group = await storage.getFleetGroup(Number(req.params.id));
      if (!group) {
        return res.status(404).json({ message: 'Fleet group not found' });
      }

      await storage.deleteFleetGroup(Number(req.params.id));
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete fleet group" });
    }
  });

  // ==================== AUDIT LOG ROUTES ====================
  app.get(api.auditLogs.list.path, authMiddleware, requireRole(ROLE_IDS.ADMIN, ROLE_IDS.MANAGER), async (req, res) => {
    try {
      const entityType = req.query.entityType ? String(req.query.entityType) : undefined;
      const entityId = req.query.entityId ? Number(req.query.entityId) : undefined;

      const logs = await storage.getAuditLogs(entityType, entityId);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ==================== SEED DATA ====================
  async function seedDatabase() {
    try {
      // ensure role definitions exist so users can reference them
      const existingRoles = await storage.getRoles?.() || [];
      if (existingRoles.length === 0 && storage.createRole) {
        console.log('seeding roles');
        const defaults = [
          { id: ROLE_IDS.ADMIN, name: 'Admin', description: 'Administrator', permissions: JSON.stringify([]) },
          { id: ROLE_IDS.MANAGER, name: 'Manager', description: 'Fleet manager', permissions: JSON.stringify([]) },
          { id: ROLE_IDS.DRIVER, name: 'Driver', description: 'Vehicle driver', permissions: JSON.stringify([]) },
        ];
        for (const r of defaults) {
          try {
            await storage.createRole?.(r as any);
          } catch (e) {
            console.error('failed to insert role', r, e);
          }
        }
      }

      const existingUsers = await storage.getUsers();
      if (existingUsers.length === 0) {
        console.log('seeding users');
        // Create admin user
        const adminPassword = hashPassword('admin123');
        try {
          const adminObj = {
            email: 'admin@fastag.com',
            password: adminPassword,
            name: 'Admin User',
            roleId: ROLE_IDS.ADMIN,
            fleetGroupId: null,
          };
          console.log('inserting admin user', adminObj);
          await storage.createUser(adminObj);
        } catch (e) {
          console.error('error inserting admin user', e);
        }

        // Create manager user
        const managerPassword = hashPassword('manager123');
        try {
          const mgrObj = {
            email: 'manager@fastag.com',
            password: managerPassword,
            name: 'Manager User',
            roleId: ROLE_IDS.MANAGER,
            fleetGroupId: null,
          };
          console.log('inserting manager user', mgrObj);
          await storage.createUser(mgrObj);
        } catch (e) {
          console.error('error inserting manager user', e);
        }
      }

      const existingVehicles = await storage.getVehicles();
      if (existingVehicles.length === 0) {
        const adminUser = await storage.getUserByEmail('admin@fastag.com');
        const adminId = adminUser?.id || 1;

        await storage.createVehicle({
          vehicleNumber: "KA-01-AB-1234",
          ownerName: "Rahul Sharma",
          model: "Toyota Innova",
          mileage: 45000,
          fastagBalance: 150, // Low balance example
          lastServiceDate: "2023-10-15",
          fleetGroupId: undefined,
          createdBy: adminId,
        });
        await storage.createVehicle({
          vehicleNumber: "MH-12-PQ-5678",
          ownerName: "Priya Patel",
          model: "Honda City",
          mileage: 32000,
          fastagBalance: 850,
          lastServiceDate: "2023-11-20",
          fleetGroupId: undefined,
          createdBy: adminId,
        });
        await storage.createVehicle({
          vehicleNumber: "DL-04-XYZ-9012",
          ownerName: "Amit Singh",
          model: "Maruti Swift",
          mileage: 12000,
          fastagBalance: 50, // Low balance example
          lastServiceDate: "2024-01-05",
          fleetGroupId: undefined,
          createdBy: adminId,
        });
      }
    } catch (err) {
      console.error("Error seeding database", err);
    }
  }

  // Run seeding
  await seedDatabase();

  return httpServer;
}