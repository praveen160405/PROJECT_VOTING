"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Key, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/firebase";


const loginSchema = z.object({
  voterId: z.string().min(1, "Voter ID is required."),
  password: z.string().min(1, "Password is required."),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      voterId: "",
      password: "",
    },
  });

  const { formState } = form;

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    toast({
      title: "Logging In...",
      description: "Please wait while we verify your credentials.",
    });

    try {
      const emailForAuth = `${values.voterId}@ootu.app`;
      await signInWithEmailAndPassword(auth, emailForAuth, values.password);
      toast({
        title: "Login Successful!",
        description: "Redirecting you to the dashboard.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login Error:", error);
      let description = "An unexpected error occurred.";
      // Generic error for auth failures to avoid user enumeration
      if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(error.code)) {
        description = "Invalid Voter ID or password. Please try again.";
      } else if (error.message) {
        description = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: description,
      });
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="glassmorphic-card shadow-2xl">
          <CardHeader className="items-center text-center p-6">
            <Link href="/" className="mb-4">
              <Logo />
            </Link>
            <CardTitle className="text-3xl font-bold tracking-tight">
              Voter Sign In
            </CardTitle>
            <CardDescription className="text-muted-foreground pt-2">
              Enter your Voter ID and password to access the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="voterId"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="voterId">Voter ID</Label>
                      <div className="relative">
                         <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input id="voterId" placeholder="Enter your Voter ID" {...field} className="pl-10" />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                       <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link href="#" className="text-sm font-medium text-primary hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input id="password" type="password" placeholder="••••••••" {...field} className="pl-10" />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
                   {formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="p-6 pt-0">
             <p className="w-full text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Register
                </Link>
              </p>
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  );
}
