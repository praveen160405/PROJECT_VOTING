import type { Candidate, Voter, VoteResult, PartyVote } from "@/lib/types";

export const candidates: Candidate[] = [
  {
    id: "c1",
    name: "DMK",
    party: "Dravida Munnetra Kazhagam",
  },
  {
    id: "c2",
    name: "ADMK",
    party: "All India Anna Dravida Munnetra Kazhagam",
  },
  {
    id: "c3",
    name: "TVK",
    party: "Tamizhaga Vetri Kazhagam",
  },
  {
    id: "c4",
    name: "NTK",
    party: "Naam Tamilar Katchi",
  },
  {
    id: "c5",
    name: "BJP",
    party: "Bharatiya Janata Party",
  },
];

export const voters: Voter[] = [
    { id: 'v1', name: 'Alice Johnson', voterId: 'VOTER001', registeredAt: '2023-10-01', isVerified: true },
    { id: 'v2', name: 'Bob Williams', voterId: 'VOTER002', registeredAt: '2023-10-02', isVerified: false },
    { id: 'v3', name: 'Charlie Brown', voterId: 'VOTER003', registeredAt: '2023-10-03', isVerified: true },
    { id: 'v4', name: 'Diana Miller', voterId: 'VOTER004', registeredAt: '2023-10-04', isVerified: false },
    { id: 'v5', name: 'Ethan Davis', voterId: 'VOTER005', registeredAt: '2023-10-05', isVerified: true },
];

export const voteResults: VoteResult[] = [
    { name: "DMK", votes: 4850 },
    { name: "ADMK", votes: 3920 },
    { name: "TVK", votes: 6100 },
    { name: "NTK", votes: 2500 },
    { name: "BJP", votes: 3200 },
];

export const partyVotes: PartyVote[] = [
    { party: 'DMK', votes: 4850 },
    { party: 'ADMK', votes: 3920 },
    { party: 'TVK', votes: 6100 },
    { party: 'NTK', votes: 2500 },
    { party: 'BJP', votes: 3200 },
];
