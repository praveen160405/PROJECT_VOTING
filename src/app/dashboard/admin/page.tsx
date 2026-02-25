'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import type { Voter, Threat, BlockedIp } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, ShieldCheck, Lock, Fingerprint, Database, Globe, AlertTriangle, Terminal, Activity, Zap, Ban, Unlock, Server } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

function UserRow({ user }: { user: Voter }) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
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

function ThreatRow({ threat, onBlock }: { threat: Threat, onBlock: (ip: string) => void }) {
  return (
    <TableRow className="border-red-500/10 hover:bg-red-500/5">
      <TableCell className="font-mono text-xs">{threat.ipAddress}</TableCell>
      <TableCell>
        <Badge variant="destructive" className="bg-red-500/20 text-red-500 border-red-500/30">
          {threat.type}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[150px] truncate font-mono text-[10px] text-muted-foreground">
        {threat.payload}
      </TableCell>
      <TableCell className="text-xs">
        {threat.timestamp?.toDate ? format(threat.timestamp.toDate(), 'PPp') : 'Just now'}
      </TableCell>
      <TableCell className="text-right">
        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => onBlock(threat.ipAddress)}>
          <Ban className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function BlockedIpRow({ item, onUnblock }: { item: BlockedIp, onUnblock: (ip: string) => void }) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{item.ip}</TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {item.timestamp?.toDate ? format(item.timestamp.toDate(), 'PPp') : 'Unknown'}
      </TableCell>
      <TableCell className="text-right">
        <Button size="sm" variant="outline" className="h-8 gap-2" onClick={() => onUnblock(item.ip)}>
          <Unlock className="h-3.5 w-3.5" /> Unblock
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
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

  // Blocked IPs Collection
  const blockedIpsRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.isAdmin) return null;
    return collection(firestore, 'blockedIps');
  }, [firestore, userProfile]);
  const { data: blockedIps, isLoading: areBlockedIpsLoading } = useCollection<BlockedIp>(blockedIpsRef);

  useEffect(() => {
    if (!isUserLoading && !isProfileLoading) {
      if (!user) {
        router.replace('/login');
      } else if (!userProfile?.isAdmin) {
        router.replace('/dashboard');
      }
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  const handleBlockIp = (ip: string) => {
    if (!firestore || !userProfile?.isAdmin) return;
    const ipId = ip.replace(/\./g, '_');
    const blockRef = doc(firestore, 'blockedIps', ipId);
    
    setDocumentNonBlocking(blockRef, {
      ip,
      reason: 'Security threat detected via Intelligence Panel',
      timestamp: serverTimestamp()
    }, { merge: true });

    toast({
      title: "IP Blocked",
      description: `${ip} has been added to the blacklist.`,
    });
  };

  const handleUnblockIp = (ip: string) => {
    if (!firestore || !userProfile?.isAdmin) return;
    const ipId = ip.replace(/\./g, '_');
    const blockRef = doc(firestore, 'blockedIps', ipId);
    deleteDocumentNonBlocking(blockRef);

    toast({
      title: "IP Unblocked",
      description: `${ip} has been removed from the blacklist.`,
    });
  };

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
      title: "DDoS Mitigation",
      description: "Active rate limiting and honeypot bot detection enabled.",
      icon: Server,
      status: "Resilient",
      color: "text-blue-500",
      bg: "bg-blue-500"
    },
    {
      title: "Attack Monitoring",
      description: "Heuristic pattern matching active for SQLi and NoSQLi detection.",
      icon: Terminal,
      status: "Active",
      color: "text-green-500",
      bg: "bg-green-500"
    },
    {
      title: "IP Blacklisting",
      description: "Real-time edge blocking active for malicious origin addresses.",
      icon: Ban,
      status: "Active",
      color: "text-red-500",
      bg: "bg-red-500"
    },
    {
      title: "CSRF Defense",
      description: "Token-based session management and restrictive Referrer policies.",
      icon: Lock,
      status: "Secured",
      color: "text-green-500",
      bg: "bg-green-500"
    }
  ];

  const systemStats = [
    { label: "Active Nodes", value: "128", icon: Zap },
    { label: "Network Health", value: "99.9%", icon: Activity },
    { label: "Banned IPs", value: blockedIps?.length || "0", icon: Ban },
    { label: "Recent Attacks", value: threats?.length || "0", icon: AlertTriangle },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Security Panel</h1>
          <p className="text-muted-foreground">Manage users and monitor system security intelligence.</p>
        </div>
        <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20 px-4 py-1">
          <ShieldCheck className="mr-2 h-4 w-4" /> System Secure
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {systemStats.map((stat) => (
          <Card key={stat.label} className="bg-primary/5 border-primary/10">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className="h-8 w-8 text-primary/40" />
            </CardContent>
          </Card>
        ))}
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
              <div className={`flex items-center text-xs font-semibold ${measure.color}`}>
                <div className={`mr-2 h-2 w-2 rounded-full ${measure.bg} animate-pulse`} />
                {measure.status}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>All registered users in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areUsersLoading && <UserRowSkeleton />}
                {users && users.slice(0, 8).map(u => <UserRow key={u.id} user={u} />)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-red-500/20">
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
                  <TableHead>Type</TableHead>
                  <TableHead>Payload</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areThreatsLoading && (
                   <TableRow>
                      <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                   </TableRow>
                )}
                {threats && threats.map(t => <ThreatRow key={t.id} threat={t} onBlock={handleBlockIp} />)}
                {!areThreatsLoading && (!threats || threats.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                      No security incidents reported.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-orange-500" />
              Blacklisted IP Addresses
            </CardTitle>
            <CardDescription>Currently banned origins that are denied access to the login portal.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Banned At</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areBlockedIpsLoading && (
                    <TableRow>
                       <TableCell colSpan={3}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  )}
                  {blockedIps && blockedIps.map(item => <BlockedIpRow key={item.id} item={item} onUnblock={handleUnblockIp} />)}
                  {!areBlockedIpsLoading && (!blockedIps || blockedIps.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground italic">
                        No IP addresses are currently blacklisted.
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
    </TableRow>
  )
}