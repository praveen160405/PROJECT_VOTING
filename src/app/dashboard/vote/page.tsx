
"use client"
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2, Quote, AlertCircle, Timer, Globe, Camera, Fingerprint, ShieldCheck } from 'lucide-react';
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
  const isDisabled = isVoted || disabled;

  return (
    <Card 
      onClick={() => !isDisabled && onVote(candidate)}
      className="group/card relative flex h-full cursor-pointer flex-col items-center overflow-hidden transition-all duration-300 ease-in-out hover:shadow-primary/20 hover:shadow-xl hover:-translate-y-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60"
      data-disabled={isDisabled ? true : undefined}
    >
      <div className="relative w-full aspect-square bg-primary/5 flex items-center justify-center border-b p-6">
        <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 group-hover/card:scale-110 transition-transform duration-300">
                <span className="text-3xl font-black tracking-tighter">{candidate.name}</span>
            </div>
            <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Official Ballot Symbol</p>
                <h3 className="text-xl font-bold text-foreground">{candidate.name}</h3>
            </div>
        </div>
        {isVoted && (
             <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-primary" />
             </div>
        )}
      </div>
      <CardContent className="p-4 w-full bg-card">
        <div className="mb-4">
             <p className="text-xs font-medium text-muted-foreground leading-relaxed h-8 line-clamp-2">{candidate.party}</p>
        </div>
        <Button 
          variant={isVoted ? "secondary" : "default"} 
          className="w-full gap-2" 
          disabled={isDisabled}
        >
          {isVoted ? <CheckCircle2 className="h-4 w-4" /> : null}
          {isVoted ? "Vote Cast" : "Cast Vote"}
        </Button>
      </CardContent>
    </Card>
  );
}


export default function VotePage() {
  const [votedCandidateId, setVotedCandidateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isBiometricSigning, setIsBiometricSigning] = useState(false);
  const [isVerifyingSign, setIsVerifyingSign] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentProverb, setCurrentProverb] = useState<string>("");

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
        toast({ variant: "destructive", title: "Not Logged In", description: "Please log in to vote." });
        router.push('/login');
        return;
    }
    if (!isElectionLive) {
        toast({ variant: "destructive", title: "Protocol Standby", description: "No active election window found on the ledger." });
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
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const liveCapture = canvas.toDataURL('image/jpeg', 0.8);

      try {
        const result = await verifyBiometric({
          referenceImageUri: profile.faceImageHash,
          liveCaptureUri: liveCapture,
        });

        if (result.isMatch) {
          const simulatedHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
          setTxHash(simulatedHash);
          
          const newVote: Omit<Vote, 'id'> = {
            voterId: user!.uid,
            candidateId: selectedCandidate.id,
            timestamp: serverTimestamp(),
            electionId: activeElections?.[0]?.id || "main_election",
            isVerified: true,
            txHash: simulatedHash,
          };

          addDocumentNonBlocking(userVotesCollection!, newVote);
          setVotedCandidateId(selectedCandidate.id);
          setIsBiometricSigning(false);
          
          toast({
            title: "Digital Signature Verified",
            description: "Your biometric ID has permanently signed this ballot.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Identity Verification Failed",
            description: "Biometric match failed. Please ensure clear lighting and try again.",
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Forensic Node Unavailable",
          description: "Could not verify biometric signature at this time.",
        });
      } finally {
        setIsVerifyingSign(false);
      }
    }
  }

  useEffect(() => {
    if (votedCandidateId) {
      const timer = setTimeout(() => {
        router.push('/dashboard/results');
      }, 6000); 
      return () => clearTimeout(timer);
    }
  }, [votedCandidateId, router]);
  
  if (isMounted && votedCandidateId) {
    const votedCandidate = candidates.find(c => c.id === votedCandidateId);
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Card className="text-center shadow-2xl border-primary/20 overflow-hidden">
            <div className="h-1.5 w-full bg-primary" />
            <CardHeader>
              <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">Vote Confirmed</CardTitle>
              <CardDescription className="pt-2">
                Your choice for <strong>{votedCandidate?.name}</strong> is etched into the OOTU protocol.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg border border-dashed relative">
                <Quote className="absolute -top-3 -left-1 h-6 w-6 text-primary/20" />
                <p className="text-sm italic text-muted-foreground leading-relaxed">
                  "{currentProverb}"
                </p>
              </div>
              <div className="text-left space-y-1">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Digital Audit Receipt</p>
                 <p className="text-[10px] font-mono text-muted-foreground p-3 bg-muted rounded border overflow-hidden text-ellipsis whitespace-nowrap">
                  {txHash}
                 </p>
              </div>
              <Link href="/dashboard/results" className="block">
                <Button className="w-full">
                  Go to Results
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  const isCheckingVote = isUserLoading || isLoadingVotes || areElectionsLoading;
  const isVoted = hasAlreadyVoted;
  const pageDisabled = !isMounted || isCheckingVote || isSubmitting || !isElectionLive;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OOTU Voting Booth</h1>
          <p className="text-muted-foreground">
            {!isMounted ? "Initialising Secure Link..." : 
             isCheckingVote ? "Verifying Eligibility..." : 
             !isElectionLive ? "System on Standby (No Active Window)" :
             isVoted ? "Vote Recorded Successfully" : 
             "Cast your secure, anonymous ballot."}
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="gap-2 px-3 py-1 bg-primary/5 text-primary border-primary/20">
            <ShieldCheck className="h-4 w-4" /> Biometric Identity Active
          </Badge>
        </div>
      </div>
      
      {isMounted && isVoted && (
        <Alert variant="default" className="bg-primary/5 border-primary/20 text-primary">
          <CheckCircle2 className="h-4 w-4 !text-primary" />
          <AlertTitle>Vote Recorded</AlertTitle>
          <AlertDescription>
            Your identity has successfully signed a ballot for this window. Protocol integrity allows only one submission.
          </AlertDescription>
        </Alert>
      )}

      {isMounted && !isCheckingVote && !isElectionLive && (
        <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Active Election Protocol</AlertTitle>
          <AlertDescription>
            The OOTU ledger is currently in standby. No active protocol windows have been opened by administrators.
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
            className="h-full"
          >
            <CandidateCard
              candidate={candidate}
              onVote={handleInitiateVote}
              isVoted={isVoted}
              disabled={pageDisabled}
            />
          </motion.div>
        ))}
      </div>

      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Final Selection</AlertDialogTitle>
            <AlertDialogDescription>
              You are selecting <strong>{selectedCandidate?.name}</strong>. To finalize this choice, you will be asked to perform a Digital Biometric Signature scan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Candidates</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setIsConfirming(false); setIsBiometricSigning(true); }} className="bg-primary">
              Proceed to Signing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isBiometricSigning} onOpenChange={(open) => !isVerifyingSign && setIsBiometricSigning(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" />
              Digital Biometric Signature
            </DialogTitle>
            <DialogDescription>
              Confirming your ballot for {selectedCandidate?.name}. Look into the camera to sign.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black border-2 border-primary/20">
               <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale brightness-110" />
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-primary/40 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
               </div>
               {isVerifyingSign && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-center p-4">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">Validating Signature...</p>
                  </div>
               )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <Button className="w-full h-12" onClick={executeBiometricSignature} disabled={isVerifyingSign}>
              {isVerifyingSign ? "Signing Ballot..." : "Sign & Cast Vote"}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider font-bold">
               Consensus Protocol: Biometric Auth-V2
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

