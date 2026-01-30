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
import { voters, candidates } from "@/lib/data";
import { Check, X, Play, Square, PlusCircle } from "lucide-react";

export default function AdminPage() {
  return (
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
                      <TableCell className="font-medium">{voter.name}</TableCell>
                      <TableCell>{voter.voterId}</TableCell>
                      <TableCell>{voter.registeredAt}</TableCell>
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
                            <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
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
                                        <Button variant="outline" size="sm">Edit</Button>
                                        <Button variant="destructive" size="sm">Remove</Button>
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
                    <Input id="candidate-name" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="party-name">Party Name</Label>
                    <Input id="party-name" placeholder="Independence Party" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="candidate-photo">Candidate Photo</Label>
                    <Input id="candidate-photo" type="file" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
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
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                <Play className="mr-2 h-5 w-5" /> Start Election
              </Button>
              <Button size="lg" variant="destructive">
                <Square className="mr-2 h-5 w-5" /> Stop Election
              </Button>
            </CardContent>
            <CardFooter>
                <p className="text-sm text-muted-foreground">Current Status: <span className="font-bold text-green-500">Live</span></p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
