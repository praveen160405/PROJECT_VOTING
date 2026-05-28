"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Fingerprint, ShieldCheck, Activity, Terminal, Key } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { useAuth, useFirestore } from "@/firebase";
import { verifyBiometric } from "@/ai/flows/verify-biometric-flow";

const loginSchema = z.object({
  voterId: z.string().trim().length(10, "Voter ID must be 10 characters."),
  password: z.string().min(1, "Password is required."),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const [step, setStep] = useState<'credentials' | 'biometric'>('credentials');
  const [profile, setProfile] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { voterId: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      const usersRef = collection(firestore!, "users");
      const q = query(usersRef, where("voterId", "==", values.voterId.toUpperCase()), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) throw new Error("Voter not found.");

      const userData = querySnapshot.docs[0].data();
      await signInWithEmailAndPassword(auth!, userData.email, values.password);
      setProfile(userData);
      setStep('biometric');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Access Denied", description: "Identity mismatch logged." });
    }
  };

  const handleBiometric = async () => {
    if (!videoRef.current || !canvasRef.current || !profile?.faceImageHash) return;
    setIsVerifying(true);
    const canvas = canvasRef.current;
    canvas.width = 400; canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const capture = canvas.toDataURL('image/jpeg', 0.85);
      try {
        const result = await verifyBiometric({ referenceImageUri: profile.faceImageHash, liveCaptureUri: capture });
        if (result.isMatch) {
          toast({ title: "Identity Verified" });
          router.push("/dashboard");
        } else {
          toast({ variant: "destructive", title: "Biometric Mismatch" });
          await auth!.signOut();
          setStep('credentials');
        }
      } catch (e) { toast({ variant: "destructive", title: "Auth Error" }); }
      finally { setIsVerifying(false); }
    }
  };

  useEffect(() => {
    if (step === 'biometric') {
      navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
        if (videoRef.current) videoRef.current.srcObject = s;
      });
    }
  }, [step]);

  return (
    <main className="flex min-h-screen items-center justify-center p-4 cyber-grid relative overflow-hidden">
      {/* Dynamic Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full" />
      
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10">
        <Card className="glassmorphic-card rounded-3xl border-t-4 border-t-primary shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden shimmer-card">
          <CardHeader className="text-center p-10 pb-2">
            <Logo className="mb-8 mx-auto scale-125" />
            <CardTitle className="text-3xl font-black uppercase italic tracking-tighter glow-text">NODE ACCESS</CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.4em] pt-4 text-primary/60">Forensic Identity Sync</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            {step === 'credentials' ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField control={form.control} name="voterId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 block">Credential ID</FormLabel>
                      <div className="relative group">
                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary group-focus-within:text-primary transition-colors" />
                        <FormControl>
                          <Input placeholder="ABC1234567" {...field} className="pl-12 h-16 rounded-2xl bg-white/5 border-white/10 uppercase font-mono tracking-widest focus:bg-white/10 transition-all" />
                        </FormControl>
                      </div>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 block">Master Access Key</FormLabel>
                      <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary group-focus-within:text-primary transition-colors" />
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="pl-12 h-16 rounded-2xl bg-white/5 border-white/10 tracking-widest focus:bg-white/10 transition-all" />
                        </FormControl>
                      </div>
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full h-16 rounded-2xl font-black uppercase tracking-[0.3em] bg-primary text-background hover:bg-primary/90 shadow-xl shadow-primary/20">AUTHORIZE</Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <div className="aspect-video bg-black rounded-2xl border-2 border-primary/20 overflow-hidden relative shadow-inner">
                   <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale brightness-75" />
                   {isVerifying && (
                     <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-20">
                       <Activity className="h-10 w-10 text-primary animate-pulse" />
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Syncing Signature...</p>
                     </div>
                   )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <Button className="w-full h-16 rounded-2xl font-black uppercase tracking-[0.3em] bg-secondary text-white shadow-xl shadow-secondary/20" onClick={handleBiometric} disabled={isVerifying}>INITIATE SYNC</Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-10 pt-0 text-center">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground w-full">
               New Node? <Link href="/register" className="text-primary hover:glow-text transition-all">Register ID</Link>
             </p>
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  );
}