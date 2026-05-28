'use client';

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

/**
 * @fileOverview OOTU Protocol Logo Component.
 * Uses a mounting check to prevent hydration mismatches with complex CSS glow effects.
 */
export function Logo({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-lg font-bold",
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        <ShieldCheck className="h-7 w-7 text-primary relative z-10" />
        {mounted && (
          <div className="absolute inset-0 bg-primary/40 blur-lg rounded-full" />
        )}
      </div>
      <span className="text-2xl font-black tracking-tighter text-foreground italic glow-text">
        OOTU
      </span>
    </div>
  );
}
