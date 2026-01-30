"use client";

import { useState, useEffect } from "react";
import type { Candidate, User } from "@/lib/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { candidates as initialCandidates, initialUsers } from "@/lib/data";
import { Check, X, Play, Square, PlusCircle, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [voters, setVoters] = useState<User[]>([]);
  const [electionStatus, setElectionStatus] = useState<"Not Started" | "Live" | "Ended">("Not Started");

  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateParty, setNewCandidateParty] = useState("");

  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [candidateToRemove, setCandidateToRemove] = useState<Candidate | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  useEffect(() => {
    const storedUsers = localStorage.getItem("verityvote_users");
    if (storedUsers) {
      setVoters(JSON.parse(storedUsers));
    } else {
      localStorage.setItem("verityvote_users", JSON.stringify(initialUsers));
      setVoters(initialUsers);
    }
  }, []);

  const updateVotersInStorage = (updatedVoters: User[]) => {
    setVoters(updatedVoters);
    localStorage.setItem("verityvote_users", JSON.stringify(updatedVoters));
  };
  
  const handleAddCandidate = () => {
    if (!newCandidateName || !newCandidateParty) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out both candidate name and party.",
      });
      return;
    }
    const newCandidate: Candidate = {
      id: `c${Date.now()}`,
      name: newCandidateName,
      party: newCandidateParty,
    };
    setCandidates([...candidates, newCandidate]);
    setNewCandidateName("");
    setNewCandidateParty("");
    toast({
      title: "Candidate Added",
      description: `${newCandidateName} has been added to the roster.`,
    });
  };

  const handleOpenEditDialog = (candidate: Candidate) => {
    setEditingCandidate({...candidate});
    setIsEditDialogOpen(true);
  };

  const handleUpdateCandidate = () => {
    if (!editingCandidate) return;

    setCandidates(
      candidates.map((c) =>
        c.id === editingCandidate.id ? editingCandidate : c
      )
    );
    toast({
      title: "Candidate Updated",
      description: `${editingCandidate.name}'s information has been updated.`,
    });
    setIsEditDialogOpen(false);
    setEditingCandidate(null);
  };

  const handleOpenRemoveDialog = (candidate: Candidate) => {
    setCandidateToRemove(candidate);
    setIsRemoveDialogOpen(true);
  };
  
  const handleConfirmRemove = () => {
    if (!candidateToRemove) return;
    
    setCandidates(candidates.filter((c) => c.id !== candidateToRemove.id));
    toast({
      variant: "destructive",
      title: "Candidate Removed",
      description: `${candidateToRemove.name} has been removed from the roster.`,
    });
    setIsRemoveDialogOpen(false);
    setCandidateToRemove(null);
  };

  const handleVerifyVoter = (voterId: string) => {
    const voter = voters.find(v => v.id === voterId);
    const updatedVoters = voters.map(v => v.id === voterId ? { ...v, isVerified: true } : v);
    updateVotersInStorage(updatedVoters);
     if (voter) {
        toast({
            title: "Voter Verified",
            description: `${voter.fullName} has been successfully verified.`
        });
    }
  };

  const handleRejectVoter = (voterId: string) => {
    const voter = voters.find(v => v.id === voterId);
    const updatedVoters = voters.filter(v => v.id !== voterId);
    updateVotersInStorage(updatedVoters);
     if (voter) {
        toast({
            variant: "destructive",
            title: "Voter Rejected",
            description: `${voter.fullName} has been rejected and removed.`
        });
    }
  };

  const handleStartElection = () => {
    setElectionStatus("Live");
    toast({
        title: "Election Started",
        description: "The voting polls are now open."
    });
  };

  const handleStopElection = () => {
    setElectionStatus("Ended");
    toast({
        variant: "destructive",
        title: "Election Stopped",
        description: "The voting polls are now closed."
    });
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">
            Oversee and manage the election process.
          </p>
        </div>

        <Tabs defaultValue="voters" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="voters">Verify Voters</TabsTrigger>
            <TabsTrigger value="candidates">Manage Candidates</TabsTrigger>
            <TabsTrigger value="election">Election Control</TabsTrigger>
          </TabsList>
          <TabsContent value="voters">
            <Card>
              <CardHeader>
                <CardTitle>Voter Verification</CardTitle>
                <CardDescription>
                  Approve or reject newly registered voters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Voter ID</TableHead>
                      <TableHead>Registered At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {voters.map((voter) => (
                      <TableRow key={voter.id}>
                        <TableCell className="font-medium">{voter.fullName}</TableCell>
                        <TableCell>{voter.voterId}</TableCell>
                        <TableCell>{new Date(voter.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              voter.isVerified ? "default" : "secondary"
                            }
                            className={voter.isVerified ? "bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-500/20" : ""}
                          >
                            {voter.isVerified ? "Verified" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {!voter.isVerified && (
                            <>
                              <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" onClick={() => handleVerifyVoter(voter.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleRejectVoter(voter.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="candidates">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                 <Card>
                  <CardHeader>
                      <CardTitle>Candidate List</CardTitle>
                      <CardDescription>Current candidates in the election.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Party</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {candidates.map(c => (
                                  <TableRow key={c.id}>
                                      <TableCell>{c.name}</TableCell>
                                      <TableCell>{c.party}</TableCell>
                                      <TableCell className="text-right space-x-2">
                                          <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(c)}>
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleOpenRemoveDialog(c)}>
                                              <Trash2 className="h-4 w-4" />
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </CardContent>
                 </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Candidate</CardTitle>
                    <CardDescription>
                      Add a candidate to the election roster.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="candidate-name">Candidate Name</Label>
                      <Input id="candidate-name" placeholder="DMK" value={newCandidateName} onChange={(e) => setNewCandidateName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="party-name">Party Name</Label>
                      <Input id="party-name" placeholder="Dravida Munnetra Kazhagam" value={newCandidateParty} onChange={(e) => setNewCandidateParty(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="candidate-photo">Candidate Photo</Label>
                      <Input id="candidate-photo" type="file" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={handleAddCandidate}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Candidate
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="election">
            <Card>
              <CardHeader>
                <CardTitle>Election Control</CardTitle>
                <CardDescription>
                  Start or stop the election process. This action is critical and
                  should be used with caution.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleStartElection} disabled={electionStatus === 'Live'}>
                  <Play className="mr-2 h-5 w-5" /> Start Election
                </Button>
                <Button size="lg" variant="destructive" onClick={handleStopElection} disabled={electionStatus !== 'Live'}>
                  <Square className="mr-2 h-5 w-5" /> Stop Election
                </Button>
              </CardContent>
              <CardFooter>
                  <p className="text-sm text-muted-foreground">Current Status: <span className={cn(
                    "font-bold",
                     electionStatus === 'Live' && "text-green-500",
                     electionStatus === 'Ended' && "text-red-500",
                     electionStatus === 'Not Started' && "text-yellow-500"
                  )}>{electionStatus}</span></p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Candidate</DialogTitle>
            <DialogDescription>
              Update the candidate's information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {editingCandidate && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-candidate-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-candidate-name"
                  value={editingCandidate.name}
                  onChange={(e) =>
                    setEditingCandidate({ ...editingCandidate, name: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-party-name" className="text-right">
                  Party
                </Label>
                <Input
                  id="edit-party-name"
                  value={editingCandidate.party}
                  onChange={(e) =>
                    setEditingCandidate({ ...editingCandidate, party: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateCandidate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove{" "}
              <strong>{candidateToRemove?.name}</strong> from the candidate list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsRemoveDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemove} className="bg-destructive hover:bg-destructive/90">
                Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
