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
  ShieldOff
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
    <Card 
      onClick={() => !disabled && onVote(candidate)}
      className="group/card relative flex h-full cursor-pointer flex-col items-center overflow-hidden transition-all duration-300 ease-in-out hover:shadow-primary/20 hover:shadow-2xl hover:-translate-y-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 rounded-none border-primary/10 shimmer-card"
      data-disabled={disabled ? true : undefined}
    >
      <div className="relative w-full aspect-square bg-primary/5 flex items-center justify-center border-b p-6">
        <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-none bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 group-hover/card:scale-110 transition-transform duration-300 shadow-lg shadow-primary/5">
                <span className="text-3xl font-black tracking-tighter">{candidate.name}</span>
            </div>
            <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Official Ballot Symbol</p>
                <h3 className="text-xl font-black text-foreground tracking-tighter">{candidate.name}</h3>
            </div>
        </div>
        {isVoted && (
             <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                <CheckCircle2 className="h-12 w-12 text-primary" />
             </div>
        )}
      </div>
      <CardContent className="p-4 w-full bg-card">
        <div className="mb-4">
             <p className="text-xs font-bold text-muted-foreground leading-relaxed h-8 line-clamp-2 uppercase tracking-tight">{candidate.party}</p>
        </div>
        <Button 
          variant={isVoted ? "secondary" : "default"} 
          className="w-full gap-2 rounded-none font-black uppercase tracking-widest shadow-lg shadow-primary/10" 
          disabled={disabled}
        >
          {isVoted ? <CheckCircle2 className="h-4 w-4" /> : null}
          {isVoted ? "Re-sign Ballot" : "Cast Vote"}
        </Button>
      </CardContent>
    </Card>
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

  // Anti-Coercion States
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
    if (userVotes && userVotes.length > 0) return true;
    return false;
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
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="text-center shadow-2xl border-primary/20 overflow-hidden rounded-none glow-box">
            <div className="h-1.5 w-full bg-primary" />
            <CardHeader>
              <div className="mx-auto bg-primary/10 w-16 h-16 rounded-none border border-primary/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-3xl font-black tracking-tighter uppercase">Vote Confirmed</CardTitle>
              <CardDescription className="pt-2 font-medium">
                Your choice for <strong>{votedCandidate?.name}</strong> is etched into the OOTU protocol.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-none border border-dashed relative">
                <Quote className="absolute -top-3 -left-1 h-6 w-6 text-primary/20" />
                <p className="text-sm italic text-muted-foreground leading-relaxed">
                  "{currentProverb}"
                </p>
              </div>
              <div className="text-left space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Digital Audit Receipt</p>
                 <p className="text-[10px] font-mono text-muted-foreground p-3 bg-muted rounded-none border overflow-hidden text-ellipsis whitespace-nowrap">
                  {txHash}
                 </p>
              </div>
              <div className="space-y-2">
                 <Link href="/dashboard/results" className="block">
                    <Button className="w-full h-12 rounded-none font-black uppercase tracking-widest shadow-xl shadow-primary/20">Go to Results</Button>
                 </Link>
                 {isDecoyMode && (
                   <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter text-center">
                     Decoy Protocol Active: This session left no real ledger trace.
                   </p>
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OOTU Voting Booth</h1>
          <p className="text-muted-foreground font-medium">
            {!isMounted ? "Initialising..." : 
             isCheckingVote ? "Verifying Eligibility..." : 
             !isElectionLive ? "No Active Election" :
             "Secure, anonymous, and anti-coercive ballot submission."}
          </p>
        </div>

        <Card className="w-full md:w-auto bg-primary/5 border-primary/20 border-dashed rounded-none shimmer-card">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" /> Anti-Coercion Suite
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
             <div className="flex items-center justify-between gap-8">
                <div className="space-y-0.5">
                   <Label htmlFor="panic-mode" className="text-xs font-black uppercase tracking-tight">Panic Mode</Label>
                   <p className="text-[9px] text-muted-foreground leading-none font-medium">Internal duress flag active.</p>
                </div>
                <Switch id="panic-mode" checked={isPanicMode} onCheckedChange={setIsPanicMode} />
             </div>
             <div className="flex items-center justify-between gap-8">
                <div className="space-y-0.5">
                   <Label htmlFor="decoy-mode" className="text-xs font-black uppercase tracking-tight">Decoy Receipt</Label>
                   <p className="text-[9px] text-muted-foreground leading-none font-medium">Simulate vote for observer.</p>
                </div>
                <Switch id="decoy-mode" checked={isDecoyMode} onCheckedChange={setIsDecoyMode} />
             </div>
          </CardContent>
        </Card>
      </div>
      
      {isMounted && hasAlreadyVoted && (
        <Alert className="bg-primary/5 border-primary/20 rounded-none border-l-4 border-l-primary shadow-lg shadow-primary/5">
          <RefreshCcw className="h-4 w-4 text-primary" />
          <AlertTitle className="text-xs font-black uppercase tracking-widest">Revote Capability Active</AlertTitle>
          <AlertDescription className="text-xs font-medium">
            You have already cast a vote. OOTU allows you to change your vote as many times as you need—only the <strong>last biometric signature</strong> is counted in the final tally.
          </AlertDescription>
        </Alert>
      )}

      {isMounted && (isPanicMode || isDecoyMode) && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-600 rounded-none border-l-4 border-l-red-500">
          <Ghost className="h-4 w-4" />
          <AlertTitle className="text-xs font-black uppercase tracking-widest">Cloaking Engaged</AlertTitle>
          <AlertDescription className="text-xs font-black italic uppercase tracking-tight">
            {isDecoyMode ? "This session will generate a valid-looking receipt but will NOT affect the final count." : "This vote will be flagged internally as coerced for legal audit."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {candidates.map((candidate) => (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CandidateCard
              candidate={candidate}
              onVote={handleInitiateVote}
              isVoted={userVotes?.some(v => v.candidateId === candidate.id) || false}
              disabled={pageDisabled}
            />
          </motion.div>
        ))}
      </div>

      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent className="rounded-none border-2 border-primary/20 glow-box">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-tight">
              {isDecoyMode ? "Initiate Decoy Protocol?" : "Confirm Final Selection"}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-medium">
              {isDecoyMode 
                ? `You are about to simulate a vote for ${selectedCandidate?.name}. A digital receipt will be generated for your observer, but the OOTU ledger will remain unchanged.`
                : `You are selecting ${selectedCandidate?.name}. You will be asked to perform a Biometric Signature scan to finalize.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none font-bold uppercase tracking-widest">Review Choice</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setIsConfirming(false); setIsBiometricSigning(true); }} className="bg-primary rounded-none font-black uppercase tracking-widest shadow-lg shadow-primary/20">
              {isDecoyMode ? "Generate Decoy" : "Proceed to Signing"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isBiometricSigning} onOpenChange={(open) => !isVerifyingSign && setIsBiometricSigning(open)}>
        <DialogContent className="sm:max-w-md rounded-none border-2 border-primary/40 glow-box">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tighter">
              <Fingerprint className="h-5 w-5 text-primary" />
              {isDecoyMode ? "Decoy Authentication" : "Biometric Identity Sync"}
            </DialogTitle>
            <DialogDescription className="font-medium">
              Confirming ballot for {selectedCandidate?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="relative aspect-video rounded-none overflow-hidden bg-black border-2 border-primary/20">
               <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`w-48 h-48 border-2 ${isPanicMode ? 'border-red-500' : 'border-primary/40'} rounded-none border-dashed animate-[spin_10s_linear_infinite]`} />
               </div>
               {isVerifyingSign && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-center p-4 z-20">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">
                      {isDecoyMode ? "Simulating Forensic Audit..." : "Neural Identity Sync Active"}
                    </p>
                  </div>
               )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <Button className="w-full h-14 rounded-none font-black uppercase tracking-widest shadow-xl shadow-primary/20" onClick={executeBiometricSignature} disabled={isVerifyingSign}>
              {isVerifyingSign ? "Verifying..." : isDecoyMode ? "Generate Fake Receipt" : "Sign & Cast Vote"}
            </Button>
            <div className="flex items-center justify-center gap-2 text-[8px] text-muted-foreground font-black uppercase tracking-widest">
               <ShieldCheck className="h-2 w-2 text-primary" /> OOTU Anti-Coercion Protocol Active
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}