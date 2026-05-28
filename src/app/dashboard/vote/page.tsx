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
  Activity,
  Zap,
  Network
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
    <motion.div whileHover={{ y: -8, scale: 1.02 }}>
      <Card 
        onClick={() => !disabled && onVote(candidate)}
        className="group relative flex h-full cursor-pointer flex-col items-center overflow-hidden transition-all rounded-3xl border-white/5 glassmorphic-card shimmer-card data-[disabled=true]:opacity-40 data-[disabled=true]:cursor-not-allowed"
        data-disabled={disabled}
      >
        <div className="relative w-full aspect-square bg-white/5 flex items-center justify-center border-b border-white/5">
          <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-3xl bg-primary/5 flex items-center justify-center text-primary border border-primary/20 shadow-inner group-hover:bg-primary/10 transition-colors">
                  <span className="text-4xl font-black italic glow-text">{candidate.name[0]}</span>
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">{candidate.name}</h3>
          </div>
          {isVoted && (
               <div className="absolute inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center z-10 border-2 border-primary">
                  <CheckCircle2 className="h-16 w-16 text-primary glow-text" />
               </div>
          )}
        </div>
        <CardContent className="p-8 w-full">
          <p className="text-[10px] font-black text-primary/70 uppercase text-center mb-6 tracking-[0.3em]">{candidate.party}</p>
          <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] bg-primary text-background hover:bg-primary/90 shadow-xl shadow-primary/10">
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

  /**
   * Check if the voter has already participated in the current election window.
   * This is used to enable the Anti-Coercion Revote alert.
   */
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
      toast({ variant: "destructive", title: "Camera Error", description: "Access required for biometric signing." });
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
    if (!isElectionLive) { 
      toast({ 
        variant: "destructive", 
        title: "PROTOCOL WINDOW CLOSED", 
        description: "No active election detected on the ledger." 
      }); 
      return; 
    }
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
          toast({ title: "SIGNATURE COMMITTED", description: "Ledger sync successful." });
        } else {
          toast({ variant: "destructive", title: "SIGNATURE MISMATCH", description: "Neural signature does not match registry." });
        }
      } catch (error: any) {
        toast({ variant: "destructive", title: "PROTOCOL ERROR", description: "Neural sync node timeout." });
      } finally {
        setIsVerifyingSign(false);
      }
    }
  }

  if (isMounted && votedCandidateId) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Card className="max-w-xl w-full text-center glassmorphic-card rounded-3xl shadow-2xl border-t-4 border-t-primary shimmer-card overflow-hidden">
          <CardHeader className="p-12">
            <UserCheck className="mx-auto h-16 w-16 text-primary mb-8 glow-text" />
            <CardTitle className="text-4xl font-black uppercase italic tracking-tighter glow-text">Signature Committed</CardTitle>
            <CardDescription className="font-black uppercase text-[10px] tracking-[0.4em] pt-6 text-primary/60">Digital Audit Receipt Generated</CardDescription>
          </CardHeader>
          <CardContent className="px-12 pb-12 space-y-10">
            <div className="p-8 bg-primary/5 rounded-2xl border border-primary/20 italic font-medium leading-relaxed text-lg">
              "{currentProverb}"
            </div>
            <div className="p-6 bg-black/40 font-mono text-[11px] break-all border border-white/5 rounded-2xl tracking-widest text-primary/80">
              {txHash}
            </div>
            <Link href="/dashboard/results" className="block">
                <Button className="w-full h-16 rounded-2xl font-black uppercase tracking-[0.3em] bg-primary text-background shadow-2xl shadow-primary/20">VIEW GLOBAL LEDGER</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCheckingVote = isUserLoading || isLoadingVotes || areElectionsLoading;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter glow-text">Booth <span className="text-primary">Terminal</span></h1>
          <p className="text-muted-foreground font-black uppercase text-[10px] tracking-[0.5em] mt-3">Decentralized Secure Ballot Submission</p>
        </div>

        <Card className="glassmorphic-card rounded-2xl p-6 flex items-center gap-8 shadow-xl border-white/5">
           <div className="flex items-center gap-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-destructive">Panic Mode</Label>
              <Switch checked={isPanicMode} onCheckedChange={setIsPanicMode} className="data-[state=checked]:bg-destructive" />
           </div>
           <div className="w-px h-8 bg-white/10" />
           <div className="flex items-center gap-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-secondary">Decoy Receipt</Label>
              <Switch checked={isDecoyMode} onCheckedChange={setIsDecoyMode} className="data-[state=checked]:bg-secondary" />
           </div>
        </Card>
      </div>
      
      {isMounted && hasAlreadyVoted && (
        <Alert className="bg-primary/5 border-primary/30 rounded-2xl border-l-4 border-l-primary shadow-2xl backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <RefreshCcw className="h-12 w-12 text-primary animate-spin-slow" />
          </div>
          <AlertTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
            <RefreshCcw className="h-4 w-4 animate-spin-slow" /> REVOTE CAPABILITY GRANTED
          </AlertTitle>
          <AlertDescription className="text-[10px] uppercase font-bold tracking-widest mt-1 opacity-70">
            Anti-coercion protocol active: Only your final biometric signature will commit to the permanent ledger.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
        {candidates.map((c) => (
          <CandidateCard key={c.id} candidate={c} onVote={handleInitiateVote} isVoted={userVotes?.some(v => v.candidateId === c.id) || false} disabled={isCheckingVote || !isElectionLive} />
        ))}
      </div>

      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent className="rounded-3xl glassmorphic-card border-primary/20 p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase italic text-2xl tracking-tighter">LOCK SELECTION?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs uppercase font-bold text-muted-foreground tracking-widest leading-relaxed mt-4">
              Proceeding to neural identity signature for <span className="text-primary">{selectedCandidate?.name}</span>. This action will commit an audit receipt to the mesh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4">
            <AlertDialogCancel className="rounded-2xl uppercase font-black tracking-widest text-[10px] h-12 border-white/10 hover:bg-white/5">CANCEL</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setIsConfirming(false); setIsBiometricSigning(true); }} className="rounded-2xl bg-primary text-background uppercase font-black tracking-widest text-[10px] h-12 shadow-xl shadow-primary/20">SIGN & COMMIT</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isBiometricSigning} onOpenChange={(o) => !isVerifyingSign && setIsBiometricSigning(o)}>
        <DialogContent className="rounded-3xl glassmorphic-card p-12 border-primary/20">
          <DialogHeader className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
               <Fingerprint className="h-8 w-8 text-primary glow-text" />
            </div>
            <DialogTitle className="font-black uppercase italic text-3xl tracking-tighter glow-text">Neural Sign</DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 pt-2">Biometric Consensus Active</DialogDescription>
          </DialogHeader>
          <div className="space-y-8">
            <div className="aspect-video bg-black rounded-3xl overflow-hidden relative border-2 border-primary/20 shadow-2xl">
               <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale brightness-75" />
               <div className="absolute inset-0 border-[20px] border-primary/5 pointer-events-none" />
               {isVerifyingSign && (
                  <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center gap-6 z-20">
                    <Activity className="h-12 w-12 text-primary animate-pulse" />
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] animate-pulse">Syncing Signature...</p>
                  </div>
               )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <Button className="w-full h-18 rounded-2xl font-black uppercase tracking-[0.3em] bg-primary text-background shadow-2xl shadow-primary/20" onClick={executeBiometricSignature} disabled={isVerifyingSign}>
              {isVerifyingSign ? "COMMITTING..." : "EXECUTE SIGNATURE"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
