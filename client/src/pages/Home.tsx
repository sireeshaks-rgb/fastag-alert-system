import { useState } from "react";
import { useVehicles, useCreateVehicle } from "@/hooks/use-vehicles";
import { VehicleCard } from "@/components/vehicle-card";
import { VehicleForm } from "@/components/vehicle-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Search, 
  Car, 
  AlertCircle, 
  LayoutDashboard 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const { data: vehicles, isLoading } = useVehicles(searchTerm);
  const createMutation = useCreateVehicle();

  // Computed metrics
  const totalVehicles = vehicles?.length || 0;
  const lowBalanceCount = vehicles?.filter(v => v.isLowBalance).length || 0;

  return (
    <div className="min-h-screen pb-20">
      {/* Premium Hero Section */}
      <div className="relative bg-black dark:bg-zinc-950 text-white overflow-hidden pb-12 pt-16 sm:pt-24 px-4 sm:px-6 lg:px-8">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 inset-x-0 h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] rounded-full bg-primary/20 blur-[120px] mix-blend-screen opacity-50" />
          <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-blue-600/20 blur-[100px] mix-blend-screen opacity-40" />
        </div>

        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6 text-sm font-medium">
              <LayoutDashboard className="w-4 h-4 text-primary" />
              <span>Fleet Management Portal</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-tight">
              Vehicle <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">Registry</span> System
            </h1>
            <p className="mt-4 text-lg text-zinc-400 max-w-xl">
              Manage your fleet, track mileage, and automate Fastag recharges from one centralized command center.
            </p>
          </div>

          {/* Key Metrics Cards */}
          <div className="flex gap-4 w-full md:w-auto">
            <div className="glass-card flex-1 md:w-40 p-5 rounded-2xl border-white/10 text-white flex flex-col items-center justify-center">
              <div className="p-3 bg-white/10 rounded-full mb-3">
                <Car className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-3xl font-bold font-display">{isLoading ? "-" : totalVehicles}</p>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mt-1">Total Fleet</p>
            </div>
            
            <div className="glass-card flex-1 md:w-40 p-5 rounded-2xl border-destructive/30 bg-destructive/10 text-white flex flex-col items-center justify-center">
              <div className="p-3 bg-destructive/20 rounded-full mb-3">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <p className="text-3xl font-bold font-display text-destructive">{isLoading ? "-" : lowBalanceCount}</p>
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mt-1">Low Balance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-card rounded-2xl p-4 shadow-xl border border-border/50 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search by vehicle number, model, or owner..." 
              className="pl-11 pr-4 py-6 text-base bg-muted/50 border-transparent focus:bg-background rounded-xl w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            size="lg" 
            className="w-full sm:w-auto py-6 px-8 rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Vehicle
          </Button>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold font-display mb-6">Registered Vehicles</h2>
          
          <div className="space-y-4">
            {isLoading ? (
              // Loading Skeletons
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border rounded-2xl p-5 flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              ))
            ) : vehicles?.length === 0 ? (
              // Empty State
              <div className="text-center py-20 px-4 rounded-3xl border-2 border-dashed border-border bg-muted/10">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No vehicles found</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  {searchTerm 
                    ? `No results for "${searchTerm}". Try a different search term.` 
                    : "Your registry is empty. Add your first vehicle to start tracking."}
                </p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              // Vehicle List
              vehicles?.map(vehicle => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Register New Vehicle</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <VehicleForm 
              isPending={createMutation.isPending}
              onSubmit={(data) => {
                createMutation.mutate(data, {
                  onSuccess: () => setIsAddDialogOpen(false)
                });
              }} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
