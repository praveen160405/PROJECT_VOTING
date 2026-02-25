'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Voter } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, Lock } from 'lucide-react';
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.').max(50, 'Name is too long.'),
  lastName: z.string().trim().min(1, 'Last name is required.').max(50, 'Name is too long.'),
});

export default function SettingsPage() {
  const { user, firestore, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [isAdminPasswordOpen, setIsAdminPasswordOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<Voter>(userDocRef);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
    },
  });

  const { formState, reset } = form;

  React.useEffect(() => {
    if (userProfile) {
      reset({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
      });
    }
  }, [userProfile, reset]);

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    if (!userDocRef) return;
    
    updateDocumentNonBlocking(userDocRef, {
        firstName: values.firstName,
        lastName: values.lastName,
    });

    toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved.',
    });
  };

  const handlePromoteToAdminClick = () => {
    setIsAdminPasswordOpen(true);
  };

  const handleConfirmAdmin = () => {
    if (adminPasswordInput === 'admin123') {
      if (!userDocRef) return;
      
      updateDocumentNonBlocking(userDocRef, {
          isAdmin: true,
      });

      toast({
          title: 'Admin Access Granted',
          description: 'You are now an administrator. The Admin Panel is now visible in your sidebar.',
      });
      setIsAdminPasswordOpen(false);
      setAdminPasswordInput('');
    } else {
      toast({
          variant: "destructive",
          title: 'Incorrect Password',
          description: 'The password you entered is incorrect.',
      });
    }
  };
  
  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return <SettingsSkeleton />;
  }
  
  if (!userProfile) {
    return (
      <div className="flex flex-col gap-8">
          <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground">Could not load your profile.</p>
          </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and personal details.</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your first and last name here.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <div className="space-y-2">
                    <FormLabel>Voter ID</FormLabel>
                    <Input value={userProfile.voterId} readOnly disabled />
                    <p className="text-sm text-muted-foreground">Your Voter ID cannot be changed.</p>
                </div>
                 <div className="space-y-2">
                    <FormLabel>User ID</FormLabel>
                    <Input value={userProfile.id} readOnly disabled />
                    <p className="text-sm text-muted-foreground">This is your unique identifier in the system.</p>
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4 flex justify-between items-center">
                <Button type="submit" disabled={formState.isSubmitting}>
                   {formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>

                {!userProfile.isAdmin && (
                  <Button variant="outline" type="button" onClick={handlePromoteToAdminClick} className="text-primary border-primary hover:bg-primary/10">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Become Admin (Prototype Only)
                  </Button>
                )}
            </CardFooter>
          </Card>
        </form>
      </Form>

      <Dialog open={isAdminPasswordOpen} onOpenChange={setIsAdminPasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Admin Access Required</DialogTitle>
            <DialogDescription>
              Enter the prototype admin password to grant yourself administrative privileges.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="admin-password">Admin Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="pl-9"
                  placeholder="••••••••"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmAdmin();
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdminPasswordOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmAdmin}>Verify & Promote</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


function SettingsSkeleton() {
    return (
    <div className="flex flex-col gap-8">
      <div>
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="mt-2 h-5 w-1/2" />
      </div>
      <Card>
        <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="mt-2 h-4 w-2/5" />
        </CardHeader>
        <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
            <Skeleton className="h-10 w-32" />
        </CardFooter>
      </Card>
    </div>
    )
}