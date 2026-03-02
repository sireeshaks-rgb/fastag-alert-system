import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type VehicleResponse } from "@shared/routes";
import { type InsertVehicle } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "./use-auth";

function getAuthHeaders(token: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Fetch all vehicles
export function useVehicles(search?: string) {
  const { token, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: [api.vehicles.list.path, search, token],
    queryFn: async () => {
      const url = new URL(api.vehicles.list.path, window.location.origin);
      if (search) url.searchParams.append("search", search);
      
      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(token),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      
      const data = await res.json();
      return api.vehicles.list.responses[200].parse(data);
    },
    enabled: !authLoading, // Don't fetch until auth is loaded
  });
}

// Fetch single vehicle
export function useVehicle(id: number) {
  const { token } = useAuth();

  return useQuery({
    queryKey: [api.vehicles.get.path, id, token],
    queryFn: async () => {
      const url = buildUrl(api.vehicles.get.path, { id });
      const res = await fetch(url, {
        headers: getAuthHeaders(token),
        credentials: "include"
      });
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch vehicle");
      
      const data = await res.json();
      return api.vehicles.get.responses[200].parse(data);
    },
  });
}

// Create new vehicle
export function useCreateVehicle() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: async (data: InsertVehicle) => {
      const res = await fetch(api.vehicles.create.path, {
        method: api.vehicles.create.method,
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.vehicles.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create vehicle");
      }
      
      return api.vehicles.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.vehicles.list.path] });
    },
  });
}

// Update vehicle
export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertVehicle>) => {
      const url = buildUrl(api.vehicles.update.path, { id });
      const res = await fetch(url, {
        method: api.vehicles.update.method,
        headers: getAuthHeaders(token),
        body: JSON.stringify(updates),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.vehicles.update.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to update vehicle");
      }
      
      return api.vehicles.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.vehicles.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.vehicles.get.path, variables.id] });
    },
  });
}

// Delete vehicle
export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.vehicles.delete.path, { id });
      const res = await fetch(url, {
        method: api.vehicles.delete.method,
        headers: getAuthHeaders(token),
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete vehicle");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.vehicles.list.path] });
    },
  });
}

// Recharge Fastag
export function useRechargeFastag() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, amount }: { id: number; amount: number }) => {
      const url = buildUrl(api.vehicles.recharge.path, { id });
      const res = await fetch(url, {
        method: api.vehicles.recharge.method,
        headers: getAuthHeaders(token),
        body: JSON.stringify({ amount }),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.vehicles.recharge.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to recharge vehicle fastag");
      }
      
      return api.vehicles.recharge.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.vehicles.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.vehicles.get.path, variables.id] });
    },
  });
}
