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
    name: "M.K. Stalin",
    party: "Dravida Munnetra Kazhagam (DMK)",
    ...findImage("candidate-1"),
  },
  {
    id: "c2",
    name: "Edappadi K. Palaniswami",
    party: "All India Anna Dravida Munnetra Kazhagam (ADMK)",
    ...findImage("candidate-2"),
  },
  {
    id: "c3",
    name: "Vijay",
    party: "Tamizhaga Vetri Kazhagam (TVK)",
    ...findImage("candidate-3"),
  },
  {
    id: "c4",
    name: "Seeman",
    party: "Naam Tamilar Katchi (NTK)",
    ...findImage("candidate-4"),
  },
  {
    id: "c5",
    name: "K. Annamalai",
    party: "Bharatiya Janata Party (BJP)",
    ...findImage("candidate-5"),
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
    { name: "M.K. Stalin", votes: 4850 },
    { name: "Edappadi K. Palaniswami", votes: 3920 },
    { name: "Vijay", votes: 6100 },
    { name: "Seeman", votes: 2500 },
    { name: "K. Annamalai", votes: 3200 },
];

export const partyVotes: PartyVote[] = [
    { party: 'DMK', votes: 4850 },
    { party: 'ADMK', votes: 3920 },
    { party: 'TVK', votes: 6100 },
    { party: 'NTK', votes: 2500 },
    { party: 'BJP', votes: 3200 },
];
