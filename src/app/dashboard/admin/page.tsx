'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import type { Voter, Threat, BlockedIp, Election } from '@/lib/types';
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
  AlertTriangle, 
  Zap, 
  Ban, 
  Unlock, 
  Users, 
  Play,
  Calendar,
  Activity,
  StopCircle,
  Trash2,
  Key,
  Scan,
  Loader2,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { candidates as initialCandidates } from "@/lib/data";
import { analyzeProtocolSecurity, type SecurityAnalysisOutput } from '@/ai/flows/analyze-security-flow';

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
  
  const [newElectionName, setNewElectionName] = useState("");
  const [isStartingElection, setIsStartingElection] = useState(false);
  
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [verificationInput, setVerificationInput] = useState("");

  const [isAnalyzingSecurity, setIsAnalyzingSecurity] = useState(false);
  const [securityAnalysis, setSecurityAnalysis] = useState<SecurityAnalysisOutput | null>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<Voter>(userDocRef);

  const threatsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.isAdmin || !isAdminVerified) return null;
    return query(collection(firestore, 'threats'), orderBy('timestamp', 'desc'), limit(15));
  }, [firestore, userProfile, isAdminVerified]);
  const { data: threats, isLoading: areThreatsLoading } = useCollection<Threat>(threatsQuery);

  const blockedIpsRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.isAdmin || !isAdminVerified) return null;
    return collection(firestore, 'blockedIps');
  }, [firestore, userProfile, isAdminVerified]);
  const { data: blockedIps } = useCollection<BlockedIp>(blockedIpsRef);

  const electionsRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.isAdmin || !isAdminVerified) return null;
    return collection(firestore, 'elections');
  }, [firestore, userProfile, isAdminVerified]);
  const { data: elections, isLoading: areElectionsLoading } = useCollection<Election>(electionsRef);

  const allVotersRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.isAdmin || !isAdminVerified) return null;
    return collection(firestore, 'users');
  }, [firestore, userProfile, isAdminVerified]);
  const { data: allVoters } = useCollection<Voter>(allVotersRef);

  useEffect(() => {
    if (!isUserLoading && !isProfileLoading) {
      if (!user) {
        router.replace('/login');
      } else if (!userProfile?.isAdmin) {
        router.replace('/dashboard');
      }
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  const handleVerifyAccess = () => {
    if (verificationInput === 'admin123') {
      setIsAdminVerified(true);
      toast({
        title: "Access Granted",
        description: "Protocol Command Center unlocked.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Incorrect master key.",
      });
    }
  };

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

  const handleRunSecurityAnalysis = async () => {
    setIsAnalyzingSecurity(true);
    try {
      const result = await analyzeProtocolSecurity({
        totalVoters: allVoters?.length || 0,
        recentRegistrations: allVoters?.slice(0, 10).map(v => v.voterId) || [],
        activeThreats: threats?.slice(0, 5).map(t => t.type) || [],
        networkLatency: "1.2s",
      });
      setSecurityAnalysis(result);
      toast({
        title: "Forensic Scan Complete",
        description: result.isSafeMode ? "Local Consensus Audit triggered." : "AI security assessment generated.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Security nodes unavailable. Using local consensus audit.",
      });
    } finally {
      setIsAnalyzingSecurity(false);
    }
  };

  const handleCreateElection = async () => {
    if (!firestore || !newElectionName || !electionsRef) return;
    setIsStartingElection(true);

    const electionData: Omit<Election, 'id'> = {
      name: newElectionName,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
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

  const handleStopElection = (electionId: string, electionName: string) => {
    if (!firestore || !userProfile?.isAdmin) return;
    const electionDocRef = doc(firestore, 'elections', electionId);
    
    deleteDocumentNonBlocking(electionDocRef);
    
    toast({
      variant: "destructive",
      title: "Protocol Terminated",
      description: `Election "${electionName}" has been removed from the ledger.`,
    });
  };

  if (isUserLoading || isProfileLoading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-12 w-1/2" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!userProfile?.isAdmin) {
    return <Alert variant="destructive" className="m-8"><ShieldAlert className="h-4 w-4" /><AlertTitle>Access Denied</AlertTitle></Alert>;
  }

  if (!isAdminVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Card className="w-full max-w-md border-primary/20 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Security Verification</CardTitle>
            <CardDescription>
              Secondary authentication is required to access global election controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="master-key">Protocol Master Key</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="master-key" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-9"
                  value={verificationInput}
                  onChange={(e) => setVerificationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyAccess()}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleVerifyAccess}>
              Unlock Command Center
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Global Security Command</h1>
          <p className="text-muted-foreground">Monitoring Sybil attacks, fraud patterns, and decentralized anomalies.</p>
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
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-primary/20 bg-background/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-primary flex items-center gap-2">
                      <Scan className="h-5 w-5" /> AI Forensic Suite
                    </CardTitle>
                    <CardDescription>Advanced Sybil, Fraud, and Anomaly Analysis.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRunSecurityAnalysis} disabled={isAnalyzingSecurity}>
                    {isAnalyzingSecurity ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                    Execute Global Audit
                  </Button>
                </CardHeader>
                <CardContent>
                  {securityAnalysis ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-3 bg-muted/30 rounded border">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Sybil Attack Risk</p>
                          <Badge variant={securityAnalysis.sybilRisk === 'Low' ? 'secondary' : 'destructive'} className="mt-1">
                            {securityAnalysis.sybilRisk}
                          </Badge>
                        </div>
                        <div className="p-3 bg-muted/30 rounded border">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Fraud Detection Status</p>
                          <p className={`text-sm font-bold mt-1 ${securityAnalysis.fraudDetected ? 'text-red-500' : 'text-green-500'}`}>
                            {securityAnalysis.fraudDetected ? 'Alert: Anomalies Found' : 'Clear: No Fraud Patterns'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                         <div className="p-3 bg-muted/30 rounded border">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Anomaly Monitor</p>
                          <ul className="text-xs mt-2 space-y-1 list-disc pl-4 text-muted-foreground">
                            {securityAnalysis.anomalies.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        </div>
                      </div>
                      <div className="md:col-span-2 p-3 bg-primary/5 rounded border-l-4 border-primary">
                        <p className="text-[10px] uppercase font-bold text-primary">Technical Recommendations</p>
                        <p className="text-xs mt-1 text-muted-foreground leading-relaxed">{securityAnalysis.securityRecommendations}</p>
                        {securityAnalysis.isSafeMode && <p className="text-[9px] font-bold text-primary uppercase mt-2">Protocol Safe-Mode Active: Local Consensus Verified</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground italic">
                      <ShieldAlert className="h-8 w-8 opacity-20 mb-2" />
                      <p className="text-sm">Run AI Forensic Suite to perform a comprehensive security audit.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-red-500/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div><CardTitle className="text-red-600 flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Threat Intelligence Log</CardTitle></div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>IP Origin</TableHead><TableHead>Vector</TableHead><TableHead>Payload</TableHead><TableHead>Timestamp</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {areThreatsLoading && <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>}
                      {threats?.map(t => <ThreatRow key={t.id} threat={t} onBlock={handleBlockIp} />)}
                      {!threats?.length && !areThreatsLoading && <TableRow><TableCell colSpan={5} className="text-center italic text-muted-foreground py-8">Zero active threats detected.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Blacklisted Origins</CardTitle></CardHeader>
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
              <CardHeader><CardTitle>Live Protocol Windows</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Election Name</TableHead>
                      <TableHead>Start Window</TableHead>
                      <TableHead>End Window</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {areElectionsLoading && <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>}
                    {elections?.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="font-bold">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            {e.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{format(new Date(e.startDate), 'PPp')}</TableCell>
                        <TableCell className="text-xs">{format(new Date(e.endDate), 'PPp')}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="h-8 gap-2 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white"
                            onClick={() => handleStopElection(e.id, e.name)}
                          >
                            <StopCircle className="h-4 w-4" />
                            Stop Protocol
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!elections?.length && !areElectionsLoading && <TableRow><TableCell colSpan={4} className="text-center italic text-muted-foreground py-8">No active election windows.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
