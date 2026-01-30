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
  WalletCards,
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
import { auth } from "@/firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

const formSchema = z.object({
  voterId: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"form" | "aadhar" | "metamask" | null>(null);
  const [aadharLoginState, setAadharLoginState] = useState<'none' | 'enterNumber' | 'enterOtp'>('none');
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      voterId: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setLoginMethod("form");
    
    try {
      await signInWithEmailAndPassword(auth, values.voterId, values.password);
      toast({
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Firebase Login Error: ", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
      setLoginMethod(null);
    }
  }

  function handleAadharLoginClick() {
    setAadharLoginState('enterNumber');
  }

  function handleSendAadharOtp() {
    setIsSubmitting(true);
    // Simulate sending OTP
    setTimeout(() => {
        toast({
            title: "Aadhar OTP Sent",
            description: "Please enter the OTP sent to your registered mobile number.",
        });
        setAadharLoginState('enterOtp');
        setIsSubmitting(false);
    }, 1000);
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
        description: "Redirecting to the voting booth...",
      });
      router.push("/dashboard/vote");
      // No need to reset state as we are redirecting.
    }, 2000);
  }

  async function handleMetamaskLogin() {
    setIsSubmitting(true);
    setLoginMethod("metamask");

    if (typeof (window as any).ethereum === 'undefined') {
        toast({
            variant: "destructive",
            title: "MetaMask Not Found",
            description: "Please install the MetaMask browser extension to use this feature.",
        });
        setIsSubmitting(false);
        setLoginMethod(null);
        return;
    }

    try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
            toast({
                title: "MetaMask Connected",
                description: `Connected with address: ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`,
            });
            // Redirect after a short delay
            setTimeout(() => {
                router.push("/dashboard/vote");
            }, 1500);
        }
    } catch (error: any) {
        if (error.code === 4001) {
            toast({
                variant: "destructive",
                title: "Connection Rejected",
                description: "You rejected the connection request in MetaMask.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Connection Failed",
                description: "An error occurred while connecting to MetaMask.",
            });
        }
        setIsSubmitting(false);
        setLoginMethod(null);
    }
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
              {aadharLoginState === 'enterNumber'
                ? 'Enter your Aadhar number to receive an OTP.'
                : aadharLoginState === 'enterOtp'
                ? 'Verify your Aadhar OTP to login.'
                : 'Securely cast your vote. One person, one vote.'}
            </p>
          </CardHeader>
          <CardContent>
            {aadharLoginState === 'none' ? (
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
                          <FormLabel>Voter ID (Email)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Enter your registered email"
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
                    onClick={handleMetamaskLogin}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && loginMethod === "metamask" ? (
                        "Connecting..."
                    ) : (
                        <>
                            <WalletCards className="mr-2 h-4 w-4" />
                            Login with MetaMask
                        </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleAadharLoginClick}
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
            ) : aadharLoginState === 'enterNumber' ? (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="aadhar-number">Aadhar Number</Label>
                        <div className="relative">
                            <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="aadhar-number" type="number" placeholder="Enter 12-digit Aadhar" className="pl-10" />
                        </div>
                    </div>
                    <Button onClick={handleSendAadharOtp} className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Sending OTP..." : "Send OTP"}
                    </Button>
                    <Button variant="link" className="w-full" onClick={() => setAadharLoginState('none')}>
                        Cancel
                    </Button>
                </div>
            ) : ( // aadharLoginState === 'enterOtp'
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
                  onClick={() => setAadharLoginState('none')}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
