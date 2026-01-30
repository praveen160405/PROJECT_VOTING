// This file contains the address and ABI for the deployed Voting smart contract.
// You must deploy the contract located in `contracts/Voting.sol` and update
// the `votingContractAddress` with your actual contract address.

// When deploying `Voting.sol`, you need to pass the candidate IDs to the constructor.
// Based on `src/lib/data.ts`, the IDs should be: [1, 2, 3, 4, 5]

export const votingContractAddress = "0x0000000000000000000000000000000000000000";

// The Human-Readable ABI for the Voting contract.
export const votingContractABI = [
    // Event emitted when a vote is cast
    "event Voted(address indexed voter, uint256 indexed candidateId)",

    // Function to cast a vote
    "function vote(uint256 candidateId)",

    // Function to get the vote count for a candidate
    "function getVotes(uint256 candidateId) public view returns (uint256)",

    // Function to check if an address has voted
    "function hasVoted(address voter) public view returns (bool)",
];
