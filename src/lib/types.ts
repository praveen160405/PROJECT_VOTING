export type Candidate = {
  id: string;
  name: string;
  party: string;
  imageUrl?: string;
  imageHint?: string;
};

export type Vote = {
  id: string;
  voterId: string;
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

export type Voter = {
  id: string;
  voterId: string;
  firstName: string;
  lastName: string;
  isAdmin?: boolean;
};
