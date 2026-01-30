// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    // Mapping from candidate ID to vote count
    mapping(uint256 => uint256) public votes;

    // Mapping from voter address to a boolean indicating if they have voted
    mapping(address => bool) public hasVoted;

    // Event to be emitted when a vote is cast
    event Voted(address indexed voter, uint256 indexed candidateId);

    // Array of candidate IDs considered valid
    uint256[] public candidateIds;

    // The address that deployed the contract
    address public admin;

    constructor(uint256[] memory _candidateIds) {
        admin = msg.sender;
        candidateIds = _candidateIds;
    }

    // Function for a user to cast their vote
    function vote(uint256 candidateId) public {
        // Check if the voter has already voted
        require(!hasVoted[msg.sender], "You have already voted.");

        // Check if the candidate ID is valid
        bool validCandidate = false;
        for (uint i = 0; i < candidateIds.length; i++) {
            if (candidateIds[i] == candidateId) {
                validCandidate = true;
                break;
            }
        }
        require(validCandidate, "Invalid candidate ID.");

        // Mark the voter as having voted
        hasVoted[msg.sender] = true;

        // Increment the vote count for the candidate
        votes[candidateId]++;

        // Emit the Voted event
        emit Voted(msg.sender, candidateId);
    }

    // Function to get the vote count for a specific candidate
    function getVotes(uint256 candidateId) public view returns (uint256) {
        return votes[candidateId];
    }
}
