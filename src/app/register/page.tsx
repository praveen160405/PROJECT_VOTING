"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, ShieldCheck, Fingerprint, User, Mail, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { useAuth, useFirestore, setDocumentNonBlocking } from "@/firebase";

const registerSchema = z.object({
  fullName: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  voterId: z.string().length(10, "10 chars required").regex(/^[a-zA-Z]{3}[0-9]{7}$/, "Format: ABC1234567"),
  password: z.string().min(8, "8 chars min"),
  aadharNumber: z.string().length(12, "12 digits required"),
});

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [capture, setCapture] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", voterId: "", password: "", aadharNumber: "" },
  });

  const handleCapture = () => {
    const canvas = canvasRef.current;
    if (canvas && videoRef.current) {
      canvas.width = 400; canvas.height = 300;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, 400, 300);
      setCapture(canvas.toDataURL('image/jpeg', 0.85));
      toast({ title: "Biometric Mapped" });
    }
  };

  const onSubmit = async (v: z.infer<typeof registerSchema>) => {
    if (!capture) { toast({ variant: "destructive", title: "Biometric Required" }); return; }
    try {
      const cred = await createUserWithEmailAndPassword(auth!, v.email, v.password);
      await setDocumentNonBlocking(doc(firestore!, "users", cred.user.uid), {
        id: cred.user.uid, voterId: v.voterId.toUpperCase(), email: v.email,
        firstName: v.fullName.split(' ')[0], lastName: v.fullName.split(' ').slice(1).join(' '),
        aadharNumber: v.aadharNumber, faceImageHash: capture, isAdmin: false
      }, { merge: true });
      toast({ title: "Registration Complete" });
      router.push("/login");
    } catch (e) { toast({ variant: "destructive", title: "Registration Denied" }); }
  };

  useEffect(() => {
    if (!capture) navigator.mediaDevices.getUserMedia({ video: true }).then(s => { if (videoRef.current) videoRef.current.srcObject = s; });
  }, [capture]);

  return (
    <main className="flex min-h-screen items-center justify-center p-4 cyber-grid">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <Card className="glassmorphic-card rounded-none border-t-4 border-t-primary shadow-2xl glow-box">
          <CardHeader className="text-center p-8">
            <Logo className="mx-auto mb-4" />
            <CardTitle className="text-2xl font-black uppercase italic">Onboard Node</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Generate Cryptographic Identity</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem><FormLabel className="text-[9px] uppercase font-bold">Full Name</FormLabel>
                    <FormControl><Input {...field} className="rounded-none h-12" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel className="text-[9px] uppercase font-bold">Email</FormLabel>
                    <FormControl><Input type="email" {...field} className="rounded-none h-12" /></FormControl></FormItem>
                  )} />
                </div>
                <div className="space-y-2">
                   <Label className="text-[9px] uppercase font-bold">Biometric Registration</Label>
                   <div className="aspect-video bg-black rounded-none border border-white/10 overflow-hidden relative">
                      {capture ? <img src={capture} className="w-full h-full object-cover grayscale" /> : <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />}
                   </div>
                   <canvas ref={canvasRef} className="hidden" />
                   <Button type="button" variant="outline" className="w-full rounded-none h-12 uppercase font-bold text-[10px]" onClick={capture ? () => setCapture(null) : handleCapture}>
                      {capture ? "Retake Mapping" : "Map Face"}
                   </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="voterId" render={({ field }) => (
                    <FormItem><FormLabel className="text-[9px] uppercase font-bold">Voter ID</FormLabel>
                    <FormControl><Input {...field} className="rounded-none h-12 uppercase" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="aadharNumber" render={({ field }) => (
                    <FormItem><FormLabel className="text-[9px] uppercase font-bold">Aadhar</FormLabel>
                    <FormControl><Input {...field} className="rounded-none h-12" /></FormControl></FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full h-14 rounded-none font-black uppercase tracking-widest bg-primary text-background">Register Identity</Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="p-8 pt-0 justify-center">
             <p className="text-[9px] font-bold uppercase text-muted-foreground">Already a node? <Link href="/login" className="text-primary underline">Sign In</Link></p>
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  );
}