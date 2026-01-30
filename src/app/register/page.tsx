"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import {
  User as UserIcon,
  Fingerprint,
  KeyRound,
  Upload,
  Camera,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { initialUsers } from "@/lib/data";
import type { User } from "@/lib/types";

const formSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required."),
    voterId: z.string().regex(/^[0-9]+$/, "Voter ID must be numeric"),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
    idProof: z.any().optional(),
    faceImage: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | undefined>();
  const [idProofFileName, setIdProofFileName] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const idProofInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      voterId: "",
      password: "",
      confirmPassword: "",
    },
  });

  const faceImage = form.watch('faceImage');

  useEffect(() => {
    // This function handles stopping the camera stream.
    const disableCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };

    if (!isCameraDialogOpen) {
      disableCamera();
      return;
    }

    const enableCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
           throw new Error("Camera not supported in this browser.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
        setHasCameraPermission(false);
      }
    };

    enableCamera();

    return () => {
      disableCamera();
    };
  }, [isCameraDialogOpen]);

  const handleCaptureImage = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/png');
            form.setValue('faceImage', dataUrl);
            toast({ title: "Face image captured!" });
            setIsCameraDialogOpen(false);
        }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('idProof', file);
      setIdProofFileName(file.name);
      toast({ title: 'ID Proof uploaded', description: file.name });
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    const storedUsersJSON = localStorage.getItem("verityvote_users");
    const users: User[] = storedUsersJSON ? JSON.parse(storedUsersJSON) : initialUsers;
    
    const newUser: User = {
      id: `user${Date.now()}`,
      fullName: values.fullName,
      voterId: values.voterId,
      createdAt: new Date().toISOString(),
      isVerified: false,
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem("verityvote_users", JSON.stringify(updatedUsers));

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Registration Successful",
        description: "Your account has been created. An admin will verify your details shortly.",
      });
      router.push("/");
      setIsSubmitting(false);
    }, 1500);
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md glassmorphic-card shadow-2xl">
          <CardHeader className="items-center text-center">
            <Logo className="mb-2" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Create an Account
            </h1>
            <p className="text-muted-foreground">
              Register to become a verified voter.
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Enter your full name" {...field} className="pl-10"/>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="voterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voter ID</FormLabel>
                      <FormControl>
                        <div className="relative">
                            <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Enter your numeric Voter ID" {...field} className="pl-10"/>
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
                                placeholder="Create a password"
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
                 <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your password"
                                {...field}
                                className="pl-10 pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
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
                
                <input
                    type="file"
                    className="hidden"
                    ref={idProofInputRef}
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                />
                <FormField
                    control={form.control}
                    name="faceImage"
                    render={({ field }) => (
                      <Input type="hidden" {...field} />
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <Button variant={idProofFileName ? "secondary" : "outline"} type="button" onClick={() => idProofInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        {idProofFileName ? 'ID Uploaded' : 'Upload ID Proof'}
                    </Button>
                    <Button variant={faceImage ? "secondary" : "outline"} type="button" onClick={() => setIsCameraDialogOpen(true)}>
                        <Camera className="mr-2 h-4 w-4" />
                        {faceImage ? 'Face Captured' : 'Capture Face Image'}
                    </Button>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Registering..." : "Register"}
                </Button>
              </form>
            </Form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/"
                className="font-semibold text-primary hover:underline"
              >
                Sign In
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
      <Dialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Capture Face Image</DialogTitle>
                <DialogDescription>
                    Center your face in the frame and click capture.
                </DialogDescription>
            </DialogHeader>
            <div className="relative">
                <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
            </div>
            {hasCameraPermission === false && (
                <Alert variant="destructive">
                    <Camera className="h-4 w-4" />
                    <AlertTitle>Camera Access Denied</AlertTitle>
                    <AlertDescription>
                        Please grant camera permissions in your browser settings to use this feature.
                    </AlertDescription>
                </Alert>
            )}
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsCameraDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCaptureImage} disabled={hasCameraPermission === false}>Capture</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
