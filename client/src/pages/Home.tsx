import { useState } from "react";
import { useLocation } from "wouter";
import { useVehicles, useCreateVehicle } from "@/hooks/use-vehicles";
import { useAuth } from "@/hooks/use-auth";
import { VehicleCard } from "@/components/vehicle-card";
import { VehicleForm } from "@/components/vehicle-form";
import { UsersManagement } from "@/components/users-management";
import { AuditLogs } from "@/components/audit-logs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Car, 
  AlertCircle, 
  LayoutDashboard,
  LogOut,
  User,
  BarChart3,
  Users,
  Wrench,
  Activity
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Helper function to check if service is due (more than 6 months)
function isServiceDue(lastServiceDate: string): boolean {
  const lastService = new Date(lastServiceDate);
  const today = new Date();
  const sixMonthsAgo = new Date(today.setMonth(today.getMonth() - 6));
  return lastService < sixMonthsAgo;
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("vehicles");
  const [, navigate] = useLocation();

  const { user, logout, token } = useAuth();
  const { data: vehicles, isLoading } = useVehicles(searchTerm);
  const createMutation = useCreateVehicle();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Computed metrics
  const totalVehicles = vehicles?.length || 0;
  const lowBalanceCount = vehicles?.filter(v => v.isLowBalance).length || 0;
  const serviceDueCount = vehicles?.filter(v => isServiceDue(v.lastServiceDate)).length || 0;

  const getRoleLabel = (roleId: number) => {
    const roles: Record<number, string> = {
      1: 'Admin',
      2: 'Manager',
      3: 'Driver',
    };
    return roles[roleId] || 'User';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-md border-b border-purple-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">FastTag Fleet</span>
              <p className="text-xs text-gray-400">Smart Vehicle Management</p>
            </div>
          </div>
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/10 hover:text-white">
                  <User className="w-4 h-4" />
                  <span>{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-purple-500/30">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-semibold text-white">{user.email}</p>
                  <p className="text-xs text-gray-400">{getRoleLabel(user.roleId)}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Hero Section with Stats */}
      <div className="relative overflow-hidden pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Fleet <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Dashboard</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Monitor your vehicles in real-time, track fastag balance, and manage maintenance</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/30 rounded-2xl p-6 hover:border-purple-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-semibold uppercase">Total Fleet</p>
                  <p className="text-3xl font-bold text-white mt-2">{isLoading ? "-" : totalVehicles}</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                  <Car className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className="mt-4 h-1 bg-gradient-to-r from-purple-500 to-transparent rounded-full" />
            </div>

            <div className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-red-500/30 rounded-2xl p-6 hover:border-red-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-semibold uppercase">Low Balance</p>
                  <p className="text-3xl font-bold text-red-400 mt-2">{isLoading ? "-" : lowBalanceCount}</p>
                </div>
                <div className="p-3 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
              </div>
              <div className="mt-4 h-1 bg-gradient-to-r from-red-500 to-transparent rounded-full" />
            </div>

            <div className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-orange-500/30 rounded-2xl p-6 hover:border-orange-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-semibold uppercase">Service Due</p>
                  <p className="text-3xl font-bold text-orange-400 mt-2">{isLoading ? "-" : serviceDueCount}</p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors">
                  <Wrench className="w-6 h-6 text-orange-400" />
                </div>
              </div>
              <div className="mt-4 h-1 bg-gradient-to-r from-orange-500 to-transparent rounded-full" />
            </div>

            <div className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-green-500/30 rounded-2xl p-6 hover:border-green-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-semibold uppercase">Active Status</p>
                  <p className="text-3xl font-bold text-green-400 mt-2">{isLoading ? "-" : totalVehicles - lowBalanceCount}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                  <Activity className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="mt-4 h-1 bg-gradient-to-r from-green-500 to-transparent rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Search and Add Vehicle - Only show on vehicles tab */}
        {activeTab === "vehicles" && (
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-purple-500/20 flex flex-col sm:flex-row items-center gap-4 mb-8">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <Input 
                placeholder="Search vehicles..." 
                className="pl-12 pr-4 py-3 bg-slate-900/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500 focus:bg-slate-900 rounded-xl w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/30 rounded-xl"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Vehicle
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full gap-0 bg-slate-800/50 border border-purple-500/20 rounded-xl p-1" style={{ gridTemplateColumns: `repeat(${(user?.roleId === 1 ? 3 : user?.roleId === 2 ? 2 : 1)}, 1fr)` }}>
            <TabsTrigger value="vehicles" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white gap-2">
              <Car className="w-4 h-4" />
              <span className="hidden sm:inline">Vehicles</span>
            </TabsTrigger>
            {(user?.roleId === 1 || user?.roleId === 2) && (
              <TabsTrigger value="logs" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Audit Logs</span>
              </TabsTrigger>
            )}
            {user?.roleId === 1 && (
              <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles" className="mt-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Your Fleet</h2>
                <span className="text-sm text-gray-400">{vehicles?.length || 0} vehicles</span>
              </div>
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-slate-800/50 border border-purple-500/20 rounded-2xl p-5 animate-pulse">
                      <div className="h-6 bg-slate-700 rounded w-1/3 mb-4" />
                      <div className="h-4 bg-slate-700 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : vehicles?.length === 0 ? (
                <div className="text-center py-20 px-4 rounded-3xl border-2 border-dashed border-purple-500/30 bg-slate-800/20">
                  <div className="bg-purple-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Car className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No vehicles found</h3>
                  <p className="text-gray-400 max-w-md mx-auto mb-6">
                    {searchTerm 
                      ? `No results for "${searchTerm}". Try a different search term.` 
                      : "Your fleet is empty. Add your first vehicle to start tracking."}
                  </p>
                  {searchTerm && (
                    <Button variant="outline" onClick={() => setSearchTerm("")} className="border-purple-500/30">
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {vehicles?.map(vehicle => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Audit Logs Tab */}
          {(user?.roleId === 1 || user?.roleId === 2) && (
            <TabsContent value="logs" className="mt-8">
              <AuditLogs />
            </TabsContent>
          )}

          {/* Users Management Tab */}
          {user?.roleId === 1 && (
            <TabsContent value="users" className="mt-8">
              <UsersManagement />
            </TabsContent>
          )}
        </Tabs>
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
