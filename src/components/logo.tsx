import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-lg font-bold",
        className
      )}
    >
      <div className="relative">
        <ShieldCheck className="h-7 w-7 text-primary relative z-10" />
        <div className="absolute inset-0 bg-primary/40 blur-lg rounded-full" />
      </div>
      <span className="text-2xl font-black tracking-tighter text-foreground italic glow-text">
        OOTU
      </span>
    </div>
  );
}