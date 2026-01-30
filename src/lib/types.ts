export type Candidate = {
  id: string;
  name: string;
  party: string;
  imageUrl?: string;
  imageHint?: string;
};

export type User = {
  id: string;
  fullName: string;
  voterId: string;
  createdAt: string;
  isVerified: boolean;
};

export type Vote = {
  id: string;
  userId: string;
  candidateId: string;
  votedAt: string;
};

export type VoteResult = {
  name: string;
  votes: number;
};

export type PartyVote = {
  party: string;
  votes: number;
};
