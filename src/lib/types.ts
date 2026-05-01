
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
  electionId: string;
  timestamp: any;
  isVerified: boolean;
  txHash?: string;
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
  aadharNumber: string;
  isAdmin?: boolean;
  region?: string;
  age?: number;
  faceImageHash?: string;
};

export type Threat = {
  id: string;
  ipAddress: string;
  type: string;
  timestamp: any;
  payload: string;
};

export type BlockedIp = {
  id: string;
  ip: string;
  reason: string;
  timestamp: any;
};
