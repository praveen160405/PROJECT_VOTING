'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import type { Voter, Threat, BlockedIp, Election, Candidate } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Fingerprint, 
  Database, 
  Globe, 
  AlertTriangle, 
  Activity, 
  Zap, 
  Ban, 
  Unlock, 
  Cpu, 
  Link as LinkIcon, 
  Eye, 
  Plus, 
  Calendar, 
  Users, 
  Vote as VoteIcon,
  Play,
  Square
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { candidates as initialCandidates } from "@/lib/data";

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

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, firestore, isUserLoading } = useFirebase();
  
  // New Election State
  const [newElectionName, setNewElectionName] = useState("");
  const [isStartingElection, setIsStartingElection] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<Voter>(userDocRef);

  // Collections
  const usersCollectionRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.isAdmin) return null;
    return collection(firestore, 'users');
  }, [firestore, userProfile]);
  const { data: users, isLoading: areUsersLoading } = useCollection<Voter>(usersCollectionRef);

  const threatsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.isAdmin) return null;
    return query(collection(firestore, 'threats'), orderBy('timestamp', 'desc'), limit(15));
  }, [firestore, userProfile]);
  const { data: threats, isLoading: areThreatsLoading } = useCollection<Threat>(threatsQuery);

  const blockedIpsRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.isAdmin) return null;
    return collection(firestore, 'blockedIps');
  }, [firestore, userProfile]);
  const { data: blockedIps, isLoading: areBlockedIpsLoading } = useCollection<BlockedIp>(blockedIpsRef);

  const electionsRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.isAdmin) return null;
    return collection(firestore, 'elections');
  }, [firestore, userProfile]);
  const { data: elections, isLoading: areElectionsLoading } = useCollection<Election>(electionsRef);

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
      reason: 'Security threat detected via Command Center',
      timestamp: serverTimestamp()
    }, { merge: true });

    toast({ title: "IP Blacklisted", description: `${ip} access denied.` });
  };

  const handleUnblockIp = (ip: string) => {
    if (!firestore || !userProfile?.isAdmin) return;
    const ipId = ip.replace(/\./g, '_');
    const blockRef = doc(firestore, 'blockedIps', ipId);
    deleteDocumentNonBlocking(blockRef);
    toast({ title: "IP Whitelisted", description: `${ip} restored.` });
  };

  const handleCreateElection = async () => {
    if (!firestore || !newElectionName || !electionsRef) return;
    setIsStartingElection(true);

    const electionData: Omit<Election, 'id'> = {
      name: newElectionName,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(), // 24 hours later
      candidateIds: initialCandidates.map(c => c.id),
    };

    addDocumentNonBlocking(electionsRef, electionData);
    
    toast({
      title: "Protocol Window Activated",
      description: `Election "${newElectionName}" is now live on the ledger.`,
    });
    setNewElectionName("");
    setIsStartingElection(false);
  };

  if (isUserLoading || isProfileLoading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-12 w-1/2" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!userProfile?.isAdmin) {
    return <Alert variant="destructive" className="m-8"><ShieldAlert className="h-4 w-4" /><AlertTitle>Access Denied</AlertTitle></Alert>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Global Security Command</h1>
          <p className="text-muted-foreground">Monitoring decentralized protocols and election integrity.</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="gap-2 px-3 py-1 bg-green-500/5 text-green-600 border-green-500/20">
            <ShieldCheck className="h-4 w-4" /> Consensus Reached
          </Badge>
          <Badge variant="outline" className="gap-2 px-3 py-1 bg-primary/5 text-primary border-primary/20">
            <Database className="h-4 w-4" /> Node Sync: 100%
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-8">
          <TabsTrigger value="security">Security Intelligence</TabsTrigger>
          <TabsTrigger value="election">Election Management</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-6 flex items-center justify-between">
                <div><p className="text-xs font-medium text-muted-foreground uppercase">Active Nodes</p><p className="text-2xl font-bold text-primary">128</p></div>
                <Zap className="h-8 w-8 text-primary/30" />
              </CardContent>
            </Card>
            <Card className="bg-orange-500/5 border-orange-500/10">
              <CardContent className="p-6 flex items-center justify-between">
                <div><p className="text-xs font-medium text-muted-foreground uppercase">Recent Threats</p><p className="text-2xl font-bold text-orange-600">{threats?.length || 0}</p></div>
                <AlertTriangle className="h-8 w-8 text-orange-500/30" />
              </CardContent>
            </Card>
            <Card className="bg-red-500/5 border-red-500/10">
              <CardContent className="p-6 flex items-center justify-between">
                <div><p className="text-xs font-medium text-muted-foreground uppercase">Banned IPs</p><p className="text-2xl font-bold text-red-600">{blockedIps?.length || 0}</p></div>
                <Ban className="h-8 w-8 text-red-500/30" />
              </CardContent>
            </Card>
            <Card className="bg-green-500/5 border-green-500/10">
              <CardContent className="p-6 flex items-center justify-between">
                <div><p className="text-xs font-medium text-muted-foreground uppercase">Voter Turnout</p><p className="text-2xl font-bold text-green-600">84.2%</p></div>
                <Users className="h-8 w-8 text-green-500/30" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-red-500/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle className="text-red-600 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Threat Intelligence Log</CardTitle><CardDescription>Real-time forensic audit of multi-vector attack attempts.</CardDescription></div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>IP Origin</TableHead><TableHead>Vector</TableHead><TableHead>Payload</TableHead><TableHead>Timestamp</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {areThreatsLoading && <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>}
                    {threats?.map(t => <ThreatRow key={t.id} threat={t} onBlock={handleBlockIp} />)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Blacklisted Origins</CardTitle><CardDescription>Denied access to protocol nodes.</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {blockedIps?.map(ip => (
                    <div key={ip.id} className="flex items-center justify-between p-3 bg-muted/30 rounded border text-xs font-mono">
                      <span>{ip.ip}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleUnblockIp(ip.ip)}><Unlock className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  {!blockedIps?.length && <p className="text-center text-xs text-muted-foreground italic py-4">Zero blacklists active.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="election" className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle>Activate New Protocol</CardTitle><CardDescription>Initialize a new election on the decentralized ledger.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="election-name">Election Identity</Label>
                  <Input id="election-name" placeholder="E.g., General Assembly 2024" value={newElectionName} onChange={(e) => setNewElectionName(e.target.value)} />
                </div>
                <div className="p-4 bg-primary/5 rounded border border-dashed text-xs text-muted-foreground space-y-2">
                   <p className="font-bold text-primary uppercase">Protocol Constraints:</p>
                   <ul className="list-disc pl-4 space-y-1">
                     <li>SHA-256 Hashing Active</li>
                     <li>Immutable for 24 hours</li>
                     <li>Auto-Sync to 128 nodes</li>
                   </ul>
                </div>
                <Button className="w-full gap-2" onClick={handleCreateElection} disabled={!newElectionName || isStartingElection}>
                   {isStartingElection ? <Zap className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                   {isStartingElection ? "Broadcasting..." : "Activate Election"}
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Live Protocol Windows</CardTitle><CardDescription>Current elections being processed by the OOTU network.</CardDescription></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Election Name</TableHead><TableHead>Start Window</TableHead><TableHead>End Window</TableHead><TableHead className="text-right">Status</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {areElectionsLoading && <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>}
                    {elections?.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="font-bold">{e.name}</TableCell>
                        <TableCell className="text-xs">{format(new Date(e.startDate), 'PPp')}</TableCell>
                        <TableCell className="text-xs">{format(new Date(e.endDate), 'PPp')}</TableCell>
                        <TableCell className="text-right"><Badge className="bg-green-500">Live</Badge></TableCell>
                      </TableRow>
                    ))}
                    {!elections?.length && !areElectionsLoading && <TableRow><TableCell colSpan={4} className="text-center italic text-muted-foreground">No active election windows.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Candidate Roster Status</CardTitle><CardDescription>Verified participants in current protocol cycles.</CardDescription></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {initialCandidates.map(c => (
                  <div key={c.id} className="p-4 bg-muted/20 rounded border flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{c.name[0]}</div>
                    <div><p className="font-bold text-sm">{c.name}</p><p className="text-[10px] text-muted-foreground uppercase tracking-widest">{c.party}</p></div>
                    <Badge variant="outline" className="ml-auto text-[10px]">Verified</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
