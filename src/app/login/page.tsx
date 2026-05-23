
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Loader2, ShieldAlert, ZapOff, Lock, Fingerprint, Camera, ShieldCheck, Zap, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState, useEffect, useRef } from "react";
import { collection, serverTimestamp, doc, getDoc, query, where, getDocs, limit } from "firebase/firestore";

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
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { useAuth, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { verifyBiometric } from "@/ai/flows/verify-biometric-flow";

const loginSchema = z.object({
  voterId: z.string().trim().min(10, "Voter ID must be 10 characters.").max(10, "Voter ID must be 10 characters."),
  password: z.string().min(1, "Password is required."),
  username_hp: z.string().optional(), // Honeypot field
});

type LoginStep = 'credentials' | 'biometric';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const [step, setStep] = useState<LoginStep>('credentials');
  const [profile, setProfile] = useState<any>(null);
  
  const [isMounted, setIsMounted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isVerifyingBiometric, setIsVerifyingBiometric] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    checkIpBlock();
  }, []);

  useEffect(() => {
    if (step === 'biometric' && !hasCameraPermission) {
      getCameraPermission();
    }
  }, [step, hasCameraPermission]);

  const getCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      setHasCameraPermission(false);
      toast({
        variant: "destructive",
        title: "Camera Access Denied",
        description: "Camera is required for biometric identity verification.",
      });
    }
  };

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
      // Fail silent
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

        // Auto-block if bot or high threat
        if (type.includes("Bot") || type.includes("DDoS")) {
          const blockRef = doc(firestore, 'blockedIps', ip.replace(/\./g, '_'));
          addDocumentNonBlocking(collection(firestore, 'blockedIps'), {
             ip,
             reason: `Automated threat detected: ${type}`,
             timestamp: serverTimestamp()
          });
          setIsBlocked(true);
        }
      }
    } catch (e) {
      // Fail silent
    }
  };

  const handleCredentialSubmit = async (values: z.infer<typeof loginSchema>) => {
    if (isBlocked) return;

    // Honeypot check
    if (values.username_hp) {
      await logThreat("Bot Honeypot Triggered", `Honeypot field filled: ${values.username_hp}`);
      return;
    }

    // Rate limiting
    if (failedAttempts >= 5) {
       await logThreat("DDoS / Brute Force Attempt", `Origin reached max failed attempts: ${failedAttempts}`);
       toast({
         variant: "destructive",
         title: "Security Lockout",
         description: "Too many failed attempts. Your IP has been flagged for audit.",
       });
       return;
    }

    try {
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("voterId", "==", values.voterId.toUpperCase()), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setFailedAttempts(prev => prev + 1);
        toast({ variant: "destructive", title: "Login Failed", description: "No account found with this Voter ID." });
        return;
      }

      const userData = querySnapshot.docs[0].data();
      const email = userData.email;

      if (!email) {
        toast({ variant: "destructive", title: "Login Failed", description: "No email associated with this Voter ID." });
        return;
      }

      await signInWithEmailAndPassword(auth, email, values.password);
      setProfile(userData);

      if (userData.faceImageHash) {
        setStep('biometric');
        toast({
          title: "Identity Authenticated",
          description: "Proceeding to biometric verification step.",
        });
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      setFailedAttempts(prev => prev + 1);
      toast({ 
        variant: "destructive", 
        title: "Authentication Failed", 
        description: "Invalid credentials. Please verify your Voter ID and password." 
      });
    }
  };

  const handleBiometricVerification = async () => {
    if (!videoRef.current || !canvasRef.current || !profile?.faceImageHash) return;

    setIsVerifyingBiometric(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const liveCapture = canvas.toDataURL('image/jpeg', 0.85);

      try {
        const result = await verifyBiometric({
          referenceImageUri: profile.faceImageHash,
          liveCaptureUri: liveCapture,
        });

        if (result.isMatch) {
          toast({
            title: "Identity Verified",
            description: result.analysis,
          });
          router.push("/dashboard");
        } else {
          toast({
            variant: "destructive",
            title: "Biometric Mismatch",
            description: "Live capture does not match the registered profile.",
          });
          logThreat("Biometric Spoofing Attempt", `Voter ID: ${profile.voterId}`);
          await auth.signOut();
          setStep('credentials');
          setProfile(null);
        }
      } catch (error: any) {
        const errorMsg = error.message || "";
        const isHighDemand = errorMsg.includes("503") || errorMsg.includes("capacity") || errorMsg.includes("demand");
        
        toast({
          variant: "destructive",
          title: isHighDemand ? "AI Forensic Busy" : "Biometric Error",
          description: isHighDemand 
            ? "AI verification nodes are at capacity. Please retry in 30 seconds." 
            : "The biometric engine is currently unavailable.",
        });
      } finally {
        setIsVerifyingBiometric(false);
      }
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
        <AnimatePresence mode="wait">
          {isBlocked ? (
             <motion.div key="blocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <Card className="border-red-500/20 bg-red-500/5 shadow-2xl">
                 <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                      <ShieldAlert className="h-10 w-10 text-red-500" />
                    </div>
                    <CardTitle className="text-red-500">Access Denied</CardTitle>
                    <CardDescription>
                      This origin has been blacklisted by the OOTU Forensic Shield due to suspicious activity.
                    </CardDescription>
                 </CardHeader>
                 <CardFooter>
                    <Link href="/" className="w-full">
                      <Button variant="outline" className="w-full">Return Home</Button>
                    </Link>
                 </CardFooter>
               </Card>
             </motion.div>
          ) : step === 'credentials' ? (
            <motion.div key="credentials" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Card className="glassmorphic-card shadow-2xl overflow-hidden">
                <div className="h-1.5 w-full bg-primary" />
                <CardHeader className="items-center text-center p-6 pb-2">
                  <Link href="/" className="mb-4">
                    <Logo />
                  </Link>
                  <CardTitle className="text-3xl font-bold tracking-tight">Voter Sign In</CardTitle>
                  <CardDescription className="text-muted-foreground pt-2">
                    Enter your OOTU credentials to proceed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCredentialSubmit)} className="space-y-6">
                      {/* Honeypot field - Hidden from humans */}
                      <div className="hidden" aria-hidden="true">
                        <FormField
                          control={form.control}
                          name="username_hp"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} tabIndex={-1} autoComplete="off" />
                              </FormControl>
                            </FormItem>
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
                              <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <FormControl>
                                <Input placeholder="ABC1234567" {...field} className="pl-10 uppercase" maxLength={10} />
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
                            <FormLabel>Password</FormLabel>
                            <div className="relative">
                              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full h-11" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                        Authenticate Credentials
                      </Button>
                      
                      {failedAttempts > 0 && (
                        <div className="flex items-center gap-2 justify-center p-2 rounded bg-orange-500/5 border border-orange-500/20 text-[10px] text-orange-600 font-bold uppercase">
                           <AlertTriangle className="h-3 w-3" /> Failed Attempts: {failedAttempts}/5
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="p-6 pt-0 flex flex-col gap-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account? <Link href="/register" className="text-primary font-bold hover:underline">Register</Link>
                  </p>
                </CardFooter>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="biometric" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="glassmorphic-card shadow-2xl overflow-hidden border-primary/20">
                <div className="h-1.5 w-full bg-accent" />
                <CardHeader className="items-center text-center p-6">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                    <Fingerprint className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Biometric Audit</CardTitle>
                  <CardDescription>
                    Hello, {profile?.firstName}. Please look into the camera to verify your identity.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border-2 border-accent/20">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <div className="w-48 h-48 border-2 border-accent/40 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
                    </div>
                    {isVerifyingBiometric && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-center p-4">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="text-xs font-bold uppercase tracking-widest text-primary animate-pulse">Forensic Identity Sync Active</p>
                      </div>
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <Button className="w-full h-12 bg-accent hover:bg-accent/90" onClick={handleBiometricVerification} disabled={isVerifyingBiometric}>
                    {isVerifyingBiometric ? (
                      <>Analyzing Facial Mesh...</>
                    ) : (
                      <><Camera className="mr-2 h-5 w-5" /> Execute Biometric Scan</>
                    )}
                  </Button>
                </CardContent>
                <CardFooter className="bg-muted/30 p-4 border-t flex flex-col gap-2">
                  <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setStep('credentials')} disabled={isVerifyingBiometric}>
                    Back to Credentials
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
                    OOTU Protocol v4.1 Identity Engine
                  </p>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
