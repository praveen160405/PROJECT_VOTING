import type { Candidate, Voter, VoteResult, PartyVote } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const findImage = (id: string) => {
    const image = PlaceHolderImages.find(img => img.id === id);
    if (!image) {
        return {
            imageUrl: "https://picsum.photos/seed/placeholder/400/400",
            imageHint: "placeholder image"
        }
    }
    return { imageUrl: image.imageUrl, imageHint: image.imageHint };
}

export const candidates: Candidate[] = [
  {
    id: "c1",
    name: "Evelyn Reed",
    party: "Innovate Party",
    ...findImage("candidate-1"),
  },
  {
    id: "c2",
    name: "Samuel Hayes",
    party: "Future Forward",
    ...findImage("candidate-2"),
  },
  {
    id: "c3",
    name: "Isabella Cortez",
    party: "Progress Alliance",
    ...findImage("candidate-3"),
  },
  {
    id: "c4",
    name: "Benjamin Carter",
    party: "Unity Coalition",
    ...findImage("candidate-4"),
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
    { name: "Evelyn Reed", votes: 4850 },
    { name: "Samuel Hayes", votes: 3920 },
    { name: "Isabella Cortez", votes: 6100 },
    { name: "Benjamin Carter", votes: 2500 },
];

export const partyVotes: PartyVote[] = [
    { party: 'Innovate Party', votes: 4850 },
    { party: 'Future Forward', votes: 3920 },
    { party: 'Progress Alliance', votes: 6100 },
    { party: 'Unity Coalition', votes: 2500 },
];
