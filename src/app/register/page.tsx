
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Camera, ShieldCheck, Fingerprint, RefreshCcw, CheckCircle2, Mail, Lock, User, ShieldAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, collection, serverTimestamp, getDoc } from "firebase/firestore";

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
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { useAuth, useFirestore, setDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";

const registerSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(100, "Full name is too long."),
  email: z.string().trim().email("Invalid email address."),
  aadharNumber: z
    .string()
    .trim()
    .length(12, "Aadhar number must be exactly 12 digits.")
    .regex(/^[0-9]+$/, "Aadhar number must contain only digits."),
  voterId: z
    .string()
    .trim()
    .length(10, "Voter ID must be exactly 10 characters long.")
    .regex(/^[a-zA-Z]{3}[0-9]{7}$/, "Voter ID must be 3 letters followed by 7 numbers."),
  password: z.string().min(8, "Password must be at least 8 characters long.").max(72, "Password is too long."),
  hp_field: z.string().optional(), // Honeypot
});

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    checkIpBlock();
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
      // Fail silent
    }
  };

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

        if (type.includes("Bot")) {
          const blockRef = doc(firestore, 'blockedIps', ip.replace(/\./g, '_'));
          setDocumentNonBlocking(blockRef, {
             ip,
             reason: `Automated threat detected: ${type}`,
             timestamp: serverTimestamp()
          }, { merge: true });
          setIsBlocked(true);
        }
      }
    } catch (e) {
      // Fail silent
    }
  };
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      aadharNumber: "",
      voterId: "",
      password: "",
      hp_field: "",
    },
  });

  const { formState, control } = form;

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
        toast({
          title: "Biometric Data Captured",
          description: "Your facial features have been mapped.",
        });
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    if (isBlocked) return;
    
    // Honeypot check
    if (values.hp_field) {
      await logThreat("Bot Honeypot Triggered", `Registration Honeypot: ${values.hp_field}`);
      return;
    }

    if (!capturedImage) {
      toast({
        variant: "destructive",
        title: "Biometric Required",
        description: "Please capture your biometric ID photo.",
      });
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const userProfile = {
        id: user.uid,
        voterId: values.voterId.toUpperCase(),
        email: values.email,
        firstName: values.fullName.split(' ')[0] || '',
        lastName: values.fullName.split(' ').slice(1).join(' ') || '',
        aadharNumber: values.aadharNumber,
        faceImageHash: capturedImage, 
        isAdmin: false,
      };

      const userDocRef = doc(firestore, "users", user.uid);
      setDocumentNonBlocking(userDocRef, userProfile, { merge: true });

      toast({
        title: "Registration Successful!",
        description: "Your identity has been verified.",
      });
      
      router.push("/login");

    } catch (error: any) {
      let description = "An unexpected protocol error occurred.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This identity email is already registered.";
      }
      
      toast({
        variant: "destructive",
        title: "Registration Denied",
        description: description,
      });
    }
  };
  
  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        setHasCameraPermission(false);
      }
    };

    if (isMounted && !capturedImage) {
      getCameraPermission();
    }
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [capturedImage, isMounted]);

  if (!isMounted) return null;

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        {isBlocked ? (
           <Card className="border-red-500/20 bg-red-500/5 shadow-2xl">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                  <ShieldAlert className="h-10 w-10 text-red-500" />
                </div>
                <CardTitle className="text-red-500">Origin Restricted</CardTitle>
                <CardDescription>
                  Forensic audit flagged this origin for automated security violations.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href="/" className="w-full">
                  <Button variant="outline" className="w-full">Return Home</Button>
                </Link>
              </CardFooter>
           </Card>
        ) : (
        <Card className="glassmorphic-card shadow-2xl">
          <CardHeader className="items-center text-center p-6">
            <Link href="/" className="mb-4">
              <Logo />
            </Link>
            <CardTitle className="text-3xl font-bold tracking-tight">
              Create a Voter Account
            </CardTitle>
            <CardDescription className="text-muted-foreground pt-2">
              Identity verification is powered by biometrics and encryption.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Honeypot field */}
                <div className="hidden" aria-hidden="true">
                  <FormField
                    control={control}
                    name="hp_field"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} tabIndex={-1} autoComplete="off" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-3 w-3 text-primary" />
                            Full Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                             <Mail className="h-3 w-3 text-primary" />
                             Identity Email
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="aadharNumber"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="flex items-center gap-2">
                             <Fingerprint className="h-3 w-3 text-primary" />
                             Aadhar Number
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="123456789012" {...field} maxLength={12} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                <div className="space-y-4">
                  <Label>Live Biometric Mapping</Label>
                   <div className="w-full aspect-video rounded-md border bg-black overflow-hidden relative">
                    <AnimatePresence mode="wait">
                      {capturedImage ? (
                        <motion.div 
                          key="captured"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0"
                        >
                          <img 
                            src={capturedImage} 
                            alt="Captured Biometric" 
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                            <CheckCircle2 className="h-12 w-12 text-white" />
                          </div>
                        </motion.div>
                      ) : (
                        <motion.video 
                          key="video"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          ref={videoRef} 
                          className="h-full w-full object-cover" 
                          autoPlay 
                          muted 
                          playsInline 
                        />
                      )}
                    </AnimatePresence>
                    {!hasCameraPermission && !capturedImage && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-muted">
                        <Camera className="h-12 w-12 text-muted-foreground mb-4"/>
                        <p className="text-muted-foreground">Camera access required.</p>
                      </div>
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex gap-2">
                    {!capturedImage ? (
                      <Button 
                        type="button" 
                        variant="secondary" 
                        className="w-full gap-2"
                        onClick={capturePhoto}
                        disabled={!hasCameraPermission}
                      >
                        <Camera className="h-4 w-4" />
                        Capture Biometric ID
                      </Button>
                    ) : (
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full gap-2"
                        onClick={retakePhoto}
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Retake Photo
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={control}
                      name="voterId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voter ID</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC1234567" {...field} maxLength={10} className="uppercase" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                             <Lock className="h-3 w-3 text-primary" />
                             Secure Password
                          </FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                <Button type="submit" className="w-full h-11" disabled={formState.isSubmitting}>
                   {formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register Securely
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="p-6 pt-0 text-center flex flex-col gap-4">
             <p className="w-full text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
              <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                <ShieldCheck className="h-3 w-3 text-green-500" />
                Data is encrypted on the OOTU protocol.
              </div>
          </CardFooter>
        </Card>
        )}
      </motion.div>
    </main>
  );
}
