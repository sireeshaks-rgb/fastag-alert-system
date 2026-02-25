import { ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScannerUIProps {
  isScanning: boolean;
  className?: string;
}

export function ScannerUI({ isScanning, className }: ScannerUIProps) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-colors duration-300",
        isScanning ? "border-primary bg-primary/5" : "border-muted-foreground/30 bg-muted/20",
        className
      )}
    >
      {/* The animated scan line */}
      {isScanning && <div className="scanner-line" />}
      
      <div className={cn(
        "relative z-10 p-4 rounded-full mb-3 transition-colors duration-500",
        isScanning ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
      )}>
        <ScanLine className={cn("w-8 h-8", isScanning && "animate-pulse")} />
      </div>
      
      <h4 className={cn(
        "font-semibold text-sm transition-colors duration-300",
        isScanning ? "text-primary" : "text-muted-foreground"
      )}>
        {isScanning ? "Scanner Activated" : "Ready to Scan"}
      </h4>
      <p className="text-xs text-muted-foreground mt-1 text-center max-w-[200px]">
        {isScanning 
          ? "Processing fastag transaction securely..." 
          : "Scanner will activate during recharge"}
      </p>

      {/* Decorative corner markers */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/30 rounded-tl-sm m-2" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/30 rounded-tr-sm m-2" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/30 rounded-bl-sm m-2" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/30 rounded-br-sm m-2" />
    </div>
  );
}
