"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Loader2, ShieldAlert, Lock, Fingerprint, Camera, ShieldCheck, AlertTriangle, Timer, Info, Activity, Terminal } from "lucide-react";
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
import { analyzeBehavioralAuth, type BehavioralAuthOutput } from "@/ai/flows/behavioral-auth-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [isAnalyzingBehavior, setIsAnalyzingBehavior] = useState(false);
  const [behavioralResult, setBehavioralResult] = useState<BehavioralAuthOutput | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [isSafeModeActive, setIsSafeModeActive] = useState(false);

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

  useEffect(() => {
    if (lockoutTimer > 0) {
      const timer = setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTimer]);

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
      }
    } catch (e) {
      // Fail silent
    }
  };

  const handleCredentialSubmit = async (values: z.infer<typeof loginSchema>) => {
    if (isBlocked || lockoutTimer > 0) return;

    if (values.username_hp) {
      await logThreat("Bot Trapped via Honeypot", `Payload: ${values.username_hp}`);
      setIsBlocked(true);
      return;
    }

    try {
      setIsAnalyzingBehavior(true);
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ip = ipData.ip || '0.0.0.0';

      const behavior = await analyzeBehavioralAuth({
        voterId: values.voterId,
        ipAddress: ip,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
      setBehavioralResult(behavior);
      setIsAnalyzingBehavior(false);

      if (behavior.riskScore > 0.8 && !behavior.isSafeMode) {
        toast({
          variant: "destructive",
          title: "High Risk Detected",
          description: "Behavioral audit flagged suspicious activity.",
        });
        await logThreat("High Behavioral Risk", `Voter ID: ${values.voterId}, Score: ${behavior.riskScore}`);
      }

      const usersRef = collection(firestore!, "users");
      const q = query(usersRef, where("voterId", "==", values.voterId.toUpperCase()), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("NO_VOTER_PROFILE");
      }

      const userData = querySnapshot.docs[0].data();
      const email = userData.email;

      await signInWithEmailAndPassword(auth!, email, values.password);
      setProfile(userData);

      if (userData.faceImageHash) {
        setStep('biometric');
        toast({
          title: "Step 1: Authenticated",
          description: "Proceeding to Forensic Biometric Sync.",
        });
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      setIsAnalyzingBehavior(false);
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= 3) {
        setLockoutTimer(10);
        toast({
          variant: "destructive",
          title: "DDoS Protection Triggered",
          description: "3 failed attempts detected. Access frozen for 10 seconds.",
        });
        await logThreat("Brute Force Detection", `Voter ID: ${values.voterId}`);
      } else {
        let errorMsg = "Invalid Voter ID or Password. Identity mismatch logged.";
        if (error.message === "NO_VOTER_PROFILE") {
          errorMsg = "Voter ID not recognized in current ledger.";
        }
        
        toast({ 
          variant: "destructive", 
          title: "Access Denied", 
          description: errorMsg
        });
      }
    }
  };

  const handleBiometricVerification = async () => {
    if (!videoRef.current || !canvasRef.current || !profile?.faceImageHash) return;

    setIsVerifyingBiometric(true);
    setIsSafeModeActive(false);
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

        if (result.isSafeMode) {
          setIsSafeModeActive(true);
        }

        if (result.isMatch) {
          toast({ 
            title: result.isSafeMode ? "Local Identity Verified" : "Forensic Identity Verified", 
            description: result.analysis 
          });
          
          setTimeout(() => {
            router.push("/dashboard");
          }, result.isSafeMode ? 1500 : 0);
          
        } else {
          toast({ variant: "destructive", title: "Biometric Mismatch", description: "Identity check failed. Forensic report generated." });
          logThreat("Biometric Identity Spoofing", `Voter ID: ${profile.voterId}`);
          await auth!.signOut();
          setStep('credentials');
        }
      } catch (error: any) {
         toast({ variant: "destructive", title: "Identity Engine Busy", description: "High demand on forensic nodes. Please retry or wait for safe-mode transition." });
      } finally {
        setIsVerifyingBiometric(false);
      }
    }
  };

  if (!isMounted) return null;

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4 cyber-grid relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <AnimatePresence mode="wait">
          {isBlocked ? (
             <motion.div key="blocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <Card className="border-destructive/30 bg-destructive/10 shadow-2xl rounded-none backdrop-blur-xl">
                 <CardHeader className="text-center">
                    <div className="mx-auto w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mb-6 text-destructive shadow-[0_0_20px_rgba(255,0,0,0.3)]">
                      <ShieldAlert className="h-10 w-10" />
                    </div>
                    <CardTitle className="text-destructive uppercase tracking-[0.3em] font-black text-2xl">ACCESS DENIED</CardTitle>
                    <CardDescription className="text-muted-foreground font-bold mt-2">
                      Security violations detected. Access from this origin has been terminated by the OOTU Neural Shield.
                    </CardDescription>
                 </CardHeader>
                 <CardFooter className="p-8">
                    <Link href="/" className="w-full">
                      <Button variant="outline" className="w-full rounded-none h-14 border-destructive/20 text-destructive hover:bg-destructive/10 uppercase font-black tracking-widest">Terminate Session</Button>
                    </Link>
                 </CardFooter>
               </Card>
             </motion.div>
          ) : step === 'credentials' ? (
            <motion.div key="credentials" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Card className="glassmorphic-card rounded-none border-t-4 border-t-primary shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 p-4 opacity-10">
                   <Terminal className="h-12 w-12 text-primary" />
                </div>
                <CardHeader className="items-center text-center p-10 pb-2">
                  <Logo className="mb-6 scale-125" />
                  <CardTitle className="text-3xl font-black uppercase tracking-tighter glow-text">NODE ACCESS</CardTitle>
                  <CardDescription className="text-muted-foreground pt-2 font-bold uppercase tracking-widest text-[10px]">
                    Neural identity audit required for ledger access.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-10">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCredentialSubmit)} className="space-y-6">
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
                            <FormLabel className="uppercase text-[10px] font-black tracking-[0.3em] text-primary/70">Credential ID</FormLabel>
                            <div className="relative group">
                              <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary group-focus-within:text-primary transition-colors" />
                              <FormControl>
                                <Input placeholder="ABC1234567" {...field} className="pl-12 h-14 uppercase rounded-none border-white/10 bg-white/5 focus:bg-white/10 transition-all font-mono" maxLength={10} disabled={lockoutTimer > 0} />
                              </FormControl>
                            </div>
                            <FormMessage className="text-[10px] font-bold" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase text-[10px] font-black tracking-[0.3em] text-primary/70">Master Key</FormLabel>
                            <div className="relative group">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary group-focus-within:text-primary transition-colors" />
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} className="pl-12 h-14 rounded-none border-white/10 bg-white/5 focus:bg-white/10 transition-all" disabled={lockoutTimer > 0} />
                              </FormControl>
                            </div>
                            <FormMessage className="text-[10px] font-bold" />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full h-16 rounded-none font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(0,209,255,0.2)] bg-primary text-background hover:bg-primary/90" 
                        disabled={form.formState.isSubmitting || lockoutTimer > 0 || isAnalyzingBehavior}
                      >
                        {isAnalyzingBehavior ? (
                           <>
                             <Activity className="mr-3 h-5 w-5 animate-pulse" />
                             AUDITING...
                           </>
                        ) : form.formState.isSubmitting ? (
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        ) : lockoutTimer > 0 ? (
                          <Timer className="mr-3 h-5 w-5 animate-pulse" />
                        ) : (
                          <ShieldCheck className="mr-3 h-5 w-5" />
                        )}
                        {lockoutTimer > 0 ? `LOCKED (${lockoutTimer}S)` : !isAnalyzingBehavior && !form.formState.isSubmitting && "AUTHORIZE"}
                      </Button>
                      
                      {failedAttempts > 0 && lockoutTimer === 0 && (
                        <div className="flex items-center gap-3 justify-center p-3 rounded-none bg-destructive/10 border border-destructive/20 text-[10px] text-destructive font-black uppercase tracking-widest">
                           <AlertTriangle className="h-4 w-4" /> THREAT DETECTED: {failedAttempts} / 3
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="p-10 pt-0 flex flex-col gap-4 text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                    New Identity? <Link href="/register" className="text-primary hover:underline ml-2">REGISTER NODE</Link>
                  </p>
                </CardFooter>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="biometric" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="glassmorphic-card rounded-none shadow-2xl overflow-hidden border-t-4 border-t-secondary">
                <CardHeader className="items-center text-center p-10">
                  <div className="w-20 h-20 rounded-none border-2 border-secondary/20 bg-secondary/10 flex items-center justify-center mb-6 text-secondary shadow-[0_0_20px_rgba(122,92,255,0.2)]">
                    <Fingerprint className="h-10 w-10" />
                  </div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tighter glow-text">BIOMETRIC SYNC</CardTitle>
                  <CardDescription className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground pt-2">
                    Matching identity nodes for <span className="text-secondary">{profile?.firstName}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-0 space-y-8">
                  {isSafeModeActive && (
                    <Alert className="bg-secondary/10 border-secondary/20 rounded-none border-l-4 border-l-secondary">
                      <Info className="h-4 w-4 text-secondary" />
                      <AlertTitle className="text-[10px] font-black uppercase tracking-widest">Protocol Safe-Mode</AlertTitle>
                      <AlertDescription className="text-[9px] font-bold text-muted-foreground leading-relaxed">
                        Global neural nodes busy. Switching to Local Consensus Audit for identity verification.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="relative w-full aspect-video rounded-none overflow-hidden bg-black border-2 border-white/10 group">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <div className="w-48 h-48 border-2 border-secondary/40 rounded-none border-dashed animate-[spin_15s_linear_infinite]" />
                       <div className="absolute w-64 h-64 border border-secondary/10 rounded-none animate-pulse" />
                    </div>
                    {isVerifyingBiometric && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center gap-6 text-center p-6">
                        <div className="relative">
                          <Loader2 className="h-14 w-14 text-secondary animate-spin" />
                          <Fingerprint className="absolute inset-0 m-auto h-6 w-6 text-secondary" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary animate-pulse">NEURAL IDENTITY SYNC</p>
                      </div>
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <Button className="w-full h-16 rounded-none bg-secondary hover:bg-secondary/90 text-white font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(122,92,255,0.3)] transition-all" onClick={handleBiometricVerification} disabled={isVerifyingBiometric}>
                    {isVerifyingBiometric ? "SCANNING MESH..." : "INITIATE BIOMETRIC SYNC"}
                  </Button>
                </CardContent>
                <CardFooter className="bg-white/5 p-4 border-t border-white/5 flex flex-col gap-2">
                  <Button variant="ghost" size="sm" className="w-full text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-white" onClick={() => setStep('credentials')} disabled={isVerifyingBiometric}>
                    ABORT PROTOCOL
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}