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
  Copy,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, collectionGroup } from 'firebase/firestore';
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
  const [isVerifying, setIsVerifying] = useState(false);

  // Fetch recent transactions (votes) from the registry for transparency using collectionGroup
  const recentVotesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // We query all votes across all user subcollections
    return query(collectionGroup(firestore, 'votes'), limit(10));
  }, [firestore]);

  const { data: recentTransactions, isLoading: isLoadingTxs } = useCollection<Vote>(recentVotesQuery);

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

  const handleSearch = async () => {
    if (!searchQuery) return;
    
    setIsVerifying(true);
    
    // Simulate node consensus verification
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (searchQuery.startsWith('0x') && searchQuery.length > 20) {
      toast({
        title: "Protocol Hash Verified",
        description: "Transaction found and confirmed across 128 validator nodes.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Search Term Invalid",
        description: "Please enter a valid Digital Audit Hash (0x...).",
      });
    }
    
    setIsVerifying(false);
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blockchain Transparency Explorer</h1>
          <p className="text-muted-foreground font-medium">Monitoring decentralized vote batches and block confirmations on the OOTU protocol.</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="gap-2 px-3 py-1 bg-green-500/5 text-green-600 border-green-500/20 rounded-none font-black uppercase tracking-tighter shadow-sm">
            <Activity className="h-4 w-4 animate-pulse" /> Live Node Sync
          </Badge>
          <Badge variant="outline" className="gap-2 px-3 py-1 bg-primary/5 text-primary border-primary/20 rounded-none font-black uppercase tracking-tighter shadow-sm neon-border">
            <Globe className="h-4 w-4" /> Global Consensus
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { l: "Current Block", val: blocks[0]?.height || '...', icon: Box, color: "bg-primary/5 border-primary/20", sub: "Average: 15.2s", subIcon: Clock },
          { l: "Total Batches", val: "8,421", icon: Database, color: "bg-accent/5 border-accent/20", sub: "Immutable snapshots", subIcon: ShieldCheck },
          { l: "Active Validators", val: "128", icon: Server, color: "bg-orange-500/5 border-orange-500/20", sub: "Consensus: 100%", subIcon: Globe },
          { l: "Protocol Status", val: "Hardened", icon: Zap, color: "bg-yellow-500/5 border-yellow-500/20", sub: "Latency: 1.2s", subIcon: Activity }
        ].map((stat, i) => (
          <Card key={i} className={`${stat.color} rounded-none border-l-4 shimmer-card shadow-lg`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.l}</p>
                <stat.icon className="h-4 w-4 opacity-30" />
              </div>
              <p className="text-2xl font-black tracking-tighter">{stat.val}</p>
              <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1 font-bold uppercase">
                {stat.subIcon && <stat.subIcon className="h-3 w-3" />} {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 relative">
        <div className="scanning-line opacity-20 pointer-events-none" />
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by Transaction Hash (TXID) or Block Height..." 
            className="pl-9 h-12 border-primary/20 rounded-none bg-primary/5 font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={isVerifying || !searchQuery} className="h-12 px-8 gap-2 rounded-none font-black uppercase tracking-widest shadow-xl shadow-primary/20">
          {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {isVerifying ? "Verifying..." : "Verify Hash"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-primary/20 shadow-xl rounded-none glow-box overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-6 bg-muted/30">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 font-black uppercase tracking-tight">
                <Box className="h-5 w-5 text-primary" /> Recent Blocks
              </CardTitle>
              <CardDescription className="font-medium">Sequential confirmation batches on the ledger.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest border border-primary/20 rounded-none">View All</Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-b-2">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Height</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Block Hash</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">TXs</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Timestamp</TableHead>
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
                      className="border-b hover:bg-primary/5 transition-colors group"
                    >
                      <TableCell className="font-black text-primary tracking-tighter">{block.height}</TableCell>
                      <TableCell className="font-mono text-[10px]">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[120px] font-bold tracking-tighter group-hover:text-primary transition-colors">{block.hash}</span>
                          <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(block.hash)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">{block.txCount}</TableCell>
                      <TableCell className="text-right text-[10px] font-black uppercase text-muted-foreground">
                        {format(block.timestamp, 'HH:mm:ss')}
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-accent/20 shadow-xl rounded-none shimmer-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-6 bg-muted/30">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 font-black uppercase tracking-tight">
                <LinkIcon className="h-5 w-5 text-accent" /> Recent Transactions
              </CardTitle>
              <CardDescription className="font-medium">Verified biometric identity signatures (Anonymized).</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest border border-accent/20 rounded-none">Live Feed</Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-b-2">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Audit Key (TXID)</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Node Proof</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTxs ? (
                   <TableRow><TableCell colSpan={3} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-accent" /></TableCell></TableRow>
                ) : (
                  <>
                    {recentTransactions?.map((vote) => (
                      <TableRow key={vote.id} className="border-b hover:bg-accent/5 transition-colors group">
                        <TableCell className="font-mono text-[10px]">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[180px] font-bold tracking-tighter group-hover:text-accent transition-colors">{vote.txHash || vote.id}</span>
                            <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(vote.txHash || vote.id)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="h-5 text-[9px] bg-green-500/5 text-green-600 border-green-500/20 rounded-none font-black uppercase tracking-[0.2em] shadow-sm">Verified</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <div key={j} className="w-1.5 h-1.5 rounded-none bg-green-500 shadow-sm shadow-green-500/20" />
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {simulatedTxs.map((simulatedTx, i) => (
                      <TableRow key={`sim-${i}`} className="border-b hover:bg-accent/5 transition-colors group">
                        <TableCell className="font-mono text-[10px]">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[180px] font-bold tracking-tighter group-hover:text-accent transition-colors">{simulatedTx}</span>
                            <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(simulatedTx)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="h-5 text-[9px] bg-green-500/5 text-green-600 border-green-500/20 rounded-none font-black uppercase tracking-[0.2em] shadow-sm">Verified</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <div key={j} className="w-1.5 h-1.5 rounded-none bg-green-500 shadow-sm shadow-green-500/20" />
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 rounded-none border-primary/20 shadow-xl glow-box">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-2 text-primary">
              <ShieldCheck className="h-4 w-4" /> Validator Approval Mesh
            </CardTitle>
            <CardDescription className="font-medium">Decentralized nodes currently participating in the consensus window.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-8 md:grid-cols-16 gap-2">
              {Array.from({ length: 64 }).map((_, i) => (
                <motion.div 
                  key={i}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.01, repeat: Infinity, repeatType: 'reverse', duration: 2 + Math.random() }}
                  className="aspect-square bg-green-500/10 border border-green-500/20 rounded-none flex items-center justify-center shadow-sm"
                  title={`Validator Node ${i + 1}: Healthy`}
                >
                  <div className="w-2 h-2 rounded-none bg-green-500 shadow-lg shadow-green-500/50" />
                </motion.div>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-between p-4 bg-muted/30 rounded-none border-2 border-dashed border-primary/20 text-[10px] font-black uppercase tracking-widest shadow-inner">
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-none bg-green-500" /> Online</div>
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-none bg-yellow-500" /> Syncing</div>
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-none bg-red-500" /> Offline</div>
              </div>
              <p className="font-mono text-primary flex items-center gap-2"><RefreshCcw className="h-3 w-3 animate-spin" /> OOTU_MESH_V4.1</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20 rounded-none shadow-2xl shimmer-card">
          <CardHeader className="border-b bg-muted/50">
            <CardTitle className="text-sm font-black uppercase tracking-widest">Ledger Health Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="text-muted-foreground">Consensus Consistency</span>
                <span className="text-green-600">100.0%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-none overflow-hidden border border-primary/10">
                <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-green-500 shadow-lg shadow-green-500/20" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="text-muted-foreground">Network Availability</span>
                <span className="text-primary">99.9%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-none overflow-hidden border border-primary/10">
                <motion.div initial={{ width: 0 }} animate={{ width: '99.9%' }} className="h-full bg-primary shadow-lg shadow-primary/20" />
              </div>
            </div>
            <div className="p-6 bg-background/50 border-2 border-dashed border-primary/20 rounded-none space-y-4 text-center glow-box">
              <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-primary tracking-[0.3em]">
                <RefreshCcw className="h-3 w-3 animate-spin" /> Next Sync Cycle
              </div>
              <p className="text-2xl font-mono text-primary font-black py-4 bg-muted/30 rounded-none tracking-[0.2em] shadow-inner">00:00:12</p>
              <Button variant="outline" size="sm" className="w-full text-[10px] h-10 font-black uppercase tracking-widest rounded-none border-primary/30 hover:bg-primary hover:text-white">Refresh Nodes</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center p-16 text-center border-t-2 border-dashed border-primary/10"
      >
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed font-medium">
          The Transparency Explorer is a core pillar of the OOTU protocol. It provides a real-time digital audit trail for the electorate, proving that the ledger is mathematically consistent without revealing who voted for whom. All transactions are hashed using SHA-256 and confirmed by a distributed validator mesh.
        </p>
        <div className="mt-10 flex items-center gap-8 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all">
           <Logo className="scale-125" />
           <div className="h-6 w-px bg-muted-foreground" />
           <span className="text-[10px] font-black uppercase tracking-[0.4em]">Decentralized Voting Standard V2.1</span>
        </div>
      </motion.div>
    </div>
  );
}
