"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import {
  Fingerprint,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";

const formSchema = z.object({
  voterId: z.string().min(1, { message: "Voter ID is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"form" | "aadhar" | null>(null);
  const [isAadharLogin, setIsAadharLogin] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      voterId: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setLoginMethod("form");
    console.log(values);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      });
      router.push("/dashboard");
      setIsSubmitting(false);
      setLoginMethod(null);
    }, 1500);
  }

  function handleAadharLogin() {
    setIsAadharLogin(true);
    toast({
      title: "Aadhar OTP Sent",
      description: "Please enter the OTP sent to your registered mobile number.",
    });
  }

  function handleVerifyAadharOtp() {
    setIsSubmitting(true);
    setLoginMethod("aadhar");
    toast({
      title: "Verifying OTP...",
      description: "Please wait while we verify your Aadhar OTP.",
    });

    // Simulate Aadhar API call
    setTimeout(() => {
      toast({
        title: "Aadhar Login Successful",
        description: "Redirecting to your dashboard...",
      });
      router.push("/dashboard");
      // No need to reset state as we are redirecting.
    }, 2000);
  }

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
              {isAadharLogin
                ? "Verify your Aadhar OTP to login."
                : "Securely cast your vote. One person, one vote."}
            </p>
          </CardHeader>
          <CardContent>
            {isAadharLogin ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aadhar-otp">Enter OTP</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="aadhar-otp"
                      type="number"
                      placeholder="6-digit OTP"
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleVerifyAadharOtp}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting && loginMethod === "aadhar"
                    ? "Verifying..."
                    : "Verify & Login"}
                </Button>
                <Button
                  variant="link"
                  className="w-full"
                  onClick={() => setIsAadharLogin(false)}
                >
                  Cancel Aadhar Login
                </Button>
              </div>
            ) : (
              <>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="voterId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voter ID</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Enter your Voter ID"
                                {...field}
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                {...field}
                                className="pl-10 pr-10"
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting && loginMethod === "form"
                        ? "Signing In..."
                        : "Sign In"}
                    </Button>
                  </form>
                </Form>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleAadharLogin}
                    disabled={isSubmitting}
                  >
                    <Fingerprint className="mr-2 h-4 w-4" />
                    Login with Aadhar
                  </Button>
                </div>
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-primary hover:underline"
                  >
                    Register Now
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
