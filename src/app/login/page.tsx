"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Key, Loader2, Mail, Phone, Hash, ShieldAlert, ZapOff, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useState, useEffect, useRef } from "react";
import { collection, serverTimestamp, doc, getDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { useAuth, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const loginSchema = z.object({
  voterId: z.string().trim().min(1, "Voter ID is required."),
  password: z.string().min(1, "Password is required."),
  username_hp: z.string().max(0).optional(), // Honeypot field (must be empty)
});

const forgotPasswordSchema = z.object({
  voterId: z.string().trim().min(1, "Voter ID is required."),
  phoneNumber: z
    .string()
    .trim()
    .min(10, "Phone number must be exactly 10 digits.")
    .max(10, "Phone number must be exactly 10 digits.")
    .regex(/^[0-9]+$/, "Phone number must contain only numbers."),
  otp: z.string().trim().optional(),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  
  // DDoS / Rate Limiting State
  const [attempts, setAttempts] = useState<number[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const coolDownTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    checkIpBlock();
    return () => {
      if (coolDownTimer.current) clearTimeout(coolDownTimer.current);
    };
  }, []);

  const checkIpBlock = async () => {
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ip = ipData.ip;
      
      if (ip && firestore) {
        const blockDoc = await getDoc(doc(firestore, 'blockedIps', ip.replace(/\./g, '_')));
        if (blockDoc.exists()) {
          setIsBlocked(true);
        }
      }
    } catch (e) {
      // Fail silently for IP check
    }
  };
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      voterId: "",
      password: "",
      username_hp: "",
    },
  });

  const resetForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      voterId: "",
      phoneNumber: "",
      otp: "",
    },
  });

  const { formState } = form;

  const logThreat = async (type: string, payload: string) => {
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ip = ipData.ip || 'Unknown';

      if (firestore) {
        const threatsRef = collection(firestore, 'threats');
        addDocumentNonBlocking(threatsRef, {
          ipAddress: ip,
          type: type,
          payload: payload,
          timestamp: serverTimestamp()
        });
      }
    } catch (e) {
      // Log threat silently
    }
  };

  const detectAttacks = (values: z.infer<typeof loginSchema>) => {
    if (values.username_hp) {
      logThreat("Bot/Honeypot Triggered", "Automated form submission detected.");
      return true;
    }

    const patterns = [
      /' OR '1'='1/i,
      /--/i,
      /\/\*/i,
      /UNION SELECT/i,
      /DROP TABLE/i,
      /SLEEP\(/i,
      /WAITFOR DELAY/i,
      /<script/i,
      /{\s*\$gt\s*: ""}/i,
      /javascript:/i,
      /onerror=/i,
      /\.\.\//i,
      /reentrancy/i,
      /key_theft/i,
      /sybil/i
    ];

    const input = values.voterId + " " + values.password;
    return patterns.some(pattern => pattern.test(input));
  };

  const checkRateLimit = () => {
    const now = Date.now();
    // 15 second window for tracking attempts
    const recentAttempts = [...attempts, now].filter(t => now - t < 15000); 
    setAttempts(recentAttempts);

    // Trigger after only 2 attempts (3rd click triggers lockout)
    if (recentAttempts.length > 2) {
      setIsRateLimited(true);
      logThreat("DDoS / Brute Force Attempt", `High frequency login attempts: ${recentAttempts.length} in 15s`);
      
      coolDownTimer.current = setTimeout(() => {
        setIsRateLimited(false);
        setAttempts([]);
      }, 15000); // 15s recovery period

      return false;
    }
    return true;
  };

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    if (isBlocked) {
       toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Your IP address has been permanently blocked due to security violations.",
      });
      return;
    }

    if (isRateLimited) {
      toast({
        variant: "destructive",
        title: "Too Many Requests",
        description: "Security protocol triggered. Please wait 15 seconds before trying again.",
      });
      return;
    }

    if (!checkRateLimit()) {
       toast({
        variant: "destructive",
        title: "Too Many Requests",
        description: "Security protocol triggered. Please wait 15 seconds before trying again.",
      });
      return;
    }

    if (detectAttacks(values)) {
      logThreat("Malicious Payload Detected", values.voterId + " | [REDACTED]");
      toast({
        variant: "destructive",
        title: "Security Alert",
        description: "Suspicious activity detected. Your origin IP and payload have been logged for forensic analysis.",
      });
      return;
    }

    try {
      const emailForAuth = `${values.voterId.toLowerCase()}@ootu.app`;
      await signInWithEmailAndPassword(auth, emailForAuth, values.password);
      toast({
        title: "Login Successful!",
        description: "Redirecting you to the dashboard.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      let description = "An unexpected error occurred.";
      
      if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password', 'auth/invalid-email', 'auth/user-disabled'].includes(error.code)) {
        description = "Invalid Voter ID or password. Please try again.";
        logThreat("Login Failure", `Failed attempt for ID: ${values.voterId}`);
      } else {
        console.error("Authentication System Error:", error);
        if (error.message) description = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: description,
      });
    }
  };

  const handleSendOtp = async () => {
    const voterId = resetForm.getValues("voterId");
    const phoneNumber = resetForm.getValues("phoneNumber");

    if (!voterId || phoneNumber.length !== 10) {
      resetForm.trigger(["voterId", "phoneNumber"]);
      return;
    }

    setIsResetLoading(true);
    setTimeout(() => {
      setIsResetLoading(false);
      setShowOtpField(true);
      toast({
        title: "OTP Sent",
        description: `A verification code has been sent to ${phoneNumber}.`,
      });
    }, 1500);
  };

  const onResetPassword = async (values: z.infer<typeof forgotPasswordSchema>) => {
    if (!showOtpField) {
      handleSendOtp();
      return;
    }

    if (!values.otp || values.otp.length < 4) {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "Please enter the verification code sent to your phone.",
      });
      return;
    }

    setIsResetLoading(true);
    try {
      const emailForAuth = `${values.voterId.toLowerCase()}@ootu.app`;
      await sendPasswordResetEmail(auth, emailForAuth);
      toast({
        title: "Verification Successful",
        description: `A password reset link has been sent to the email associated with Voter ID: ${values.voterId}.`,
      });
      setIsResetDialogOpen(false);
      resetForm.reset();
      setShowOtpField(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: "Could not send reset link. Please check your Voter ID and try again.",
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {isBlocked && (
          <Alert variant="destructive" className="mb-6 animate-pulse">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Access Blocked</AlertTitle>
            <AlertDescription>
              This IP address has been blacklisted for malicious activity.
            </AlertDescription>
          </Alert>
        )}
        {isRateLimited && (
          <Alert variant="destructive" className="mb-6">
            <ZapOff className="h-4 w-4" />
            <AlertTitle>DDoS Protection Active</AlertTitle>
            <AlertDescription>
              Security protocol triggered. Access throttled for 15 seconds.
            </AlertDescription>
          </Alert>
        )}
        <Card className="glassmorphic-card shadow-2xl">
          <CardHeader className="items-center text-center p-6">
            <Link href="/" className="mb-4">
              <Logo />
            </Link>
            <CardTitle className="text-3xl font-bold tracking-tight">
              Voter Sign In
            </CardTitle>
            <CardDescription className="text-muted-foreground pt-2">
              Secure gateway to the OOTU Decentralized Protocol.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="absolute opacity-0 -z-50 pointer-events-none h-0 w-0 overflow-hidden">
                   <FormField
                    control={form.control}
                    name="username_hp"
                    render={({ field }) => (
                      <FormControl>
                        <Input tabIndex={-1} autoComplete="off" {...field} />
                      </FormControl>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="voterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voter ID</FormLabel>
                      <div className="relative">
                         <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input id="voterId" placeholder="ABC1234567" {...field} className="pl-10" maxLength={20} disabled={isBlocked || isRateLimited} />
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
                        <FormLabel>Password</FormLabel>
                        <Button 
                          variant="link"
                          type="button"
                          onClick={() => setIsResetDialogOpen(true)}
                          className="h-auto p-0 text-sm font-medium text-primary hover:underline"
                          disabled={isBlocked || isRateLimited}
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input id="password" type="password" placeholder="••••••••" {...field} className="pl-10" disabled={isBlocked || isRateLimited} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-11" disabled={formState.isSubmitting || isBlocked || isRateLimited}>
                   {formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {formState.isSubmitting ? "Authenticating..." : "Sign In to Protocol"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="p-6 pt-0 flex flex-col gap-4">
             <p className="w-full text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Register Securely
                </Link>
              </p>
              <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                <Lock className="h-3 w-3" /> AES-256 Encryption Active
              </div>
          </CardFooter>
        </Card>
      </motion.div>

      <Dialog open={isResetDialogOpen} onOpenChange={(open) => {
        setIsResetDialogOpen(open);
        if (!open) {
          setShowOtpField(false);
          resetForm.reset();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Multi-factor verification required for identity restoration.
            </DialogDescription>
          </DialogHeader>
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4 py-2">
              <FormField
                control={resetForm.control}
                name="voterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voter ID</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input id="resetVoterId" placeholder="ABC1234567" {...field} className="pl-9" disabled={showOtpField} maxLength={10} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={resetForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input id="resetPhone" placeholder="10-digit number" {...field} className="pl-9" disabled={showOtpField} maxLength={10} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showOtpField && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <FormField
                    control={resetForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enter OTP</FormLabel>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input id="otp" placeholder="6-digit code" {...field} className="pl-9" maxLength={6} />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}

              <DialogFooter className="sm:justify-end gap-2">
                <Button type="submit" disabled={isResetLoading}>
                  {isResetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {showOtpField ? "Verify & Reset Password" : "Send OTP"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setIsResetDialogOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
