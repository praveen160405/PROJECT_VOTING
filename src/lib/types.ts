export type Candidate = {
  id: string;
  name: string;
  party: string;
  imageUrl?: string;
  imageHint?: string;
};

export type User = {
  id: string;
  name: string;
  voterId: string;
  registeredAt: string;
  isVerified: boolean;
};

export type VoteResult = {
  name: string;
  votes: number;
};

export type PartyVote = {
  party: string;
  votes: number;
};
