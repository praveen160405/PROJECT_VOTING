'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Scan, 
  Video, 
  Image as ImageIcon, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Fingerprint, 
  Eye, 
  Activity, 
  Info,
  Search,
  ExternalLink,
  ChevronRight,
  Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { detectDeepfake, type DetectDeepfakeOutput } from '@/ai/flows/detect-deepfake-flow';

const SAMPLE_ALERTS = [
  {
    id: 'a1',
    type: 'Video',
    candidate: 'DMK - M.K. Stalin',
    description: 'Viral video showing altered speech about tax reforms.',
    risk: 'High',
    source: 'Social Media Node 12',
    timestamp: '2 hours ago',
  },
  {
    id: 'a2',
    type: 'Image',
    candidate: 'ADMK - E.K. Palaniswami',
    description: 'AI-generated image of a secret endorsement deal.',
    risk: 'Critical',
    source: 'Anonymous File Upload',
    timestamp: '45 mins ago',
  },
];

export default function DeepfakeDetectionPage() {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<DetectDeepfakeOutput | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleScan = async () => {
    if (!mediaFile) return;

    setIsScanning(true);
    setResult(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(mediaFile);
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const analysis = await detectDeepfake({
            mediaDataUri: base64,
            contentType: mediaFile.type,
            context: "Election campaign monitoring",
          });
          setResult(analysis);
          
          if (analysis.isManipulated) {
            toast({
              variant: "destructive",
              title: "Security Threat Flagged",
              description: "AI analysis has detected high-confidence manipulation artifacts.",
            });
          } else {
            toast({
              title: "Media Integrity Verified",
              description: "No signs of AI manipulation were found in this sample.",
            });
          }
        } catch (error) {
          console.error(error);
          toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: "The AI node could not process this media format.",
          });
        } finally {
          setIsScanning(false);
        }
      };
    } catch (err) {
      setIsScanning(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to read local media file.",
      });
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Media Integrity Lab</h1>
          <p className="text-muted-foreground">Detecting synthetic media and deepfakes across campaign nodes.</p>
        </div>
        <Badge variant="outline" className="gap-2 px-4 py-1.5 border-orange-500/20 bg-orange-500/5 text-orange-600">
          <Activity className="h-4 w-4 animate-pulse" />
          Live Election Watch Active
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="border-primary/10 shadow-lg bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Scan className="h-5 w-5 text-primary" />
                Media Scanner
              </CardTitle>
              <CardDescription>
                Upload campaign content to scan for neural artifacts and visual inconsistencies.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 transition-colors ${
                  mediaFile ? 'border-primary/50 bg-primary/5' : 'border-muted'
                }`}
              >
                {mediaFile ? (
                  <div className="text-center">
                    {mediaFile.type.startsWith('image') ? (
                      <ImageIcon className="h-12 w-12 text-primary mx-auto mb-2" />
                    ) : (
                      <Video className="h-12 w-12 text-primary mx-auto mb-2" />
                    )}
                    <p className="text-sm font-medium truncate max-w-[200px]">{mediaFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(mediaFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Click to select or drag & drop</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, or MP4 (Max 10MB)</p>
                    </div>
                  </>
                )}
                <Input 
                  type="file" 
                  className="hidden" 
                  id="media-upload" 
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                />
                <Button 
                  asChild 
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                >
                  <label htmlFor="media-upload" className="cursor-pointer">
                    {mediaFile ? 'Change File' : 'Select Media'}
                  </label>
                </Button>
              </div>

              <Button 
                className="w-full" 
                disabled={!mediaFile || isScanning}
                onClick={handleScan}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Patterns...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Execute Forensic Audit
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-primary" />
                Detection Protocol
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-[10px] text-muted-foreground space-y-2 uppercase tracking-wider font-bold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Neural Pattern Matching
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Lip-Sync Phase Audit
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Consistency Mesh Scanning
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className={`overflow-hidden border-2 ${result.isManipulated ? 'border-red-500/20 shadow-red-500/5' : 'border-green-500/20 shadow-green-500/5'}`}>
                  <div className={`h-1.5 w-full ${result.isManipulated ? 'bg-red-500' : 'bg-green-500'}`} />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {result.isManipulated ? (
                          <ShieldAlert className="h-6 w-6 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        )}
                        {result.isManipulated ? "Deepfake Detected" : "Media Integrity Verified"}
                      </CardTitle>
                      <Badge variant={result.isManipulated ? "destructive" : "secondary"}>
                        {Math.round(result.confidenceScore * 100)}% Confidence
                      </Badge>
                    </div>
                    <CardDescription>
                      {result.isManipulated 
                        ? "AI analysis has identified high-risk visual manipulation artifacts." 
                        : "No synthetic or neural rendering patterns detected in current sample."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg border space-y-2">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Risk Assessment</p>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold ${
                            result.riskLevel === 'Critical' || result.riskLevel === 'High' ? 'text-red-500' : 'text-green-500'
                          }`}>{result.riskLevel} Risk</span>
                          <Progress value={result.confidenceScore * 100} className="h-1.5 w-24" />
                        </div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg border space-y-2">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Metadata Audit</p>
                        <p className="text-sm font-medium">{result.metadataIntegrity}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Eye className="h-3 w-3 text-primary" />
                        Forensic Breakdown
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed italic bg-background p-4 rounded border-l-4 border-primary">
                        "{result.analysis}"
                      </p>
                    </div>

                    {result.detectedAnomalies.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest">Detected Anomalies</p>
                        <div className="flex flex-wrap gap-2">
                          {result.detectedAnomalies.map((anomaly, idx) => (
                            <Badge key={idx} variant="outline" className="bg-background border-red-500/20 text-red-600">
                              {anomaly}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-muted/30 border-t flex items-center justify-between px-6 py-4">
                    <span className="text-[10px] text-muted-foreground font-mono uppercase">Node Hash: 0x7f...e2a9</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-2">
                      <ExternalLink className="h-3 w-3" /> View Source Ledger
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-6"
              >
                <Card className="border-red-500/20 bg-red-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Active Election Alerts
                    </CardTitle>
                    <CardDescription>
                      AI-flagged media currently circulating on social campaign nodes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {SAMPLE_ALERTS.map((alert) => (
                      <div key={alert.id} className="p-4 bg-background rounded-lg border-2 border-red-500/10 hover:border-red-500/30 transition-all group">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="h-5 text-[10px]">{alert.risk} Risk</Badge>
                            <span className="text-xs font-bold flex items-center gap-1">
                              {alert.type === 'Video' ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                              {alert.type} Alert
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{alert.timestamp}</span>
                        </div>
                        <h4 className="font-bold text-sm mb-1">{alert.candidate}</h4>
                        <p className="text-xs text-muted-foreground mb-3">{alert.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                            <Search className="h-2.5 w-2.5" /> Source: {alert.source}
                          </span>
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs font-bold">
                            View Evidence <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <Alert className="border-blue-500/20 bg-blue-500/5">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertTitle className="text-xs font-bold">How it works</AlertTitle>
                    <AlertDescription className="text-[10px]">
                      Our AI uses multimodal neural networks to verify biological consistency and metadata signatures.
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-green-500/20 bg-green-500/5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-xs font-bold">Protocol Accuracy</AlertTitle>
                    <AlertDescription className="text-[10px]">
                      The OOTU Deepfake Protocol maintains a 99.4% precision rate on political synthetic media.
                    </AlertDescription>
                  </Alert>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
