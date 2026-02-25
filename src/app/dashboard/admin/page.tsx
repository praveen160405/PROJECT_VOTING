
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import type { Voter, Threat } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, ShieldCheck, Lock, Fingerprint, Database, Globe, AlertTriangle, Terminal } from 'lucide-react';
import { format } from 'date-fns';

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

function ThreatRow({ threat }: { threat: Threat }) {
  return (
    <TableRow className="border-red-500/10 hover:bg-red-500/5">
      <TableCell className="font-mono text-xs">{threat.ipAddress}</TableCell>
      <TableCell>
        <Badge variant="destructive" className="bg-red-500/20 text-red-500 border-red-500/30">
          {threat.type}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[200px] truncate font-mono text-[10px] text-muted-foreground">
        {threat.payload}
      </TableCell>
      <TableCell className="text-right text-xs">
        {threat.timestamp?.toDate ? format(threat.timestamp.toDate(), 'PPp') : 'Just now'}
      </TableCell>
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

  // Users Collection
  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.isAdmin) return null;
    return collection(firestore, 'users');
  }, [firestore, userProfile]);
  const { data: users, isLoading: areUsersLoading } = useCollection<Voter>(usersCollectionRef);

  // Threats Collection
  const threatsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.isAdmin) return null;
    return query(collection(firestore, 'threats'), orderBy('timestamp', 'desc'), limit(15));
  }, [firestore, userProfile]);
  const { data: threats, isLoading: areThreatsLoading } = useCollection<Threat>(threatsQuery);

  useEffect(() => {
    if (!isUserLoading && !isProfileLoading) {
      if (!user) {
        router.replace('/login');
      } else if (!userProfile?.isAdmin) {
        router.replace('/dashboard');
      }
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  const isLoading = isUserLoading || isProfileLoading;
  
  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 p-6">
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
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!userProfile?.isAdmin) {
     return (
       <div className="flex flex-col gap-8 p-6">
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
      title: "Attack Monitoring",
      description: "Heuristic pattern matching active for SQLi and NoSQLi detection.",
      icon: Terminal,
      status: "Active"
    },
    {
      title: "Injection Prevention",
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
      description: "Voter ID formatting (3 chars + 7 digits) and Biometric readiness.",
      icon: Fingerprint,
      status: "Active"
    }
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users and monitor system security intelligence.</p>
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

      <div className="grid gap-6 lg:grid-cols-2">
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
                {areUsersLoading && <UserRowSkeleton />}
                {users && users.map(u => <UserRow key={u.id} user={u} />)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Threat Intelligence
              </CardTitle>
              <CardDescription>Detected suspicious activity and attack attempts.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Attack Type</TableHead>
                  <TableHead>Payload</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areThreatsLoading && (
                   <TableRow>
                      <TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell>
                   </TableRow>
                )}
                {threats && threats.map(t => <ThreatRow key={t.id} threat={t} />)}
                {!areThreatsLoading && (!threats || threats.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                      No security incidents reported.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UserRowSkeleton() {
  return (
     <TableRow>
      <TableCell>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div><Skeleton className="h-4 w-24" /></div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
       <TableCell className="text-right"><Skeleton className="h-4 w-40 ml-auto" /></TableCell>
    </TableRow>
  )
}
