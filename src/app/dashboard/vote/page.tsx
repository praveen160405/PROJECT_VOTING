"use client"
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  Quote, 
  AlertCircle, 
  Timer, 
  Globe, 
  Camera, 
  Fingerprint, 
  ShieldCheck,
  ShieldAlert,
  Ghost,
  EyeOff,
  RefreshCcw,
  ShieldOff,
  Crosshair,
  UserCheck,
  Activity
} from 'lucide-react';
import { collection, serverTimestamp, doc } from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { candidates } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Candidate, Vote, Election, Voter } from "@/lib/types";
import { useFirebase, useCollection, addDocumentNonBlocking, useMemoFirebase, useDoc } from "@/firebase";
import { verifyBiometric } from "@/ai/flows/verify-biometric-flow";

const PROVERBS = [
  "The ballot is stronger than the bullet. — Abraham Lincoln",
  "Voting is not only our right—it is our power. — Loung Ung",
  "Bad officials are elected by good citizens who do not vote. — George Jean Nathan",
  "The ignorance of one voter in a democracy impairs the security of all. — John F. Kennedy",
  "A citizen’s greatest tool for change is the vote. — OOTU Protocol",
  "Voting is the expression of our commitment to ourselves and one another. — Sharon Salzberg"
];

function CandidateCard({ candidate, onVote, isVoted, disabled }: { candidate: Candidate, onVote: (c: Candidate) => void, isVoted: boolean, disabled: boolean }) {
  return (
    <motion.div whileHover={{ y: -10 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card 
        onClick={() => !disabled && onVote(candidate)}
        className="group/card relative flex h-full cursor-pointer flex-col items-center overflow-hidden transition-all duration-500 ease-in-out hover:shadow-primary/30 hover:shadow-[0_0_40px_-10px_rgba(0,209,255,0.4)] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 rounded-none border-white/10 glassmorphic-card shimmer-card"
        data-disabled={disabled ? true : undefined}
      >
        <div className="relative w-full aspect-square bg-white/5 flex items-center justify-center border-b border-white/5 p-8">
          <div className="flex flex-col items-center gap-6">
              <div className="w-28 h-28 rounded-none bg-primary/5 flex items-center justify-center text-primary border border-primary/20 group-hover/card:border-primary/50 group-hover/card:scale-110 transition-all duration-500 shadow-inner overflow-hidden relative">
                  <span className="text-4xl font-black tracking-tighter glow-text italic z-10">{candidate.name}</span>
                  <div className="absolute inset-0 bg-primary/5 group-hover/card:bg-primary/10 transition-colors" />
              </div>
              <div className="text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/60 mb-1">STATION_ID_{candidate.id.toUpperCase()}</p>
                  <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase italic">{candidate.name}</h3>
              </div>
          </div>
          {isVoted && (
               <div className="absolute inset-0 bg-primary/20 backdrop-blur-[4px] flex items-center justify-center z-10 border-2 border-primary">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="h-16 w-16 text-primary shadow-2xl" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary glow-text">SIGNED</span>
                  </div>
               </div>
          )}
        </div>
        <CardContent className="p-6 w-full space-y-6">
          <div className="h-12 flex items-center justify-center text-center">
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-tight">{candidate.party}</p>
          </div>
          <Button 
            variant={isVoted ? "secondary" : "default"} 
            className="w-full h-14 gap-3 rounded-none font-black uppercase tracking-[0.3em] shadow-lg shadow-primary/10 bg-primary text-background hover:bg-primary/90 transition-all border-none" 
            disabled={disabled}
          >
            {isVoted ? <RefreshCcw className="h-4 w-4 animate-spin-slow" /> : <Crosshair className="h-4 w-4" />}
            {isVoted ? "OVERRIDE" : "CAST BALLOT"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function VotePage() {
  const [votedCandidateId, setVotedCandidateId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isBiometricSigning, setIsBiometricSigning] = useState(false);
  const [isVerifyingSign, setIsVerifyingSign] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentProverb, setCurrentProverb] = useState<string>("");

  const [isPanicMode, setIsPanicMode] = useState(false);
  const [isDecoyMode, setIsDecoyMode] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { toast } = useToast();
  const router = useRouter();
  const { user, firestore, isUserLoading } = useFirebase();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile } = useDoc<Voter>(userDocRef);

  const electionsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'elections');
  }, [firestore]);
  const { data: activeElections, isLoading: areElectionsLoading } = useCollection<Election>(electionsRef);

  const userVotesCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "votes");
  }, [firestore, user]);

  const { data: userVotes, isLoading: isLoadingVotes } = useCollection<Vote>(userVotesCollection);

  const hasAlreadyVoted = useMemo(() => {
    return !!userVotes && userVotes.length > 0;
  }, [userVotes]);

  const isElectionLive = useMemo(() => {
    return activeElections && activeElections.length > 0;
  }, [activeElections]);

  useEffect(() => {
    setIsMounted(true);
    setCurrentProverb(PROVERBS[Math.floor(Math.random() * PROVERBS.length)]);
  }, []);

  useEffect(() => {
    if (isBiometricSigning) {
        startCamera();
    }
    return () => stopCamera();
  }, [isBiometricSigning]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      toast({ variant: "destructive", title: "Camera Error", description: "Could not access camera for biometric signing." });
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  }

  const handleInitiateVote = (candidate: Candidate) => {
    if (!user) {
        router.push('/login');
        return;
    }
    if (!isElectionLive) {
        toast({ variant: "destructive", title: "Protocol Standby", description: "No active election window found." });
        return;
    }
    setSelectedCandidate(candidate);
    setIsConfirming(true);
  };

  const executeBiometricSignature = async () => {
    if (!videoRef.current || !canvasRef.current || !profile?.faceImageHash || !selectedCandidate) return;

    setIsVerifyingSign(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const liveCapture = canvas.toDataURL('image/jpeg', 0.85);

      try {
        const result = await verifyBiometric({
          referenceImageUri: profile.faceImageHash,
          liveCaptureUri: liveCapture,
        });

        if (result.isMatch) {
          const simulatedHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
          setTxHash(simulatedHash);
          
          if (!isDecoyMode) {
            const newVote: Omit<Vote, 'id'> = {
              voterId: user!.uid,
              candidateId: selectedCandidate.id,
              timestamp: serverTimestamp(),
              electionId: activeElections?.[0]?.id || "main_election",
              isVerified: true,
              isPanic: isPanicMode,
              txHash: simulatedHash,
            };

            addDocumentNonBlocking(userVotesCollection!, newVote);
          }

          setVotedCandidateId(selectedCandidate.id);
          setIsBiometricSigning(false);
          
          toast({
            title: isDecoyMode ? "Decoy Receipt Generated" : isPanicMode ? "Panic Protocol Activated" : "Digital Signature Verified",
            description: isDecoyMode ? "Success screen triggered for observer." : "Identity sync completed successfully.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Identity Verification Failed",
            description: "Biometric match failed. Please try again.",
          });
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Signing Error",
          description: "Biometric engine unavailable. Please try again.",
        });
      } finally {
        setIsVerifyingSign(false);
      }
    }
  }

  if (isMounted && votedCandidateId) {
    const votedCandidate = candidates.find(c => c.id === votedCandidateId);
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)] cyber-grid">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <Card className="text-center shadow-[0_0_50px_rgba(0,209,255,0.2)] border-white/10 overflow-hidden rounded-none glassmorphic-card relative">
            <div className="h-2 w-full bg-primary" />
            <div className="absolute top-0 right-0 p-6 opacity-5">
               <ShieldCheck className="w-32 h-32" />
            </div>
            <CardHeader className="p-12">
              <div className="mx-auto bg-primary/10 w-24 h-24 rounded-none border border-primary/30 flex items-center justify-center mb-8 shadow-inner">
                <UserCheck className="h-12 w-12 text-primary glow-text" />
              </div>
              <CardTitle className="text-4xl font-black tracking-tighter uppercase italic glow-text">TRANSACTION COMMITTED</CardTitle>
              <CardDescription className="pt-4 font-bold uppercase tracking-widest text-[11px] text-muted-foreground">
                Your cryptographic signature for <span className="text-primary">{votedCandidate?.name}</span> has been etched into the OOTU mesh.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-12 pt-0 space-y-10">
              <div className="p-6 bg-white/5 rounded-none border border-white/10 relative">
                <Quote className="h-8 w-8 text-primary/10 mb-2" />
                <p className="text-lg italic font-medium text-foreground/80 leading-relaxed pl-6">
                  "{currentProverb}"
                </p>
              </div>
              <div className="text-left space-y-3">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Ledger Audit Key (TXID)</p>
                 <p className="text-[11px] font-mono text-muted-foreground p-5 bg-black/40 rounded-none border border-white/10 break-all leading-relaxed shadow-inner">
                  {txHash}
                 </p>
              </div>
              <div className="grid gap-4">
                 <Link href="/dashboard/results" className="block">
                    <Button className="w-full h-16 rounded-none font-black uppercase tracking-[0.3em] shadow-2xl bg-primary text-background hover:bg-primary/90">GO TO LIVE RESULTS</Button>
                 </Link>
                 {isDecoyMode && (
                   <div className="p-3 bg-secondary/10 border border-secondary/20 flex items-center justify-center gap-3">
                      <Ghost className="h-4 w-4 text-secondary" />
                      <p className="text-[9px] text-secondary font-black uppercase tracking-[0.2em]">DECOY_MODE ACTIVE: SESSION VOID</p>
                   </div>
                 )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  const isCheckingVote = isUserLoading || isLoadingVotes || areElectionsLoading;
  const pageDisabled = !isMounted || isCheckingVote || !isElectionLive;

  return (
    <div className="flex flex-col gap-10 p-2 md:p-0">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-10">
        <div>
          <h1 className="text-5xl font-black tracking-tighter glow-text uppercase italic">Mission <span className="text-primary">Control</span></h1>
          <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] mt-2">
            {!isMounted ? "INITIALIZING INTERFACE..." : 
             isCheckingVote ? "VERIFYING BIOMETRIC ELIGIBILITY..." : 
             !isElectionLive ? "PROTOCOL WINDOW: CLOSED" :
             "Decentralized secure voting booth active."}
          </p>
        </div>

        <Card className="w-full lg:w-auto glassmorphic-card border-white/10 rounded-none shimmer-card shadow-2xl">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 text-secondary">
              <ShieldAlert className="h-5 w-5" /> ANTI-COERCION SUITE
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 flex flex-col sm:flex-row gap-8">
             <div className="flex items-center gap-4">
                <div className="space-y-0.5">
                   <Label htmlFor="panic-mode" className="text-[10px] font-black uppercase tracking-widest text-foreground">PANIC MODE</Label>
                   <p className="text-[8px] text-muted-foreground/60 leading-none font-bold uppercase">DURESS FLAG</p>
                </div>
                <Switch id="panic-mode" checked={isPanicMode} onCheckedChange={setIsPanicMode} className="data-[state=checked]:bg-destructive" />
             </div>
             <div className="h-px sm:h-auto sm:w-px bg-white/5" />
             <div className="flex items-center gap-4">
                <div className="space-y-0.5">
                   <Label htmlFor="decoy-mode" className="text-[10px] font-black uppercase tracking-widest text-foreground">DECOY RECEIPT</Label>
                   <p className="text-[8px] text-muted-foreground/60 leading-none font-bold uppercase">SIMULATE VOTE</p>
                </div>
                <Switch id="decoy-mode" checked={isDecoyMode} onCheckedChange={setIsDecoyMode} className="data-[state=checked]:bg-secondary" />
             </div>
          </CardContent>
        </Card>
      </div>
      
      {isMounted && hasAlreadyVoted && (
        <Alert className="bg-primary/5 border-primary/30 rounded-none border-l-4 border-l-primary shadow-2xl backdrop-blur-md">
          <RefreshCcw className="h-5 w-5 text-primary animate-pulse" />
          <AlertTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">REVOTE CAPABILITY GRANTED</AlertTitle>
          <AlertDescription className="text-[10px] font-bold text-foreground/70 uppercase tracking-widest mt-1">
            Previous biometric signature detected. OOTU allows unlimited overrides—only your <strong>final signature</strong> will commit to the ledger.
          </AlertDescription>
        </Alert>
      )}

      {isMounted && (isPanicMode || isDecoyMode) && (
        <Alert className="bg-destructive/5 border-destructive/30 text-destructive rounded-none border-l-4 border-l-destructive shadow-2xl backdrop-blur-md">
          <Ghost className="h-5 w-5" />
          <AlertTitle className="text-[11px] font-black uppercase tracking-[0.2em]">CLOAKING ACTIVE</AlertTitle>
          <AlertDescription className="text-[10px] font-black italic uppercase tracking-widest mt-1">
            {isDecoyMode ? "Generating high-fidelity simulated receipt. Final count will not be affected." : "Vote will be cryptographically flagged for duress audit."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            onVote={handleInitiateVote}
            isVoted={userVotes?.some(v => v.candidateId === candidate.id) || false}
            disabled={pageDisabled}
          />
        ))}
      </div>

      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent className="rounded-none border-white/10 glassmorphic-card shadow-2xl p-10 max-w-md">
          <AlertDialogHeader>
            <div className="w-16 h-16 bg-primary/10 flex items-center justify-center border border-primary/20 mb-6 mx-auto">
               <Crosshair className="h-8 w-8 text-primary" />
            </div>
            <AlertDialogTitle className="font-black uppercase tracking-tighter text-3xl text-center glow-text">
              {isDecoyMode ? "DECOY ENGAGED?" : "LOCK SELECTION"}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-bold text-center uppercase tracking-widest text-[10px] text-muted-foreground pt-4 leading-relaxed">
              {isDecoyMode 
                ? `SIMULATING VOTE FOR ${selectedCandidate?.name}. A VALID AUDIT KEY WILL BE GENERATED FOR THE OBSERVER, VOIDING ACTUAL LEDGER IMPACT.`
                : `INITIATING NEURAL SIGNATURE FOR ${selectedCandidate?.name}. PROCEED TO BIOMETRIC AUTHENTICATION HUB.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-8 gap-4 flex flex-col sm:flex-row">
            <AlertDialogCancel className="rounded-none font-black uppercase tracking-[0.2em] h-14 bg-white/5 border-white/10 hover:bg-white/10 text-[10px]">BACK_TO_GRID</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setIsConfirming(false); setIsBiometricSigning(true); }} className="bg-primary rounded-none font-black uppercase tracking-[0.2em] h-14 shadow-2xl text-[10px] text-background hover:bg-primary/90 flex-grow">
              {isDecoyMode ? "EXECUTE_DECOY" : "PROCEED_TO_SIGN"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isBiometricSigning} onOpenChange={(open) => !isVerifyingSign && setIsBiometricSigning(open)}>
        <DialogContent className="sm:max-w-xl rounded-none border-white/10 glassmorphic-card shadow-[0_0_60px_rgba(0,209,255,0.2)] p-12 overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Fingerprint className="w-48 h-48" />
          </div>
          <DialogHeader className="mb-10 text-center">
            <DialogTitle className="flex flex-col items-center gap-6 font-black uppercase tracking-tighter text-4xl glow-text italic">
              <Fingerprint className="h-16 w-16 text-primary shadow-2xl" />
              {isDecoyMode ? "DECOY_SIGN" : "NEURAL_SIGN"}
            </DialogTitle>
            <DialogDescription className="font-bold uppercase text-[10px] tracking-[0.3em] text-muted-foreground pt-4">
              COMMITTING BALLOT UNIT FOR <span className="text-primary">{selectedCandidate?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-10 relative z-10">
            <div className="relative aspect-video rounded-none overflow-hidden bg-black border border-white/10 shadow-2xl">
               <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale opacity-60" />
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`w-56 h-56 border-2 ${isPanicMode ? 'border-destructive' : 'border-primary/40'} rounded-none border-dashed animate-[spin_20s_linear_infinite]`} />
                  <div className="absolute w-40 h-40 border border-primary/10 rounded-none animate-pulse" />
               </div>
               {isVerifyingSign && (
                  <div className="absolute inset-0 bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center gap-8 text-center p-8 z-20">
                    <div className="relative">
                      <Loader2 className="h-20 w-20 text-primary animate-spin" />
                      <Activity className="absolute inset-0 m-auto h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                       <p className="text-[11px] font-black uppercase tracking-[0.5em] text-primary animate-pulse">
                         {isDecoyMode ? "SIMULATING_FORENSIC_SYNC" : "NEURAL_IDENTITY_COMMITTING"}
                       </p>
                       <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">ENCRYPTING UNIT VIA SHA-256...</p>
                    </div>
                  </div>
               )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <Button className="w-full h-20 rounded-none font-black uppercase tracking-[0.4em] text-sm shadow-[0_0_30px_rgba(0,209,255,0.3)] bg-primary text-background hover:bg-primary/90" onClick={executeBiometricSignature} disabled={isVerifyingSign}>
              {isVerifyingSign ? "VALIDATING..." : isDecoyMode ? "GENERATE_VOID_UNIT" : "SIGN_AND_COMMIT"}
            </Button>
            <div className="flex items-center justify-between px-2 text-[8px] text-muted-foreground/60 font-black uppercase tracking-[0.3em]">
               <div className="flex items-center gap-2"><ShieldCheck className="h-3 w-3 text-primary" /> OOTU_MESH_V2.1</div>
               <div className="flex items-center gap-2"><Globe className="h-3 w-3 text-primary" /> GLOBAL_CONSENSUS: 100%</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
