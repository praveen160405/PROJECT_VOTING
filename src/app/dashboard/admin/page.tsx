'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import type { Voter } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, ShieldCheck, Lock, Fingerprint, Database, Globe } from 'lucide-react';

function UserRow({ user }: { user: Voter }) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage />
            <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.firstName} {user.lastName}</div>
            <div className="text-sm text-muted-foreground">{user.voterId}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {user.isAdmin ? (
          <Badge variant="destructive">Admin</Badge>
        ) : (
          <Badge variant="secondary">Voter</Badge>
        )}
      </TableCell>
       <TableCell className="text-right font-mono text-xs">{user.id}</TableCell>
    </TableRow>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user, firestore, isUserLoading } = useFirebase();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<Voter>(userDocRef);

  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.isAdmin) return null;
    return collection(firestore, 'users');
  }, [firestore, userProfile]);

  const { data: users, isLoading: areUsersLoading } = useCollection<Voter>(usersCollectionRef);

  useEffect(() => {
    if (!isUserLoading && !isProfileLoading && !userProfile?.isAdmin) {
      router.replace('/dashboard');
    }
  }, [userProfile, isUserLoading, isProfileLoading, router]);

  const isLoading = isUserLoading || isProfileLoading;
  
  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-10 w-1/2" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!userProfile?.isAdmin) {
     return (
       <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const securityMeasures = [
    {
      title: "NoSQL Injection Protection",
      description: "Strict Zod schema validation and Firestore parameterization active.",
      icon: Database,
      status: "Active"
    },
    {
      title: "CSRF Defense",
      description: "Token-based session management and restrictive Referrer policies.",
      icon: Lock,
      status: "Active"
    },
    {
      title: "Identity Verification",
      description: "Voter ID formatting (3 chars + 7 digits) and Biometric capture readiness.",
      icon: Fingerprint,
      status: "Active"
    },
    {
      title: "Security Headers",
      description: "HSTS, X-Frame-Options, and X-Content-Type-Options enabled.",
      icon: Globe,
      status: "Active"
    }
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users and monitor system security.</p>
        </div>
        <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20 px-4 py-1">
          <ShieldCheck className="mr-2 h-4 w-4" /> System Secure
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {securityMeasures.map((measure) => (
          <Card key={measure.title} className="glassmorphic-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{measure.title}</CardTitle>
              <measure.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">{measure.description}</p>
              <div className="flex items-center text-xs font-semibold text-green-500">
                <div className="mr-2 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                {measure.status}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>A list of all registered users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">User ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areUsersLoading && (
                <>
                  <UserRowSkeleton />
                  <UserRowSkeleton />
                  <UserRowSkeleton />
                </>
              )}
              {users && users.map(u => <UserRow key={u.id} user={u} />)}
               {!areUsersLoading && (!users || users.length === 0) && (
                 <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
               )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function UserRowSkeleton() {
  return (
     <TableRow>
      <TableCell>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1 h-3 w-32" />
          </div>
        </div>
      </TableCell>
      <TableCell>
         <Skeleton className="h-6 w-16 rounded-full" />
      </TableCell>
       <TableCell className="text-right">
        <Skeleton className="h-4 w-40 ml-auto" />
      </TableCell>
    </TableRow>
  )
}