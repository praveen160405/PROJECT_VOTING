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
  RefreshCcw,
  Activity,
  Terminal,
  Cpu
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { candidates as initialCandidates } from "@/lib/data";
import { analyzeProtocolSecurity, type SecurityAnalysisOutput } from '@/ai/flows/analyze-security-flow';
import { motion } from "framer-motion";

function ThreatRow({ threat, onBlock }: { threat: Threat, onBlock: (ip: string) => void }) {
  return (
    <TableRow className="border-destructive/10 hover:bg-destructive/5 group transition-colors">
      <TableCell className="font-mono text-[10px] text-destructive/80 font-bold uppercase tracking-widest">{threat.ipAddress}</TableCell>
      <TableCell>
        <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30 rounded-none font-black uppercase text-[9px] tracking-[0.2em] shadow-[0_0_10px_rgba(255,0,0,0.1)]">
          {threat.type}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[200px] truncate font-mono text-[9px] text-muted-foreground group-hover:text-foreground transition-colors uppercase">
        {threat.payload}
      </TableCell>
      <TableCell className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
        {threat.timestamp?.toDate ? format(threat.timestamp.toDate(), 'HH:mm:ss') : 'LIVE'}
      </TableCell>
      <TableCell className="text-right">
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-white hover:bg-destructive rounded-none border border-destructive/20" onClick={() => onBlock(threat.ipAddress)}>
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

  const allVotesQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.isAdmin || !isAdminVerified) return null;
    return query(collectionGroup(firestore, 'votes'));
  }, [firestore, userProfile, isAdminVerified]);
  const { data: allRawVotes } = useCollection<Vote>(allVotesQuery);

  const liveStats = useMemo(() => {
    if (!allRawVotes) return { uniqueVotes: 0, turnout: '0.0%' };
    
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
    const turnout = allVoters?.length ? `${((uniqueVotes / allVoters.length) * 100).toFixed(1)}%` : '0.0%';
    
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
        description: "Station Master Key verified.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Incorrect terminal access code.",
      });
    }
  };

  const handleBlockIp = (ip: string) => {
    if (!firestore || !userProfile?.isAdmin) return;
    const ipId = ip.replace(/\./g, '_');
    const blockRef = doc(firestore, 'blockedIps', ipId);
    
    setDocumentNonBlocking(blockRef, {
      ip,
      reason: 'Automated threat signature detected',
      timestamp: serverTimestamp()
    }, { merge: true });

    toast({ title: "IP Blacklisted", description: `${ip} access terminated.` });
  };

  const handleUnblockIp = (ip: string) => {
    if (!firestore || !userProfile?.isAdmin) return;
    const ipId = ip.replace(/\./g, '_');
    const blockRef = doc(firestore, 'blockedIps', ipId);
    deleteDocumentNonBlocking(blockRef);
    toast({ title: "IP Restored", description: `${ip} reinstated to registry.` });
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
        description: result.isSafeMode ? "Local Consensus Audit active." : "AI security assessment generated.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Neural nodes busy. Using local consensus audit.",
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
      title: "Protocol Initialized",
      description: `Election "${newElectionName}" window active.`,
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
      description: `Election window "${electionName}" closed.`,
    });
  };

  if (isUserLoading || isProfileLoading) {
    return <div className="p-8 space-y-6"><Skeleton className="h-12 w-1/3 bg-white/5" /><Skeleton className="h-96 w-full bg-white/5" /></div>;
  }

  if (!userProfile?.isAdmin) {
    return <Alert variant="destructive" className="m-8 glassmorphic-card border-l-4 border-l-destructive"><ShieldAlert className="h-5 w-5" /><AlertTitle className="font-black uppercase tracking-widest">ACCESS_RESTRICTED</AlertTitle><AlertDescription className="text-xs uppercase font-bold tracking-widest">Neural signature mismatch. Admin privileges required.</AlertDescription></Alert>;
  }

  if (!isAdminVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 cyber-grid">
        <Card className="w-full max-w-md glassmorphic-card border-t-4 border-t-primary rounded-none shadow-[0_0_50px_rgba(0,209,255,0.2)] shimmer-card overflow-hidden">
          <CardHeader className="text-center p-10">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-none border border-primary/20 flex items-center justify-center mb-6 shadow-inner relative">
              <Lock className="h-10 w-10 text-primary glow-text" />
              <div className="absolute inset-0 border border-primary/5 animate-pulse" />
            </div>
            <CardTitle className="font-black uppercase tracking-tighter text-3xl glow-text italic">MISSION CONTROL</CardTitle>
            <CardDescription className="font-bold uppercase tracking-[0.2em] text-[10px] text-muted-foreground pt-2 leading-relaxed">
              Authorized personnel only. Secondary master key required for global ledger synchronization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-10 pt-0">
            <div className="space-y-3">
              <Label htmlFor="master-key" className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Master Access Key</Label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                <Input 
                  id="master-key" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-12 h-14 rounded-none bg-white/5 border-white/10 font-mono tracking-widest focus:bg-white/10 transition-all"
                  value={verificationInput}
                  onChange={(e) => setVerificationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyAccess()}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-10 pt-0">
            <Button className="w-full rounded-none h-16 font-black uppercase tracking-[0.3em] shadow-2xl bg-primary text-background hover:bg-primary/90" onClick={handleVerifyAccess}>
              AUTHORIZE ACCESS
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 p-2 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter glow-text uppercase italic">Admin <span className="text-primary">Command</span></h1>
          <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] mt-2">Global Security, Anomaly Detection & Ledger Management</p>
        </div>
        <div className="flex flex-wrap gap-3">
           <Badge variant="outline" className="gap-3 px-5 py-2.5 bg-accent/5 text-accent border-accent/20 rounded-none font-black uppercase tracking-[0.2em] shadow-sm backdrop-blur-md">
            <ShieldCheck className="h-4 w-4" /> Consensus Stable
          </Badge>
          <Badge variant="outline" className="gap-3 px-5 py-2.5 bg-primary/5 text-primary border-primary/20 rounded-none font-black uppercase tracking-[0.2em] shadow-sm backdrop-blur-md neon-border">
            <RefreshCcw className="h-4 w-4 animate-spin-slow" /> Node Sync Active
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[450px] mb-10 bg-white/5 rounded-none border-b border-white/10">
          <TabsTrigger value="security" className="rounded-none h-14 font-black uppercase tracking-[0.25em] text-[10px] data-[state=active]:bg-primary data-[state=active]:text-background transition-all">Security Intelligence</TabsTrigger>
          <TabsTrigger value="election" className="rounded-none h-14 font-black uppercase tracking-[0.25em] text-[10px] data-[state=active]:bg-primary data-[state=active]:text-background transition-all">Election Protocol</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-10">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Active Nodes", val: "128", color: "text-primary", icon: Cpu, glow: "rgba(0, 209, 255, 0.2)" },
              { label: "Detected Vectors", val: threats?.length || 0, color: "text-orange-500", icon: AlertTriangle, glow: "rgba(249, 115, 22, 0.2)" },
              { label: "Terminated IPs", val: blockedIps?.length || 0, color: "text-destructive", icon: Ban, glow: "rgba(239, 68, 68, 0.2)" },
              { label: "Global Turnout", val: liveStats.turnout, color: "text-accent", icon: Activity, glow: "rgba(0, 255, 178, 0.2)" }
            ].map((stat, i) => (
              <Card key={i} className="glassmorphic-card rounded-none border-white/5 shimmer-card group hover:border-white/10 transition-all duration-500">
                <CardContent className="p-8 flex items-center justify-between overflow-hidden relative">
                  <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity">
                     <stat.icon className="w-20 h-20" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.4em] mb-2">{stat.label}</p>
                    <p className={`text-3xl font-black italic tracking-tighter ${stat.color} glow-text`}>{stat.val}</p>
                  </div>
                  <div className={`p-3 rounded-none bg-white/5 border border-white/5 ${stat.color} relative z-10 shadow-inner`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <Card className="glassmorphic-card rounded-none border-t-4 border-t-primary shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                   <Scan className="w-48 h-48" />
                </div>
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 p-10 pb-8 relative z-10">
                  <div className="space-y-1">
                    <CardTitle className="text-primary flex items-center gap-3 font-black uppercase tracking-tighter text-2xl italic glow-text">
                      <Terminal className="h-6 w-6" /> AI FORENSIC HUB
                    </CardTitle>
                    <CardDescription className="font-bold uppercase tracking-[0.2em] text-[10px] text-muted-foreground">Neural Sybil, Fraud & Anomaly Audit</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-none border-primary/40 hover:bg-primary hover:text-background font-black uppercase tracking-[0.3em] h-14 px-8 mt-4 md:mt-0 text-[10px] shadow-xl shadow-primary/5 transition-all" onClick={handleRunSecurityAnalysis} disabled={isAnalyzingSecurity}>
                    {isAnalyzingSecurity ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <ShieldCheck className="h-4 w-4 mr-3" />}
                    EXECUTE_GLOBAL_AUDIT
                  </Button>
                </CardHeader>
                <CardContent className="p-10 relative z-10">
                  <div className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                      { l: "Sybil Monitor", icon: Ban, c: "text-destructive" },
                      { l: "Coercion Shield", icon: Ghost, c: "text-secondary" },
                      { l: "Anomaly Watch", icon: Eye, c: "text-orange-500" }
                    ].map((m, i) => (
                      <div key={i} className="p-5 bg-white/5 rounded-none border border-white/10 flex items-center gap-4 group hover:bg-white/10 transition-all">
                        <div className={`p-2 bg-white/5 rounded-none border border-white/5 ${m.c} group-hover:scale-110 transition-transform`}>
                          <m.icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] uppercase font-black text-muted-foreground/60 tracking-[0.2em]">{m.l}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-foreground">ACTIVE_NODE</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {securityAnalysis ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="p-6 bg-white/5 rounded-none border-l-4 border-l-primary shadow-inner">
                          <p className="text-[10px] uppercase font-black text-primary/60 tracking-[0.4em] mb-4">SYBIL_THREAT_LVL</p>
                          <Badge variant={securityAnalysis.sybilRisk === 'Low' ? 'outline' : 'destructive'} className="h-10 px-6 rounded-none font-black uppercase tracking-[0.3em] text-[10px] border-primary/20 bg-primary/5 text-primary">
                            {securityAnalysis.sybilRisk}
                          </Badge>
                        </div>
                        <div className="p-6 bg-white/5 rounded-none border-l-4 border-l-primary shadow-inner">
                          <p className="text-[10px] uppercase font-black text-primary/60 tracking-[0.4em] mb-4">FRAUD_DETECTION</p>
                          <p className={`text-lg font-black tracking-tighter uppercase italic ${securityAnalysis.fraudDetected ? 'text-destructive glow-text' : 'text-accent glow-text'}`}>
                            {securityAnalysis.fraudDetected ? 'THREAT DETECTED' : 'SYSTEM SECURE'}
                          </p>
                        </div>
                      </div>
                      <div className="p-6 bg-white/5 rounded-none border-l-4 border-l-primary shadow-inner">
                        <p className="text-[10px] uppercase font-black text-primary/60 tracking-[0.4em] mb-4">ANOMALY_MONITOR</p>
                        <ul className="space-y-4">
                          {securityAnalysis.anomalies.map((a, i) => (
                            <li key={i} className="flex items-start gap-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider leading-relaxed">
                              <div className="w-1.5 h-1.5 bg-primary mt-1 shadow-[0_0_8px_rgba(0,209,255,0.6)]" /> {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="md:col-span-2 p-8 bg-primary/5 rounded-none border border-primary/10 border-l-[12px] border-l-primary shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                           <Zap className="w-32 h-32 text-primary" />
                        </div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] flex items-center gap-3 mb-4">
                          <Zap className="h-4 w-4" /> STATION RECOMMENDATIONS
                        </p>
                        <p className="text-sm italic font-medium text-foreground leading-relaxed border-l border-white/10 pl-6 py-2">
                          "{securityAnalysis.securityRecommendations}"
                        </p>
                        {securityAnalysis.isSafeMode && (
                          <div className="flex items-center gap-3 mt-6 p-3 bg-primary/10 border border-primary/20 backdrop-blur-md">
                            <RefreshCcw className="h-4 w-4 text-primary animate-spin-slow" />
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Protocol Safe-Mode: Local Consensus Verified</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center glassmorphic-card border-dashed border-white/10 bg-white/2 group">
                      <Scan className="h-16 w-16 text-primary/20 mb-6 group-hover:scale-110 transition-transform duration-700" />
                      <p className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground/60 max-w-sm">Execute Neural Forensic Scan to synchronize global security metrics.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glassmorphic-card rounded-none border-t-4 border-t-destructive shadow-2xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-destructive/5 p-10">
                  <CardTitle className="text-destructive flex items-center gap-3 font-black uppercase tracking-tighter text-2xl italic glow-text">
                    <ShieldAlert className="h-6 w-6" /> THREAT_LOG_STREAM
                  </CardTitle>
                  <Badge variant="outline" className="border-destructive/30 text-destructive uppercase tracking-widest text-[9px] font-black px-4 py-1">LIVE FEED</Badge>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white/5 border-b border-white/10 hover:bg-white/5">
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] p-6">Origin_IP</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] p-6">Vector</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] p-6">Payload</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] p-6">Batch_Time</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] p-6">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {areThreatsLoading && <TableRow><TableCell colSpan={5} className="p-10"><Skeleton className="h-12 w-full bg-white/5" /></TableCell></TableRow>}
                      {threats?.map(t => <ThreatRow key={t.id} threat={t} onBlock={handleBlockIp} />)}
                      {!threats?.length && !areThreatsLoading && <TableRow><TableCell colSpan={5} className="text-center italic text-muted-foreground/40 py-20 font-black uppercase tracking-[0.5em] text-[10px]">Zero Network Incursions Detected</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <Card className="glassmorphic-card rounded-none border-white/5 shadow-2xl overflow-hidden group">
              <CardHeader className="bg-white/5 border-b border-white/10 p-8">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] text-destructive flex items-center gap-3">
                  <Ban className="h-4 w-4" /> BANNED_ORIGINS
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {blockedIps?.map(ip => (
                  <motion.div 
                    key={ip.id} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-5 bg-destructive/5 rounded-none border border-destructive/10 group/item hover:bg-destructive/10 transition-all shadow-inner"
                  >
                    <div className="space-y-1">
                      <span className="font-mono text-[11px] font-black text-destructive tracking-widest">{ip.ip}</span>
                      <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest leading-none">{ip.reason}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive hover:text-white hover:bg-destructive rounded-none border border-destructive/20" onClick={() => handleUnblockIp(ip.ip)}>
                      <Unlock className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
                {!blockedIps?.length && (
                  <div className="text-center py-20 text-muted-foreground/30 font-black uppercase tracking-[0.4em] text-[10px] italic">Registry Whitelisted</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="election" className="space-y-10">
          <div className="grid gap-8 lg:grid-cols-3">
            <Card className="lg:col-span-1 glassmorphic-card rounded-none border-t-4 border-t-primary shadow-2xl shimmer-card relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5">
                 <Database className="w-48 h-48 text-primary" />
              </div>
              <CardHeader className="border-b border-white/5 p-10 relative z-10">
                <CardTitle className="text-2xl font-black uppercase tracking-tighter italic glow-text">INITIALIZE PROTOCOL</CardTitle>
                <CardDescription className="font-bold uppercase tracking-[0.2em] text-[10px] text-muted-foreground pt-2">Spawn a new election window on the decentralized mesh.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-10 p-10 relative z-10">
                <div className="space-y-3">
                  <Label htmlFor="election-name" className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Protocol ID</Label>
                  <Input id="election-name" placeholder="E.G. MAINNET_VOTE_2024" className="h-14 rounded-none bg-white/5 border-white/10 font-black uppercase tracking-widest focus:bg-white/10 transition-all" value={newElectionName} onChange={(e) => setNewElectionName(e.target.value)} />
                </div>
                <div className="p-6 bg-white/5 rounded-none border border-dashed border-primary/30 space-y-4 relative shadow-inner group">
                   <p className="font-black text-primary uppercase text-[10px] tracking-[0.4em] flex items-center gap-3">
                      <ShieldCheck className="h-4 w-4" /> UNIT CONSTRAINTS
                   </p>
                   <ul className="space-y-3">
                     {[
                       "SHA-256 UNIT HASHING",
                       "24-HOUR IMMUTABILITY",
                       "128 NODE CONSENSUS SYNC"
                     ].map((item, i) => (
                       <li key={i} className="flex items-center gap-3 text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">
                         <div className="w-1.5 h-1.5 bg-primary shadow-[0_0_8px_rgba(0,209,255,0.6)]" /> {item}
                       </li>
                     ))}
                   </ul>
                </div>
                <Button className="w-full h-16 gap-3 rounded-none font-black uppercase tracking-[0.3em] shadow-2xl bg-primary text-background hover:bg-primary/90" onClick={handleCreateElection} disabled={!newElectionName || isStartingElection}>
                   {isStartingElection ? <RefreshCcw className="h-5 w-5 animate-spin-slow" /> : <Play className="h-5 w-5" />}
                   {isStartingElection ? "BROADCASTING..." : "ACTIVATE PROTOCOL"}
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 glassmorphic-card rounded-none border-white/5 shadow-2xl overflow-hidden relative">
              <CardHeader className="bg-white/5 border-b border-white/10 p-10">
                <CardTitle className="text-2xl font-black uppercase tracking-tighter italic glow-text">ACTIVE_PROTOCOL_WINDOWS</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground pt-2">Real-time ledger access points.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white/5 border-b border-white/10 hover:bg-white/5">
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] p-6">Protocol_ID</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] p-6">Start_Batch</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] p-6">End_Batch</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] p-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {areElectionsLoading && <TableRow><TableCell colSpan={4} className="p-10"><Skeleton className="h-12 w-full bg-white/5" /></TableCell></TableRow>}
                    {elections?.map(e => (
                      <TableRow key={e.id} className="group hover:bg-white/5 border-b border-white/5 transition-all">
                        <TableCell className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-2.5 h-2.5 bg-accent animate-pulse shadow-[0_0_10px_rgba(0,255,178,0.6)]" />
                            <span className="font-black tracking-tighter text-foreground uppercase italic">{e.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{format(new Date(e.startDate), 'PPp')}</TableCell>
                        <TableCell className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{format(new Date(e.endDate), 'PPp')}</TableCell>
                        <TableCell className="text-right p-6">
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="h-10 gap-3 rounded-none bg-destructive/10 text-destructive hover:bg-destructive hover:text-white font-black uppercase tracking-[0.2em] text-[9px] border border-destructive/20 transition-all"
                            onClick={() => handleStopElection(e.id, e.name)}
                          >
                            <StopCircle className="h-4 w-4" />
                            TERMINATE
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!elections?.length && !areElectionsLoading && <TableRow><TableCell colSpan={4} className="text-center italic text-muted-foreground/30 py-32 font-black uppercase tracking-[0.5em] text-[10px]">Zero Active Protocol Windows</TableCell></TableRow>}
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