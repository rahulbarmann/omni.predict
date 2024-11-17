// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity >=0.8.19 <0.9.0;

import "@fhenixprotocol/contracts/FHE.sol";
import "@fhenixprotocol/contracts/access/Permission.sol";

contract Voting is Permissioned {
    uint8 internal constant MAX_OPTIONS = 2;
    uint256 internal constant BASE_PRICE = 100;  // Replaced ether with uint for simplicity
    uint256 internal constant PRICE_SCALE = 10;  // Replaced ether with uint for simplicity

    struct Proposal {
        string description;
        string[] options;
        uint256 endTime; // Time in seconds
        euint128 totalYesShares; // Encrypted total shares for YES
        euint128 totalNoShares;  // Encrypted total shares for NO
        euint128 totalYesContributions; // Encrypted total contributions for YES
        euint128 totalNoContributions;  // Encrypted total contributions for NO
        mapping(address => euint128) yesShares; // Encrypted YES shares per user
        mapping(address => euint128) noShares;  // Encrypted NO shares per user
        address[] voters;
    }

    mapping(uint => Proposal) public proposals;
    uint public proposalCount;

    function createProposal(
        string memory _description,
        string[] memory _options,
        uint256 votingPeriod
    ) public returns (uint256) {
        require(_options.length <= MAX_OPTIONS, "Too many options!");

        Proposal storage newProposal = proposals[proposalCount++];
        newProposal.description = _description;
        newProposal.options = _options;

        // Set the end time in seconds
        newProposal.endTime = block.timestamp + votingPeriod;

        return proposalCount - 1;
    }

    function getPriceForYes(Proposal storage proposal) internal view returns (euint128) {
        return FHE.asEuint128(BASE_PRICE + PRICE_SCALE * FHE.decrypt(proposal.totalYesShares));
    }

    function getPriceForNo(Proposal storage proposal) internal view returns (euint128) {
        return FHE.asEuint128(BASE_PRICE + PRICE_SCALE * FHE.decrypt(proposal.totalNoShares));
    }

    function buyYesShares(uint proposalId, uint256 amount) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp < proposal.endTime, "Voting is over");

        euint128 cost = FHE.asEuint128(0);
        for (uint256 i = 0; i < amount; i++) {
            cost = cost + getPriceForYes(proposal);
            proposal.totalYesShares = proposal.totalYesShares + FHE.asEuint128(1);
        }

        // No actual payment is required, just update the state
        proposal.yesShares[msg.sender] = proposal.yesShares[msg.sender] + FHE.asEuint128(amount);
        proposal.totalYesContributions = proposal.totalYesContributions + cost;

        if (FHE.decrypt(proposal.yesShares[msg.sender]) == amount) {
            proposal.voters.push(msg.sender);
        }
    }

    function buyNoShares(uint proposalId, uint256 amount) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp < proposal.endTime, "Voting is over");

        euint128 cost = FHE.asEuint128(0);
        for (uint256 i = 0; i < amount; i++) {
            cost = cost + getPriceForNo(proposal);
            proposal.totalNoShares = proposal.totalNoShares + FHE.asEuint128(1);
        }

        // No actual payment is required, just update the state
        proposal.noShares[msg.sender] = proposal.noShares[msg.sender] + FHE.asEuint128(amount);
        proposal.totalNoContributions = proposal.totalNoContributions + cost;

        if (FHE.decrypt(proposal.noShares[msg.sender]) == amount) {
            proposal.voters.push(msg.sender);
        }
    }

    function distributeRewards(uint proposalId) public {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime, "Voting is still in progress");

        bool isYesWinning = FHE.decrypt(proposal.totalYesShares) >= FHE.decrypt(proposal.totalNoShares);
        euint128 totalContributions = isYesWinning ? proposal.totalYesContributions : proposal.totalNoContributions;
        euint128 totalShares = isYesWinning ? proposal.totalYesShares : proposal.totalNoShares;

        for (uint i = 0; i < proposal.voters.length; i++) {
            address voter = proposal.voters[i];
            euint128 shares = isYesWinning ? proposal.yesShares[voter] : proposal.noShares[voter];
            uint128 payout = FHE.decrypt(shares) * FHE.decrypt(totalContributions) / FHE.decrypt(totalShares);

            // No actual payment here; it can be handled separately if needed
        }
    }

    function getAllProposals() public view returns (
        string[] memory descriptions,
        string[][] memory options,
        uint256[] memory endTimes,
        uint256[] memory currentYesPrices,
        uint256[] memory currentNoPrices
    ) {
        require(proposalCount > 0, "No proposals available");

        descriptions = new string[](proposalCount);
        options = new string[][](proposalCount);
        endTimes = new uint256[](proposalCount);
        currentYesPrices = new uint256[](proposalCount);
        currentNoPrices = new uint256[](proposalCount);

        for (uint i = 0; i < proposalCount; i++) {
            Proposal storage proposal = proposals[i];
            descriptions[i] = proposal.description;
            options[i] = proposal.options;
            endTimes[i] = proposal.endTime;

            uint256 decryptedYesShares = FHE.decrypt(proposal.totalYesShares);
            uint256 decryptedNoShares = FHE.decrypt(proposal.totalNoShares);

            currentYesPrices[i] = BASE_PRICE + PRICE_SCALE * decryptedYesShares;
            currentNoPrices[i] = BASE_PRICE + PRICE_SCALE * decryptedNoShares;
        }

        return (descriptions, options, endTimes, currentYesPrices, currentNoPrices);
    }
}
