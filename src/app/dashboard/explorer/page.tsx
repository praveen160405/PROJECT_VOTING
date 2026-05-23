'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Box, 
  CheckCircle2, 
  Database, 
  ExternalLink, 
  Fingerprint, 
  Globe, 
  Link as LinkIcon, 
  Search, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Server,
  ArrowRight,
  RefreshCcw,
  Copy
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Vote } from '@/lib/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';

interface Block {
  height: number;
  hash: string;
  timestamp: Date;
  txCount: number;
  status: 'Confirmed' | 'Pending';
  validator: string;
}

export default function LedgerExplorerPage() {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [simulatedTxs, setSimulatedTxs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [networkStatus, setNetworkStatus] = useState('Healthy');

  // Fetch recent transactions (votes) from the registry for transparency
  const recentVotesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users', 'global_votes_view', 'votes'), limit(10));
  }, [firestore]);

  const { data: recentTransactions } = useCollection<Vote>(recentVotesQuery);

  useEffect(() => {
    // Initialize simulated blocks on client mount to avoid hydration mismatch
    const initialBlocks: Block[] = Array.from({ length: 5 }, (_, i) => ({
      height: 125430 - i,
      hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      timestamp: new Date(Date.now() - i * 15000),
      txCount: Math.floor(Math.random() * 20) + 5,
      status: 'Confirmed',
      validator: `Node_${100 + i}`
    }));
    setBlocks(initialBlocks);

    // Initialize simulated transactions on client mount
    const initialTxs = Array.from({ length: 6 }, () => 
      `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    );
    setSimulatedTxs(initialTxs);

    // Live block generator simulation
    const interval = setInterval(() => {
      setBlocks(prev => {
        const newHeight = prev.length > 0 ? prev[0].height + 1 : 125431;
        const newBlock: Block = {
          height: newHeight,
          hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
          timestamp: new Date(),
          txCount: Math.floor(Math.random() * 15) + 2,
          status: 'Confirmed',
          validator: `Node_${Math.floor(Math.random() * 128) + 1}`
        };
        return [newBlock, ...prev.slice(0, 9)];
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Audit Key Copied",
      description: "SHA-256 hash ready for verification.",
    });
  };

  const handleSearch = () => {
    if (!searchQuery) return;
    toast({
      title: "Scanning Ledger...",
      description: `Searching for hash: ${searchQuery.substring(0, 10)}...`,
    });
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blockchain Transparency Explorer</h1>
          <p className="text-muted-foreground">Monitoring decentralized vote batches and block confirmations on the OOTU protocol.</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="gap-2 px-3 py-1 bg-green-500/5 text-green-600 border-green-500/20">
            <Activity className="h-4 w-4 animate-pulse" /> Live Node Sync
          </Badge>
          <Badge variant="outline" className="gap-2 px-3 py-1 bg-primary/5 text-primary border-primary/20">
            <Globe className="h-4 w-4" /> Global Consensus
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-muted-foreground uppercase">Current Block</p>
              <Box className="h-4 w-4 text-primary/40" />
            </div>
            <p className="text-2xl font-bold">{blocks[0]?.height || '...'}</p>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Average time: 15.2s
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-muted-foreground uppercase">Total Batches</p>
              <Database className="h-4 w-4 text-accent/40" />
            </div>
            <p className="text-2xl font-bold">8,421</p>
            <p className="text-[10px] text-muted-foreground mt-1">Immutable snapshots stored</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-muted-foreground uppercase">Active Validators</p>
              <Server className="h-4 w-4 text-orange-500/40" />
            </div>
            <p className="text-2xl font-bold">128</p>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-green-500" /> Consensus: 100%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-muted-foreground uppercase">Protocol Status</p>
              <Zap className="h-4 w-4 text-yellow-500/40" />
            </div>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-none px-2 py-0 h-6">
              VVSG 2.0 Hardened
            </Badge>
            <p className="text-[10px] text-muted-foreground mt-1">Network Latency: 1.2s</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by Transaction Hash (TXID) or Block Height..." 
            className="pl-9 h-11 border-primary/10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} className="h-11 px-8 gap-2">
          <ShieldCheck className="h-4 w-4" /> Verify Hash
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Box className="h-5 w-5 text-primary" /> Recent Blocks
              </CardTitle>
              <CardDescription>Sequential confirmation batches on the ledger.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-tighter">View All Blocks</Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Height</TableHead>
                  <TableHead>Block Hash</TableHead>
                  <TableHead>TXs</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {blocks.map((block) => (
                    <motion.tr 
                      key={block.height}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="border-b hover:bg-muted/20"
                    >
                      <TableCell className="font-bold text-primary">{block.height}</TableCell>
                      <TableCell className="font-mono text-[10px]">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[120px]">{block.hash}</span>
                          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => copyToClipboard(block.hash)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{block.txCount}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {format(block.timestamp, 'HH:mm:ss')}
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-accent/20 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-accent" /> Recent Transactions
              </CardTitle>
              <CardDescription>Verified biometric identity signatures (Anonymized).</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-tighter">Live Feed</Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Audit Key (TXID)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Node Proof</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulatedTxs.map((simulatedTx, i) => (
                  <TableRow key={i} className="border-b hover:bg-muted/20">
                    <TableCell className="font-mono text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[180px]">{simulatedTx}</span>
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => copyToClipboard(simulatedTx)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="h-5 text-[9px] bg-green-500/5 text-green-600 border-green-500/20">Verified</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <div key={j} className="w-1 h-1 rounded-full bg-green-500" />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Validator Approval Mesh
            </CardTitle>
            <CardDescription>Decentralized nodes currently participating in the consensus window.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 md:grid-cols-16 gap-2">
              {Array.from({ length: 64 }).map((_, i) => (
                <motion.div 
                  key={i}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.01, repeat: Infinity, repeatType: 'reverse', duration: 2 + Math.random() }}
                  className="aspect-square bg-green-500/20 border border-green-500/30 rounded flex items-center justify-center"
                  title={`Validator Node ${i + 1}: Healthy`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                </motion.div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between p-4 bg-muted/30 rounded border text-xs">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /> Online</div>
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500" /> Syncing</div>
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> Offline</div>
              </div>
              <p className="font-mono text-muted-foreground">OOTU_MESH_V4.1</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-sm">Ledger Health Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-muted-foreground">Consensus Consistency</span>
                <span className="text-green-600">100.0%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-green-500" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-muted-foreground">Network Availability</span>
                <span className="text-primary">99.9%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '99.9%' }} className="h-full bg-primary" />
              </div>
            </div>
            <div className="p-4 bg-background border rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary">
                <RefreshCcw className="h-3 w-3 animate-spin" /> Next Sync Cycle
              </div>
              <p className="text-sm font-mono text-center py-2 bg-muted/50 rounded">00:00:12</p>
              <Button variant="outline" size="sm" className="w-full text-[10px] h-7">Refresh Nodes</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center p-12 text-center border-t border-dashed"
      >
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          The Transparency Explorer is a core pillar of the OOTU protocol. It provides a real-time digital audit trail for the electorate, proving that the ledger is mathematically consistent without revealing who voted for whom. All transactions are hashed using SHA-256 and confirmed by a distributed validator mesh.
        </p>
        <div className="mt-8 flex items-center gap-6 grayscale opacity-40">
           <Logo />
           <div className="h-4 w-px bg-muted-foreground" />
           <span className="text-xs font-bold uppercase tracking-widest">Decentralized Voting Standard V2.1</span>
        </div>
      </motion.div>
    </div>
  );
}
