"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Calendar as CalendarIcon, Camera } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const registerSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  voterId: z.string().regex(/^[A-Z]{3}[0-9]{7}$/, "Please enter a valid Voter ID (e.g., ABC1234567)."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  dob: z.date({
    required_error: "A date of birth is required.",
  }),
  idProof: z.any().refine((files) => files?.length == 1, "ID Proof is required."),
});

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      voterId: "",
      password: "",
    },
  });

  const { formState, control } = form;

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    // This is a placeholder for your actual registration logic.
    toast({
      title: "Registration Temporarily Disabled",
      description: "This form is for demonstration purposes only.",
      variant: "destructive",
    });
    console.log(values);
  };
  
  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          variant: "destructive",
          title: "Camera Not Supported",
          description: "Your browser does not support camera access.",
        });
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
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [toast]);

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
              Fill in your details to register for secure voting.
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
                            <Input placeholder="ABC1234567" {...field} />
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
                     <FormField
                      control={control}
                      name="dob"
                      render={({ field }) => (
                        <FormItem className="flex flex-col pt-2">
                          <FormLabel>Date of birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                        control={control}
                        name="idProof"
                        render={({ field: { onChange, ...rest } }) => {
                            const { ref, ...fieldProps } = rest;
                            const fileRef = form.register('idProof').ref;
                            return(
                                <FormItem>
                                    <FormLabel>ID Proof (PDF)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={(e) => onChange(e.target.files)}
                                            {...fieldProps}
                                            ref={fileRef}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )
                        }}
                    />
                </div>
                
                <div className="space-y-4">
                  <Label>Live Identity Verification</Label>
                   <div className="w-full aspect-video rounded-md border bg-muted overflow-hidden relative">
                    <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                    {!hasCameraPermission && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <Camera className="h-12 w-12 text-muted-foreground mb-4"/>
                        <p className="text-muted-foreground">Camera access is required for identity verification.</p>
                        <p className="text-xs text-muted-foreground mt-1">Please allow camera permissions in your browser.</p>
                      </div>
                    )}
                  </div>
                  {hasCameraPermission && (
                     <Button type="button" variant="secondary" className="w-full">
                       <Camera className="mr-2 h-4 w-4" />
                       Capture Photo
                     </Button>
                  )}
                   { !(hasCameraPermission) && (
                      <Alert variant="destructive">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                          Please allow camera access to complete your registration.
                        </AlertDescription>
                      </Alert>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
                   {formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="p-6 pt-0">
             <p className="w-full text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  );
}
