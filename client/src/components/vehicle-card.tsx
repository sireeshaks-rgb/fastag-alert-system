import { useState, useRef } from "react";
import { type VehicleResponse } from "@shared/routes";
import { useUpdateVehicle, useDeleteVehicle, useRechargeFastag } from "@/hooks/use-vehicles";
import { ScannerUI } from "./scanner-ui";
import { VehicleForm } from "./vehicle-form";
import { 
  AlertTriangle, 
  CarFront, 
  Edit2, 
  Trash2, 
  Wallet, 
  CalendarDays, 
  Gauge, 
  ChevronDown,
  Activity,
  IndianRupee,
  Wrench
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface VehicleCardProps {
  vehicle: VehicleResponse;
}

// Helper function to check if service is due (more than 6 months)
function isServiceDue(lastServiceDate: string): boolean {
  const lastService = new Date(lastServiceDate);
  const today = new Date();
  const sixMonthsAgo = new Date(today.setMonth(today.getMonth() - 6));
  return lastService < sixMonthsAgo;
}

// Get days since last service
function daysSinceService(lastServiceDate: string): number {
  const lastService = new Date(lastServiceDate);
  const today = new Date();
  const diffTime = today.getTime() - lastService.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Recharge State
  const [rechargeAmount, setRechargeAmount] = useState<string>("500");
  const rechargeInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const updateMutation = useUpdateVehicle();
  const deleteMutation = useDeleteVehicle();
  const rechargeMutation = useRechargeFastag();

  const handleRechargeFocus = () => {
    if (!isOpen) setIsOpen(true);
    setTimeout(() => {
      rechargeInputRef.current?.focus();
      rechargeInputRef.current?.select();
    }, 150);
  };

  const handleRecharge = () => {
    const amount = Number(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive number for recharge.",
        variant: "destructive"
      });
      return;
    }

    rechargeMutation.mutate(
      { id: vehicle.id, amount },
      {
        onSuccess: (data) => {
          toast({
            title: "Recharge Successful! 🎉",
            description: `₹${amount} added. New balance is ₹${data.fastagBalance}.`,
          });
          setRechargeAmount("500"); // Reset
        }
      }
    );
  };

  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className={cn(
          "bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/30 rounded-2xl shadow-lg transition-all duration-300",
          vehicle.isLowBalance && "border-red-500/50 shadow-red-500/20",
          isServiceDue(vehicle.lastServiceDate) && "border-orange-500/50",
          isOpen && "shadow-xl shadow-purple-500/20"
        )}
      >
        <div className="p-1">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full h-auto p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4 text-left">
                <div className={cn(
                  "p-3 rounded-xl",
                  vehicle.isLowBalance ? "bg-red-500/20 text-red-400" : "bg-purple-500/20 text-purple-400"
                )}>
                  <CarFront className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wide">{vehicle.vehicleNumber}</h3>
                  <p className="text-gray-400 text-sm flex items-center gap-1.5 mt-0.5">
                    <span className="font-medium">{vehicle.model}</span> • {vehicle.ownerName}
                  </p>
                </div>
              </div>

              <div className="flex flex-row sm:flex-row items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {vehicle.isLowBalance ? (
                  <Badge variant="destructive" className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 bg-red-500/20 text-red-400 border-red-500/50">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Low Balance
                  </Badge>
                ) : (
                  <Badge className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-green-400 bg-green-500/20 border-green-500/50">
                    Active
                  </Badge>
                )}

                {isServiceDue(vehicle.lastServiceDate) && (
                  <Badge className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border-orange-500/50 text-orange-400 bg-orange-500/20 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    Service Due
                  </Badge>
                )}
                
                <div className={cn(
                  "flex items-center gap-2 p-2 rounded-lg transition-transform duration-200",
                  isOpen && "rotate-180 bg-white/10"
                )}>
                  <ChevronDown className="w-5 h-5 text-purple-400" />
                </div>
              </div>
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="px-5 pb-5 pt-2 space-y-6 animate-in slide-in-from-top-2">
          {/* Warning Banner */}
          {vehicle.isLowBalance && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-400">Your Fastag balance is critically low.</h4>
                  <p className="text-sm text-red-400/80 mt-1">Please recharge immediately to avoid delays at toll plazas.</p>
                </div>
              </div>
              <Button 
                onClick={handleRechargeFocus}
                size="sm" 
                className="shrink-0 w-full sm:w-auto bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20"
              >
                Recharge Now
              </Button>
            </div>
          )}

          {/* Service Due Warning Banner */}
          {isServiceDue(vehicle.lastServiceDate) && (
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Wrench className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-400">Vehicle service is due!</h4>
                  <p className="text-sm text-orange-400/80 mt-1">Last serviced {daysSinceService(vehicle.lastServiceDate)} days ago. Please schedule a service appointment soon.</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vehicle Details */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-700/30 border border-purple-500/20">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Status</span>
                </div>
                <p className="font-medium text-white">Active Registry</p>
              </div>
              
              <div className="p-4 rounded-xl bg-slate-700/30 border border-purple-500/20">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Gauge className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Mileage</span>
                </div>
                <p className="font-medium text-white">{vehicle.mileage.toLocaleString()} km</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-700/30 border border-purple-500/20 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Last Service</span>
                </div>
                <div className="flex flex-col">
                  <p className="font-medium text-white">{vehicle.lastServiceDate}</p>
                  <p className={cn(
                    "text-xs mt-1",
                    isServiceDue(vehicle.lastServiceDate) ? "text-orange-400 font-semibold" : "text-gray-400"
                  )}>
                    {daysSinceService(vehicle.lastServiceDate)} days ago
                    {isServiceDue(vehicle.lastServiceDate) && " (Service Due)"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="col-span-2 sm:col-span-3 flex justify-start gap-3 mt-2 border-t border-purple-500/20 pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-white/30 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Vehicle
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-red-400 hover:bg-red-500/10 border-red-500/30"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </Button>
              </div>
            </div>

            {/* Recharge Section */}
            <div className="flex flex-col gap-4 p-5 rounded-2xl bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className={cn(
                    "w-5 h-5",
                    vehicle.isLowBalance ? "text-red-400" : "text-purple-400"
                  )} />
                  <span className="font-semibold text-sm uppercase tracking-wider text-white">Fastag Balance</span>
                </div>
                <span className={cn(
                  "font-bold text-2xl tracking-tight",
                  vehicle.isLowBalance ? "text-red-400" : "text-white"
                )}>
                  ₹{vehicle.fastagBalance}
                </span>
              </div>

              <ScannerUI isScanning={rechargeMutation.isPending} />

              <div className="flex gap-2 mt-auto">
                <div className="relative flex-1">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    ref={rechargeInputRef}
                    type="number"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="pl-9 bg-slate-900/50 border-purple-500/30 text-white"
                  />
                </div>
                <Button
                  onClick={handleRecharge}
                  disabled={rechargeMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {rechargeMutation.isPending ? "..." : "Pay"}
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl bg-slate-800 border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Vehicle: {vehicle.vehicleNumber}</DialogTitle>
          </DialogHeader>
          <VehicleForm
            defaultValues={vehicle}
            submitLabel="Update Details"
            isPending={updateMutation.isPending}
            onSubmit={(data) => {
              updateMutation.mutate(
                { id: vehicle.id, ...data },
                { onSuccess: () => setIsEditDialogOpen(false) }
              );
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-red-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete the vehicle <strong className="text-white">{vehicle.vehicleNumber}</strong> from the registry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-purple-500/30">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteMutation.mutate(vehicle.id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Vehicle"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
