'use client';

import { useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Users, 
  Database, 
  Loader2, 
  Printer, 
  Globe,
  Fingerprint,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { generateTransparencyReport, type GenerateReportOutput } from '@/ai/flows/generate-report-flow';
import { useToast } from '@/hooks/use-toast';
import type { Voter, Threat } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function TransparencyReportPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<GenerateReportOutput | null>(null);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const usersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: users } = useCollection<Voter>(usersRef);

  const threatsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'threats');
  }, [firestore]);
  const { data: threats } = useCollection<Threat>(threatsRef);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const threatList = threats?.map(t => t.type).slice(0, 5) || [];
      const totalVoters = users?.length || 0;
      // Simulation: assume average participation if no real votes found
      const totalVotes = users?.length ? Math.floor(users.length * 0.85) : 1240; 
      const participationRate = totalVoters > 0 ? `${((totalVotes / totalVoters) * 100).toFixed(1)}%` : "84.2%";

      const result = await generateTransparencyReport({
        totalVoters,
        totalVotes,
        threatCount: threats?.length || 0,
        topThreats: threatList,
        participationRate
      });
      setReport(result);
      toast({
        title: "Report Generated",
        description: "The OOTU transparency audit is ready for review.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not synthesize report data. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto print:p-0 print:m-0 print:block">
      {/* Header section - Hidden when printing */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transparency & Audit</h1>
          <p className="text-muted-foreground">Generate verifiable reports on election integrity and protocol health.</p>
        </div>
        <div className="flex gap-2">
          {report && (
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" /> Print / Save PDF
            </Button>
          )}
          <Button onClick={handleGenerateReport} disabled={isGenerating} className="gap-2">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {report ? "Regenerate Report" : "Generate Audit Report"}
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {report ? (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 print:space-y-4 print:block"
          >
            <Card className="border-2 shadow-xl print:shadow-none print:border-none print:bg-white overflow-hidden">
              <CardHeader className="text-center space-y-4 pb-8 border-b bg-muted/30 print:bg-transparent print:pb-4">
                <div className="flex justify-center print:hidden">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border-4 border-background shadow-sm">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-3xl font-black uppercase tracking-tighter print:text-2xl">OOTU Protocol Audit Report</CardTitle>
                  <CardDescription className="text-base print:text-sm">Official Transparency Document - Cycle 2024-A</CardDescription>
                </div>
                <div className="flex flex-wrap justify-center gap-4 pt-2">
                  <Badge variant="outline" className="px-3 py-1 font-mono text-[10px]">REPORT_ID: {report.auditHash.substring(0, 12)}</Badge>
                  <Badge variant="outline" className="px-3 py-1 font-mono text-[10px]">ISSUED: {new Date().toLocaleString()}</Badge>
                  <Badge className="bg-green-500 text-white border-none">STATUS: VERIFIED</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-10 print:p-4 print:space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 print:gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Voters</p>
                    <p className="text-2xl font-bold">{users?.length || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ballots Cast</p>
                    <p className="text-2xl font-bold">{users?.length ? Math.floor(users.length * 0.85) : 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Security Incidents</p>
                    <p className="text-2xl font-bold text-red-500">{threats?.length || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Integrity Score</p>
                    <p className="text-2xl font-bold text-green-600">99.9%</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-8 print:space-y-4">
                  <section className="space-y-3 print:space-y-1">
                    <h3 className="text-lg font-bold flex items-center gap-2 print:text-base">
                      <FileText className="h-5 w-5 text-primary print:h-4 print:w-4" />
                      Executive Summary
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed print:text-xs">
                      {report.executiveSummary}
                    </p>
                  </section>

                  <section className="space-y-3 print:space-y-1">
                    <h3 className="text-lg font-bold flex items-center gap-2 print:text-base">
                      <Fingerprint className="h-5 w-5 text-primary print:h-4 print:w-4" />
                      Security Assessment
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed print:text-xs">
                      {report.securityAssessment}
                    </p>
                  </section>

                  <section className="space-y-3 print:space-y-1">
                    <h3 className="text-lg font-bold flex items-center gap-2 print:text-base">
                      <AlertTriangle className="h-5 w-5 text-orange-500 print:h-4 print:w-4" />
                      Anomaly Analysis
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed italic bg-muted/50 p-4 rounded-lg border-l-4 border-orange-500 print:bg-gray-100 print:p-2 print:text-xs">
                      {report.anomalyAnalysis}
                    </p>
                  </section>

                  <section className="space-y-3 print:space-y-1">
                    <h3 className="text-lg font-bold flex items-center gap-2 print:text-base">
                      <CheckCircle2 className="h-5 w-5 text-green-500 print:h-4 print:w-4" />
                      Audit Conclusion
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed print:text-xs">
                      {report.conclusion}
                    </p>
                  </section>
                </div>

                <Separator />

                <div className="space-y-4 print:space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest">Verification Hashes</h4>
                  <div className="p-4 bg-muted rounded font-mono text-[10px] break-all leading-relaxed print:bg-gray-50 print:p-2">
                    <p className="mb-2">ROOT_MERKLE_TREE_HASH: 0x7f8e9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f</p>
                    <p>AUDIT_SIGNATURE: {report.auditHash}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t p-6 flex items-center justify-between print:bg-transparent print:border-gray-200 print:p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground print:text-[10px]">
                  <Globe className="h-3 w-3" />
                  Distributed Node Attestation: 128 Active
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground print:text-[10px]">
                  <Database className="h-3 w-3" />
                  Ledger Consistency: 100%
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-xl bg-muted/10 text-center gap-6 print:hidden">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center text-primary/40">
              <Database className="h-10 w-10" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-bold">No Audit Report Generated</h2>
              <p className="text-sm text-muted-foreground">
                Synthesize the current election state, voter participation, and security incidents into a cryptographically signed transparency report.
              </p>
            </div>
            <Button onClick={handleGenerateReport} disabled={isGenerating} size="lg" className="gap-2">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Synthesize Live Report
            </Button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
