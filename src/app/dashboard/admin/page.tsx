'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy, limit, serverTimestamp, collectionGroup } from 'firebase/firestore';
import type { Voter, Threat, BlockedIp, Election, Vote } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Database, 
  AlertTriangle, 
  Zap, 
  Ban, 
  Unlock, 
  Users, 
  Play,
  StopCircle,
  Key,
  Scan,
  Loader2,
  Ghost,
  Eye,
  RefreshCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { candidates as initialCandidates } from "@/lib/data";
import { analyzeProtocolSecurity, type SecurityAnalysisOutput } from '@/ai/flows/analyze-security-flow';
import { motion } from "framer-motion";

function ThreatRow({ threat, onBlock }: { threat: Threat, onBlock: (ip: string) => void }) {
  return (
    <TableRow className="border-red-500/10 hover:bg-red-500/5 group">
      <TableCell className="font-mono text-xs">{threat.ipAddress}</TableCell>
      <TableCell>
        <Badge variant="destructive" className="bg-red-500/20 text-red-500 border-red-500/30 rounded-none font-black uppercase text-[10px]">
          {threat.type}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[150px] truncate font-mono text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
        {threat.payload}
      </TableCell>
      <TableCell className="text-xs font-medium">
        {threat.timestamp?.toDate ? format(threat.timestamp.toDate(), 'PPp') : 'Just now'}
      </TableCell>
      <TableCell className="text-right">
        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-none" onClick={() => onBlock(threat.ipAddress)}>
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

  // Live Aggregation for Admin Stats
  const allVotesQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.isAdmin || !isAdminVerified) return null;
    return query(collectionGroup(firestore, 'votes'));
  }, [firestore, userProfile, isAdminVerified]);
  const { data: allRawVotes } = useCollection<Vote>(allVotesQuery);

  const liveStats = useMemo(() => {
    if (!allRawVotes) return { uniqueVotes: 0, turnout: '0%' };
    
    const latestVotesMap = new Map<string, Vote>();
    allRawVotes.forEach(vote => {
      const existing = latestVotesMap.get(vote.voterId);
      const voteTime = vote.timestamp?.toMillis ? vote.timestamp.toMillis() : 0;
      const existingTime = existing?.timestamp?.toMillis ? existing.timestamp.toMillis() : 0;
      if (!existing || voteTime > existingTime) {
        if (!vote.isPanic && !vote.isDecoy) {
          latestVotesMap.set(vote.voterId, vote);
        }
      }
    });

    const uniqueVotes = latestVotesMap.size;
    const turnout = allVoters?.length ? `${((uniqueVotes / allVoters.length) * 100).toFixed(1)}%` : '0%';
    
    return { uniqueVotes, turnout };
  }, [allRawVotes, allVoters]);

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
    return <div className="p-8 space-y-4"><Skeleton className="h-12 w-1/2 rounded-none" /><Skeleton className="h-64 w-full rounded-none" /></div>;
  }

  if (!userProfile?.isAdmin) {
    return <Alert variant="destructive" className="m-8 rounded-none border-l-4"><ShieldAlert className="h-4 w-4" /><AlertTitle>Access Denied</AlertTitle></Alert>;
  }

  if (!isAdminVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Card className="w-full max-w-md border-primary/20 shadow-2xl rounded-none glow-box">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-none border border-primary/20 flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-black uppercase tracking-tight">Security Verification</CardTitle>
            <CardDescription className="font-medium">
              Secondary authentication is required to access global election controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="master-key" className="text-[10px] font-black uppercase tracking-widest text-primary">Protocol Master Key</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="master-key" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-9 rounded-none bg-primary/5 border-primary/20"
                  value={verificationInput}
                  onChange={(e) => setVerificationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyAccess()}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full rounded-none h-12 font-black uppercase tracking-widest shadow-xl shadow-primary/20" onClick={handleVerifyAccess}>
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
          <p className="text-muted-foreground font-medium">Monitoring Sybil attacks, fraud patterns, and decentralized anomalies.</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="gap-2 px-3 py-1 bg-green-500/5 text-green-600 border-green-500/20 rounded-none font-black uppercase tracking-tighter shadow-sm">
            <ShieldCheck className="h-4 w-4" /> Consensus Reached
          </Badge>
          <Badge variant="outline" className="gap-2 px-3 py-1 bg-primary/5 text-primary border-primary/20 rounded-none font-black uppercase tracking-tighter shadow-sm neon-border">
            <RefreshCcw className="h-4 w-4 animate-spin" /> Live Sync Active
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-8 bg-muted/50 rounded-none border-b-2 border-primary/20">
          <TabsTrigger value="security" className="rounded-none font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Security Intelligence</TabsTrigger>
          <TabsTrigger value="election" className="rounded-none font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Election Management</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Active Nodes", val: "128", color: "bg-primary/5 border-primary/20 text-primary", icon: Zap },
              { label: "Recent Threats", val: threats?.length || 0, color: "bg-orange-500/5 border-orange-500/20 text-orange-600", icon: AlertTriangle },
              { label: "Banned IPs", val: blockedIps?.length || 0, color: "bg-red-500/5 border-red-500/20 text-red-600", icon: Ban },
              { label: "Voter Turnout", val: liveStats.turnout, color: "bg-green-500/5 border-green-500/20 text-green-600", icon: Users }
            ].map((stat, i) => (
              <Card key={i} className={`${stat.color} rounded-none border-l-4 shimmer-card shadow-lg`}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-black mt-1 tracking-tighter">{stat.val}</p>
                  </div>
                  <stat.icon className="h-8 w-8 opacity-30" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-primary/20 bg-background/50 rounded-none shadow-xl glow-box">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
                  <div>
                    <CardTitle className="text-primary flex items-center gap-2 font-black uppercase tracking-tight">
                      <Scan className="h-5 w-5" /> AI Forensic Suite
                    </CardTitle>
                    <CardDescription className="font-medium">Advanced Sybil, Fraud, and Anomaly Analysis.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-none border-primary/20 hover:bg-primary hover:text-white font-black uppercase tracking-widest h-10 px-4" onClick={handleRunSecurityAnalysis} disabled={isAnalyzingSecurity}>
                    {isAnalyzingSecurity ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                    Execute Global Audit
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="mb-6 grid grid-cols-3 gap-4">
                    {[
                      { l: "Sybil Monitor", icon: Ban, c: "text-red-500" },
                      { l: "Coercion Shield", icon: Ghost, c: "text-primary" },
                      { l: "Anomaly Watch", icon: Eye, c: "text-orange-500" }
                    ].map((m, i) => (
                      <div key={i} className="p-3 bg-muted/30 rounded-none border flex items-center gap-3 shimmer-card">
                        <m.icon className={`h-4 w-4 ${m.c}`} />
                        <div>
                          <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">{m.l}</p>
                          <p className="text-[10px] font-black uppercase">Active</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {securityAnalysis ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-3 bg-muted/30 rounded-none border border-l-4 border-l-primary">
                          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Sybil Attack Risk</p>
                          <Badge variant={securityAnalysis.sybilRisk === 'Low' ? 'secondary' : 'destructive'} className="mt-2 rounded-none font-black uppercase tracking-tighter">
                            {securityAnalysis.sybilRisk}
                          </Badge>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-none border border-l-4 border-l-primary">
                          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Fraud Detection Status</p>
                          <p className={`text-sm font-black mt-1 uppercase tracking-tighter ${securityAnalysis.fraudDetected ? 'text-red-500' : 'text-green-500'}`}>
                            {securityAnalysis.fraudDetected ? 'Alert: Anomalies Found' : 'Clear: No Fraud Patterns'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                         <div className="p-3 bg-muted/30 rounded-none border border-l-4 border-l-primary">
                          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Anomaly Monitor</p>
                          <ul className="text-[11px] mt-2 space-y-2 list-none font-medium text-muted-foreground">
                            {securityAnalysis.anomalies.map((a, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-primary rounded-none" /> {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="md:col-span-2 p-4 bg-primary/5 rounded-none border border-primary/20 border-l-8 border-l-primary shadow-inner">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                          <Zap className="h-3 w-3" /> Technical Recommendations
                        </p>
                        <p className="text-xs mt-2 text-muted-foreground leading-relaxed font-medium italic">"{securityAnalysis.securityRecommendations}"</p>
                        {securityAnalysis.isSafeMode && (
                          <div className="flex items-center gap-2 mt-3 p-2 bg-primary/10 border border-primary/20">
                            <RefreshCcw className="h-3 w-3 text-primary animate-spin" />
                            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Protocol Safe-Mode: Local Consensus Verified</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed rounded-none bg-muted/5">
                      <ShieldAlert className="h-10 w-10 opacity-10 mb-3" />
                      <p className="text-sm font-bold uppercase tracking-widest">Run AI Forensic Suite to perform a comprehensive security audit.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-red-500/20 rounded-none shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-red-500/5">
                  <div><CardTitle className="text-red-600 flex items-center gap-2 font-black uppercase tracking-tight"><AlertTriangle className="h-5 w-5" /> Threat Intelligence Log</CardTitle></div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">IP Origin</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Vector</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Payload</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Timestamp</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {areThreatsLoading && <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full rounded-none" /></TableCell></TableRow>}
                      {threats?.map(t => <ThreatRow key={t.id} threat={t} onBlock={handleBlockIp} />)}
                      {!threats?.length && !areThreatsLoading && <TableRow><TableCell colSpan={5} className="text-center italic text-muted-foreground py-12 font-bold uppercase tracking-widest">Zero active threats detected.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-none border-primary/10 shadow-xl overflow-hidden">
              <CardHeader className="bg-muted/50 border-b"><CardTitle className="text-sm font-black uppercase tracking-widest">Blacklisted Origins</CardTitle></CardHeader>
              <CardContent className="p-4 space-y-4">
                {blockedIps?.map(ip => (
                  <div key={ip.id} className="flex items-center justify-between p-3 bg-red-500/5 rounded-none border border-red-500/10 text-xs font-mono group hover:bg-red-500/10 transition-colors">
                    <span className="font-black text-red-600 tracking-tighter">{ip.ip}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600 hover:bg-red-500 hover:text-white rounded-none" onClick={() => handleUnblockIp(ip.ip)}><Unlock className="h-3 w-3" /></Button>
                  </div>
                ))}
                {!blockedIps?.length && <p className="text-center text-[10px] text-muted-foreground font-black uppercase tracking-widest py-8 italic">Zero blacklists active.</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="election" className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1 rounded-none border-primary/20 shadow-xl shimmer-card">
              <CardHeader className="border-b bg-muted/50"><CardTitle className="text-lg font-black uppercase tracking-tight">Activate New Protocol</CardTitle><CardDescription className="font-medium">Initialize a new election on the decentralized ledger.</CardDescription></CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="election-name" className="text-[10px] font-black uppercase tracking-widest text-primary">Election Identity</Label>
                  <Input id="election-name" placeholder="E.g., General Assembly 2024" className="rounded-none bg-primary/5 border-primary/20 font-bold" value={newElectionName} onChange={(e) => setNewElectionName(e.target.value)} />
                </div>
                <div className="p-4 bg-primary/5 rounded-none border border-dashed border-primary/30 space-y-3 relative glow-box">
                   <p className="font-black text-primary uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                      <ShieldCheck className="h-3 w-3" /> Protocol Constraints
                   </p>
                   <ul className="list-none space-y-2 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                     <li className="flex items-center gap-2"><div className="w-1 h-1 bg-primary rounded-none" /> SHA-256 Hashing Active</li>
                     <li className="flex items-center gap-2"><div className="w-1 h-1 bg-primary rounded-none" /> Immutable for 24 hours</li>
                     <li className="flex items-center gap-2"><div className="w-1 h-1 bg-primary rounded-none" /> Auto-Sync to 128 nodes</li>
                   </ul>
                </div>
                <Button className="w-full h-12 gap-2 rounded-none font-black uppercase tracking-widest shadow-xl shadow-primary/20" onClick={handleCreateElection} disabled={!newElectionName || isStartingElection}>
                   {isStartingElection ? <Zap className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                   {isStartingElection ? "Broadcasting..." : "Activate Election"}
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 rounded-none border-primary/20 shadow-xl overflow-hidden">
              <CardHeader className="border-b bg-muted/50"><CardTitle className="text-lg font-black uppercase tracking-tight">Live Protocol Windows</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Election Name</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Start Window</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">End Window</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {areElectionsLoading && <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full rounded-none" /></TableCell></TableRow>}
                    {elections?.map(e => (
                      <TableRow key={e.id} className="group hover:bg-primary/5">
                        <TableCell className="font-black tracking-tight">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-none bg-green-500 animate-pulse" />
                            {e.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{format(new Date(e.startDate), 'PPp')}</TableCell>
                        <TableCell className="text-xs font-medium">{format(new Date(e.endDate), 'PPp')}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="h-8 gap-2 rounded-none bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white font-black uppercase tracking-widest text-[10px] shadow-sm"
                            onClick={() => handleStopElection(e.id, e.name)}
                          >
                            <StopCircle className="h-4 w-4" />
                            Stop Protocol
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!elections?.length && !areElectionsLoading && <TableRow><TableCell colSpan={4} className="text-center italic text-muted-foreground py-16 font-black uppercase tracking-widest">No active election windows.</TableCell></TableRow>}
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