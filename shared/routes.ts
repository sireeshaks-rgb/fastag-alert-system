import { z } from 'zod';
import { insertVehicleSchema, insertUserSchema, insertFleetGroupSchema, vehicles } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// Computed response that includes isLowBalance
export const vehicleResponseSchema = z.custom<typeof vehicles.$inferSelect & { isLowBalance: boolean }>();

export const userResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  roleId: z.number(),
  fleetGroupId: z.number().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const fleetGroupResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
});

export const auditLogResponseSchema = z.object({
  id: z.number(),
  userId: z.number(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.number(),
  changes: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.date(),
});

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      responses: {
        200: z.object({
          user: userResponseSchema,
          token: z.string(),
        }),
        401: errorSchemas.unauthorized,
        400: errorSchemas.validation,
      },
    },
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema,
      responses: {
        201: userResponseSchema,
        400: errorSchemas.validation,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        204: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: userResponseSchema,
        401: errorSchemas.unauthorized,
      },
    },
  },
  vehicles: {
    list: {
      method: 'GET' as const,
      path: '/api/vehicles' as const,
      input: z.object({
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(vehicleResponseSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/vehicles/:id' as const,
      responses: {
        200: vehicleResponseSchema,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/vehicles' as const,
      input: insertVehicleSchema,
      responses: {
        201: vehicleResponseSchema,
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/vehicles/:id' as const,
      input: insertVehicleSchema.partial(),
      responses: {
        200: vehicleResponseSchema,
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/vehicles/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    recharge: {
      method: 'POST' as const,
      path: '/api/vehicles/:id/recharge' as const,
      input: z.object({ amount: z.number().positive() }),
      responses: {
        200: vehicleResponseSchema,
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    }
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users' as const,
      responses: {
        200: z.array(userResponseSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/users/:id' as const,
      responses: {
        200: userResponseSchema,
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/users/:id' as const,
      input: insertUserSchema.partial(),
      responses: {
        200: userResponseSchema,
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/users/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  fleetGroups: {
    list: {
      method: 'GET' as const,
      path: '/api/fleet-groups' as const,
      responses: {
        200: z.array(fleetGroupResponseSchema),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/fleet-groups' as const,
      input: insertFleetGroupSchema,
      responses: {
        201: fleetGroupResponseSchema,
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/fleet-groups/:id' as const,
      input: insertFleetGroupSchema.partial(),
      responses: {
        200: fleetGroupResponseSchema,
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/fleet-groups/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  auditLogs: {
    list: {
      method: 'GET' as const,
      path: '/api/audit-logs' as const,
      input: z.object({
        entityType: z.string().optional(),
        entityId: z.number().optional(),
        limit: z.number().optional(),
      }).optional(),
      responses: {
        200: z.array(auditLogResponseSchema),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type VehicleResponse = z.infer<typeof api.vehicles.get.responses[200]>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type FleetGroupResponse = z.infer<typeof fleetGroupResponseSchema>;
export type AuditLogResponse = z.infer<typeof auditLogResponseSchema>;
