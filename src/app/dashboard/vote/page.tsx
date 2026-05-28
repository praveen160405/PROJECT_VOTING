"use client"
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  Loader2, 
  Camera, 
  Fingerprint, 
  ShieldCheck,
  ShieldAlert,
  Ghost,
  RefreshCcw,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Candidate, Vote, Election, Voter } from "@/lib/types";
import { useFirebase, useCollection, addDocumentNonBlocking, useMemoFirebase, useDoc } from "@/firebase";
import { verifyBiometric } from "@/ai/flows/verify-biometric-flow";
import { PROVERBS } from "@/lib/proverbs";

function CandidateCard({ candidate, onVote, isVoted, disabled }: { candidate: Candidate, onVote: (c: Candidate) => void, isVoted: boolean, disabled: boolean }) {
  return (
    <motion.div whileHover={{ y: -5 }}>
      <Card 
        onClick={() => !disabled && onVote(candidate)}
        className="group relative flex h-full cursor-pointer flex-col items-center overflow-hidden transition-all rounded-2xl border-white/10 glassmorphic-card shimmer-card data-[disabled=true]:opacity-40 data-[disabled=true]:cursor-not-allowed"
        data-disabled={disabled}
      >
        <div className="relative w-full aspect-square bg-white/5 flex items-center justify-center border-b border-white/5">
          <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                  <span className="text-3xl font-black italic">{candidate.name}</span>
              </div>
              <h3 className="text-xl font-bold uppercase italic">{candidate.name}</h3>
          </div>
          {isVoted && (
               <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex items-center justify-center z-10 border-2 border-primary">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
               </div>
          )}
        </div>
        <CardContent className="p-6 w-full">
          <p className="text-[10px] font-bold text-muted-foreground uppercase text-center mb-6 tracking-widest">{candidate.party}</p>
          <Button className="w-full h-12 rounded-xl font-black uppercase tracking-widest bg-primary text-background hover:bg-primary/90">
            {isVoted ? "Override" : "Cast Ballot"}
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
    setCurrentProverb(PROVERBS[Math.floor(Math.random() * PROVERBS.length)].text);
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
      toast({ variant: "destructive", title: "Camera Error", description: "Access required for signing." });
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  }

  const handleInitiateVote = (candidate: Candidate) => {
    if (!user) { router.push('/login'); return; }
    if (!isElectionLive) { toast({ variant: "destructive", title: "Window Closed" }); return; }
    setSelectedCandidate(candidate);
    setIsConfirming(true);
  };

  const executeBiometricSignature = async () => {
    if (!videoRef.current || !canvasRef.current || !profile?.faceImageHash || !selectedCandidate) return;

    setIsVerifyingSign(true);
    const canvas = canvasRef.current;
    canvas.width = 400; canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
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
          toast({ title: "Signature Verified" });
        } else {
          toast({ variant: "destructive", title: "Mismatch Detected" });
        }
      } catch (error: any) {
        toast({ variant: "destructive", title: "Signing Error" });
      } finally {
        setIsVerifyingSign(false);
      }
    }
  }

  if (isMounted && votedCandidateId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-lg w-full text-center glassmorphic-card rounded-2xl shadow-2xl border-t-4 border-t-primary">
          <CardHeader className="p-12">
            <UserCheck className="mx-auto h-12 w-12 text-primary mb-6" />
            <CardTitle className="text-3xl font-black uppercase italic">Signature Committed</CardTitle>
            <CardDescription className="font-bold uppercase text-[10px] tracking-widest pt-4">Digital Audit Receipt generated.</CardDescription>
          </CardHeader>
          <CardContent className="px-12 pb-12 space-y-8">
            <p className="text-lg italic text-foreground/80 leading-relaxed">"{currentProverb}"</p>
            <div className="p-4 bg-black/20 font-mono text-[10px] break-all border border-white/5 rounded-xl">{txHash}</div>
            <Link href="/dashboard/results" className="block">
                <Button className="w-full h-14 rounded-xl font-black uppercase tracking-widest bg-primary text-background">View Ledger</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCheckingVote = isUserLoading || isLoadingVotes || areElectionsLoading;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col lg:flex-row justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase italic">Booth <span className="text-primary">Terminal</span></h1>
          <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest mt-2">Decentralized Secure Ballot Submission</p>
        </div>

        <Card className="glassmorphic-card rounded-2xl p-4 flex gap-6">
           <div className="flex items-center gap-3">
              <Label className="text-[10px] font-bold uppercase">Panic Mode</Label>
              <Switch checked={isPanicMode} onCheckedChange={setIsPanicMode} className="data-[state=checked]:bg-destructive" />
           </div>
           <div className="w-px bg-white/5" />
           <div className="flex items-center gap-3">
              <Label className="text-[10px] font-bold uppercase">Decoy Receipt</Label>
              <Switch checked={isDecoyMode} onCheckedChange={setIsDecoyMode} className="data-[state=checked]:bg-secondary" />
           </div>
        </Card>
      </div>
      
      {isMounted && hasAlreadyVoted && (
        <Alert className="bg-primary/5 border-primary/20 rounded-xl border-l-4 border-l-primary shadow-2xl backdrop-blur-md">
          <RefreshCcw className="h-4 w-4 text-primary animate-spin-slow" />
          <AlertTitle className="text-[10px] font-bold uppercase tracking-widest">Revote Granted</AlertTitle>
          <AlertDescription className="text-[10px] uppercase">Only your final signature will commit to the ledger.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {candidates.map((c) => (
          <CandidateCard key={c.id} candidate={c} onVote={handleInitiateVote} isVoted={userVotes?.some(v => v.candidateId === c.id) || false} disabled={isCheckingVote || !isElectionLive} />
        ))}
      </div>

      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent className="rounded-2xl glassmorphic-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase italic">Lock Selection?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs uppercase font-bold text-muted-foreground">Proceeding to neural identity signature for {selectedCandidate?.name}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl uppercase font-bold text-[10px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setIsConfirming(false); setIsBiometricSigning(true); }} className="rounded-xl bg-primary text-background uppercase font-bold text-[10px]">Sign & Commit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isBiometricSigning} onOpenChange={(o) => !isVerifyingSign && setIsBiometricSigning(o)}>
        <DialogContent className="rounded-2xl glassmorphic-card p-10">
          <DialogHeader className="text-center mb-6">
            <DialogTitle className="font-black uppercase italic text-2xl">Neural Sign</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase">Biometric Consensus window active.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-white/10">
               <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale" />
               {isVerifyingSign && (
                  <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-20">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-[10px] font-bold uppercase animate-pulse">Syncing...</p>
                  </div>
               )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <Button className="w-full h-14 rounded-xl font-black uppercase tracking-widest bg-primary text-background" onClick={executeBiometricSignature} disabled={isVerifyingSign}>
              Execute Signature
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}