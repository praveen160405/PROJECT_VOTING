"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFirebase } from "@/firebase/provider";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection } from "firebase/firestore";
import type { User } from "@/lib/types";

export default function UsersPage() {
  const firebase = useFirebase();
  const firestore = firebase?.firestore;
  
  const usersCollection = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  
  const { data: users, loading, error } = useCollection<User>(usersCollection);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Registered Users</h1>
        <p className="text-muted-foreground">
          A list of all users who have registered for the election.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>User Database</CardTitle>
          <CardDescription>
            Browse and manage registered users from the Firestore database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Voter ID (Email)</TableHead>
                <TableHead>Registered At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Loading users...
                  </TableCell>
                </TableRow>
              )}
               {!loading && !users && <TableRow><TableCell colSpan={4} className="text-center">Initializing...</TableCell></TableRow>}
              {error && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-destructive">
                    Error loading users: {error.message}
                  </TableCell>
                </TableRow>
              )}
              {users && users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>{user.voterId}</TableCell>
                  <TableCell>{user.createdAt?.toDate().toLocaleDateString() ?? 'Pending'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isVerified ? "default" : "secondary"}
                      className={
                        user.isVerified
                          ? "bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-500/20"
                          : ""
                      }
                    >
                      {user.isVerified ? "Verified" : "Pending"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
