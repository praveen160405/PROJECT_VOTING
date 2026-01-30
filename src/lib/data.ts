import type { Candidate, User } from "@/lib/types";

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

export const initialUsers: User[] = [
    {
        id: 'user1',
        fullName: 'Aarav Sharma',
        voterId: 'V987654321',
        isVerified: true,
        createdAt: new Date('2023-10-22T09:00:00Z').toISOString()
    },
    {
        id: 'user2',
        fullName: 'Diya Patel',
        voterId: 'V123456789',
        isVerified: false,
        createdAt: new Date('2023-10-25T11:30:00Z').toISOString()
    },
    {
        id: 'user3',
        fullName: 'Advik Singh',
        voterId: 'V555666777',
        isVerified: true,
        createdAt: new Date('2023-10-28T14:00:00Z').toISOString()
    },
    {
        id: 'user4',
        fullName: 'Ananya Gupta',
        voterId: 'V112233445',
        isVerified: false,
        createdAt: new Date('2023-11-01T16:45:00Z').toISOString()
    },
];
