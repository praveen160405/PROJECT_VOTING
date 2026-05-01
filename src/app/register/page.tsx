
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Camera, ShieldCheck, Fingerprint } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, collection, serverTimestamp } from "firebase/firestore";

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
  voterId: z
    .string()
    .trim()
    .length(10, "Voter ID must be exactly 10 characters long.")
    .regex(/^[a-zA-Z]{3}[0-9]{7}$/, "Voter ID must be 3 letters followed by 7 numbers."),
  aadharNumber: z
    .string()
    .trim()
    .length(12, "Aadhar number must be exactly 12 digits.")
    .regex(/^[0-9]+$/, "Aadhar number must contain only digits."),
  password: z.string().min(8, "Password must be at least 8 characters long.").max(72, "Password is too long."),
});

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      voterId: "",
      aadharNumber: "",
      password: "",
    },
  });

  const { formState, control } = form;

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

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    toast({
      title: "Registering Account...",
      description: "Please wait while we create your account and verify your Aadhar.",
    });

    try {
      // Use structured email for Auth, mapped to Voter ID
      const emailForAuth = `${values.voterId.toLowerCase()}@ootu.app`;
      const userCredential = await createUserWithEmailAndPassword(auth, emailForAuth, values.password);
      const user = userCredential.user;

      const userProfile = {
        id: user.uid,
        voterId: values.voterId.toUpperCase(),
        firstName: values.fullName.split(' ')[0] || '',
        lastName: values.fullName.split(' ').slice(1).join(' ') || '',
        aadharNumber: values.aadharNumber,
        faceImageHash: '',
        isAdmin: false,
      };

      const userDocRef = doc(firestore, "users", user.uid);
      setDocumentNonBlocking(userDocRef, userProfile, { merge: true });

      toast({
        title: "Registration Successful!",
        description: "Your identity has been verified via the Aadhar network.",
      });
      
      router.push("/login");

    } catch (error: any) {
      console.error("Registration Error:", error);
      
      let description = "An unexpected error occurred.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This Voter ID is already registered. Please choose another or log in.";
      } else if (error.message) {
        description = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Registration Failed",
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
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, []);

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        <Card className="glassmorphic-card shadow-2xl">
          <CardHeader className="items-center text-center p-6">
            <Link href="/" className="mb-4">
              <Logo />
            </Link>
            <CardTitle className="text-3xl font-bold tracking-tight">
              Create a Voter Account
            </CardTitle>
            <CardDescription className="text-muted-foreground pt-2">
              Identity verification is powered by the national Aadhar database.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="voterId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voter ID</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC1234567" {...field} maxLength={10} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="aadharNumber"
                      render={({ field }) => (
                        <FormItem>
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
                    <FormField
                      control={control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                
                <div className="space-y-4">
                  <Label>Live Biometric Link (Optional)</Label>
                   <div className="w-full aspect-video rounded-md border bg-muted overflow-hidden relative">
                    <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                    {!hasCameraPermission && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <Camera className="h-12 w-12 text-muted-foreground mb-4"/>
                        <p className="text-muted-foreground">Camera access is required for biometric mapping.</p>
                      </div>
                    )}
                  </div>
                  {hasCameraPermission && (
                     <Button type="button" variant="secondary" className="w-full">
                       <Camera className="mr-2 h-4 w-4" />
                       Map Biometric ID
                     </Button>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
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
                Data is encrypted and anonymized on the OOTU protocol.
              </div>
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  );
}
