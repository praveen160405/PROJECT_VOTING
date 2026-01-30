// NOTE: This is a placeholder for your smart contract's details.
// You will need to replace these with your actual contract address and ABI.

export const votingContractAddress = "0x0000000000000000000000000000000000000000";

export const votingContractABI = [
    // A simplified ABI for demonstration purposes.
    // Replace with your actual contract ABI.

    // Event emitted when a vote is cast
    "event Voted(address indexed voter, uint256 indexed candidateId)",

    // Function to cast a vote
    "function vote(uint256 candidateId)",

    // Function to get the vote count for a candidate
    "function getVotes(uint256 candidateId) public view returns (uint256)",

    // Function to check if an address has voted
    "function hasVoted(address voter) public view returns (bool)",
];
