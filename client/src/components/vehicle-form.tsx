import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVehicleSchema, type InsertVehicle } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { type VehicleResponse } from "@shared/routes";

// We extend the base schema to handle string-to-number coercion from HTML inputs
const formSchema = insertVehicleSchema.extend({
  mileage: z.coerce.number().min(0, "Mileage cannot be negative"),
  fastagBalance: z.coerce.number().min(0, "Balance cannot be negative"),
});

type FormValues = z.infer<typeof formSchema>;

interface VehicleFormProps {
  defaultValues?: Partial<VehicleResponse>;
  onSubmit: (data: InsertVehicle) => void;
  isPending: boolean;
  submitLabel?: string;
}

export function VehicleForm({ defaultValues, onSubmit, isPending, submitLabel = "Save Vehicle" }: VehicleFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleNumber: defaultValues?.vehicleNumber || "",
      ownerName: defaultValues?.ownerName || "",
      model: defaultValues?.model || "",
      mileage: defaultValues?.mileage || 0,
      fastagBalance: defaultValues?.fastagBalance || 0,
      lastServiceDate: defaultValues?.lastServiceDate || new Date().toISOString().split("T")[0],
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="vehicleNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. MH-01-AB-1234" {...field} className="uppercase bg-white dark:bg-zinc-900" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ownerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Owner Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. John Doe" {...field} className="bg-white dark:bg-zinc-900" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle Model</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Honda City" {...field} className="bg-white dark:bg-zinc-900" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mileage (km)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} className="bg-white dark:bg-zinc-900" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fastagBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Fastag Balance (₹)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} className="bg-white dark:bg-zinc-900" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastServiceDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Service Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="bg-white dark:bg-zinc-900" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <Button 
            type="submit" 
            disabled={isPending}
            className="w-full sm:w-auto px-8 py-6 rounded-xl font-semibold shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all"
          >
            {isPending ? "Processing..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
