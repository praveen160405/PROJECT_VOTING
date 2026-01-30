"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { initialUsers } from "@/lib/data";
import type { User as UserType } from "@/lib/types";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voterId, setVoterId] = useState("");
  const [password, setPassword] = useState("");
  
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const voterIdRegex = /^[a-zA-Z]{3}[0-9]{7}$/;
    if (!voterId || !password) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter both Voter ID and password.",
      });
      return;
    }

    if (!voterIdRegex.test(voterId)) {
      toast({
        variant: "destructive",
        title: "Invalid Voter ID Format",
        description: "Voter ID must be 3 letters followed by 7 numbers (e.g., ABC1234567).",
      });
      return;
    }

    setIsSubmitting(true);
    toast({
      title: "Signing In...",
      description: "Please wait.",
    });

    // Simulate network delay and check credentials
    setTimeout(() => {
      const storedUsersJSON = localStorage.getItem("verityvote_users");
      const users: UserType[] = storedUsersJSON ? JSON.parse(storedUsersJSON) : initialUsers;
      const userExists = users.some(user => user.voterId.toLowerCase() === voterId.toLowerCase());

      if (userExists) {
        toast({
          title: "Login Successful",
          description: "Redirecting to your dashboard...",
        });
        router.push("/dashboard");
      } else {
        setIsSubmitting(false);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Voter ID not found. Please register first.",
        });
      }
    }, 1500);
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md glassmorphic-card shadow-2xl">
          <CardHeader className="items-center text-center">
            <Logo className="mb-2" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome to VerityVote
            </h1>
            <p className="text-muted-foreground">
              Securely cast your vote. One person, one vote.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voterId">Voter ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="voterId"
                    placeholder="e.g. ABC1234567"
                    value={voterId}
                    onChange={(e) => setVoterId(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-primary hover:underline"
              >
                Register Now
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
