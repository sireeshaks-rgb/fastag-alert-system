import { z } from 'zod';
import { insertVehicleSchema, vehicles } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
};

// Computed response that includes isLowBalance
export const vehicleResponseSchema = z.custom<typeof vehicles.$inferSelect & { isLowBalance: boolean }>();

export const api = {
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
  }
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
