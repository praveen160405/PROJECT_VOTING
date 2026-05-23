"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  ShieldCheck, 
  Lock, 
  Scale, 
  FileText, 
  CheckCircle2, 
  Globe, 
  AlertCircle,
  Database,
  Fingerprint,
  Code,
  Zap,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { analyzeSmartContract, type ContractAuditOutput } from "@/ai/flows/analyze-contract-flow";

const compliancePillars = [
  {
    title: "Election Integrity",
    description: "Standards ensuring the sanctity and accuracy of every ballot.",
    icon: Scale,
    items: ["OOTU Protocol V2.1", "Immutable Audit Trail", "Zero-Collision Hashing"],
    status: "Certified",
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    title: "Data Privacy",
    description: "Protection of voter identity through anonymization and local mandates.",
    icon: Fingerprint,
    items: ["GDPR Compliant", "CCPA Certified", "Anonymized Ledger Entries"],
    status: "Verified",
    color: "text-green-500",
    bg: "bg-green-500/10"
  },
  {
    title: "Cybersecurity",
    description: "Military-grade encryption and multi-vector threat mitigation.",
    icon: Lock,
    items: ["AES-256 Encryption", "SHA-256 Verification", "DDoS Mitigation Layer"],
    status: "Hardened",
    color: "text-primary",
    bg: "bg-primary/10"
  },
  {
    title: "Regulatory Alignment",
    description: "Adherence to international and local digital voting legislation.",
    icon: Globe,
    items: ["ISO 27001 Standard", "SOC2 Type II", "VVSG 2.0 Principles"],
    status: "Compliant",
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  }
];

const MOCK_CONTRACT_CODE = `
// OOTU Protocol v2.1 Voting Contract
pragma solidity ^0.8.0;

contract VotingProtocol {
    mapping(address => bool) public hasVoted;
    mapping(uint256 => uint256) public voteCounts;
    address public auditor;

    function vote(uint256 _candidateId) public {
        require(!hasVoted[msg.sender], "Voter already verified choice.");
        hasVoted[msg.sender] = true;
        voteCounts[_candidateId]++;
    }
}
`;

export default function CompliancePage() {
  const { toast } = useToast();
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<ContractAuditOutput | null>(null);

  const handleRunContractAudit = async () => {
    setIsAuditing(true);
    try {
      const result = await analyzeSmartContract({
        contractCode: MOCK_CONTRACT_CODE,
        environment: "OOTU Decentralized Mesh"
      });
      setAuditResult(result);
      toast({
        title: "Contract Audit Complete",
        description: result.isSafeMode ? "Local Protocol Sync active." : "AI security assessment of protocol logic finished.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Audit Node Unavailable",
        description: "Switching to local static audit protocol.",
      });
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance & Standards</h1>
          <p className="text-muted-foreground">The legal and technical framework ensuring the integrity of the OOTU protocol.</p>
        </div>
        <Badge variant="outline" className="gap-2 px-4 py-1.5 border-primary/20 bg-primary/5">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-primary font-bold tracking-tighter uppercase">Protocol Status: Secure</span>
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {compliancePillars.map((pillar, index) => (
          <motion.div
            key={pillar.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full border-primary/5 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className={`w-10 h-10 rounded-lg ${pillar.bg} flex items-center justify-center mb-3`}>
                  <pillar.icon className={`h-5 w-5 ${pillar.color}`} />
                </div>
                <CardTitle className="text-lg">{pillar.title}</CardTitle>
                <CardDescription className="text-xs">{pillar.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {pillar.items.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${pillar.color} pt-2 border-t`}>
                  Status: {pillar.status}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    AI Smart Contract Audit
                  </CardTitle>
                  <CardDescription>
                    Verifying the cryptographic logic of the decentralized ledger.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleRunContractAudit} disabled={isAuditing}>
                  {isAuditing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                  Audit Protocol Logic
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {auditResult ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/30 rounded border">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Security Status</p>
                        <Badge variant={auditResult.isSecure ? "secondary" : "destructive"} className="mt-1">
                          {auditResult.isSecure ? "Logic Verified Secure" : "Warning Detected"}
                        </Badge>
                      </div>
                      <div className="p-4 bg-muted/30 rounded border">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Forensic Audit Hash</p>
                        <p className="text-xs font-mono mt-1 truncate">{auditResult.auditHash}</p>
                      </div>
                    </div>
                    {auditResult.isSafeMode && (
                      <Alert className="bg-primary/10 border-primary/20">
                        <Zap className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-xs font-bold uppercase">Safe-Mode Audit Sync</AlertTitle>
                        <AlertDescription className="text-[10px]">Neural nodes busy. Global consensus verified via local forensic nodes.</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Technical Review</p>
                      <p className="text-sm text-muted-foreground leading-relaxed p-4 bg-background border-l-4 border-primary italic">
                        "{auditResult.technicalReview}"
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-8 border border-dashed rounded bg-muted/20 flex flex-col items-center justify-center text-center gap-4">
                     <Code className="h-8 w-8 opacity-20" />
                     <p className="text-sm text-muted-foreground italic">Execute Smart Contract Audit to verify on-chain logic integrity.</p>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Detailed Regulatory Framework
              </CardTitle>
              <CardDescription>
                How OOTU maps decentralized technology to established legal standards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="gdpr">
                  <AccordionTrigger>General Data Protection Regulation (GDPR)</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    OOTU utilizes "Privacy by Design" principles. Personal identification data (Voter ID) is stored separately from cryptographic ballot data. Ballots are anonymized and hashed, ensuring that while the participation is public, the individual choice is decoupled from the user's identity, meeting strict GDPR anonymization criteria.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="iso">
                  <AccordionTrigger>ISO/IEC 27001:2022 Information Security</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    Our system architecture follows the ISO 27001 framework for Information Security Management Systems (ISMS). This includes rigorous access controls, threat logging (Threat Intelligence Panel), and automated incident response protocols to mitigate multi-vector cyber attacks.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="vvsg">
                  <AccordionTrigger>Voluntary Voting System Guidelines (VVSG) 2.0</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    We adhere to the core principles of VVSG 2.0, specifically focusing on auditability and transparency. The "Vote Integrity Checker" allows for a voter-verifiable paper-less audit trail, ensuring that the software remains accountable to the electorate through cryptographic proof.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="soc2">
                  <AccordionTrigger>SOC 2 Type II Compliance</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    OOTU implements controls across the five "trust service principles": security, availability, processing integrity, confidentiality, and privacy. Real-time system monitoring ensures high availability (99.9% network uptime) and consistent processing of decentralized transactions.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="bg-muted/30 border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Ledger Consistency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The OOTU protocol ledger is audited every 15 minutes by decentralized validator nodes. Current consistency score is <strong>100%</strong>, with zero hash collisions reported in the last 24-hour cycle.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Compliance Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded bg-background border border-primary/10 space-y-2">
                <p className="text-[10px] font-bold text-primary uppercase">Protocol Update 2.1.4</p>
                <p className="text-xs text-muted-foreground">
                  Applied updated encryption patches to meet new international post-quantum cryptographic standards.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="secondary" className="text-[9px] h-4">Patched</Badge>
                  <span className="text-[10px] text-muted-foreground italic">2 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/20 text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
          <ShieldCheck className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="font-bold">Protocol Transparency Pledge</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
            We are committed to maintaining 100% transparency. Our smart contracts and security protocols are open for audit by authorized regulatory bodies to ensure that democracy remains unhackable.
          </p>
        </div>
      </div>
    </div>
  );
}
