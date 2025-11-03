// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@pythnetwork/entropy-sdk-solidity/EntropyStructs.sol";
import "@pythnetwork/entropy-sdk-solidity/IEntropy.sol";
import "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CasinoEntropyConsumerV3
 * @dev Pyth Entropy consumer contract for casino games
 * Generates random numbers for Mines, Plinko, Roulette, and Wheel games using Pyth Entropy
 * Fixed version with correct provider address and dynamic fee calculation
 */
contract CasinoEntropyConsumerV3 is Ownable, IEntropyConsumer {
    event EntropyRequested(bytes32 indexed requestId, GameType gameType, string gameSubType, address requester);
    event EntropyFulfilled(bytes32 indexed requestId, bytes32 randomValue);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    enum GameType {
        MINES,
        PLINKO, 
        ROULETTE,
        WHEEL
    }

    struct EntropyRequest {
        address requester;
        GameType gameType;
        string gameSubType;
        bool fulfilled;
        bytes32 randomValue;
        uint256 timestamp;
        uint64 sequenceNumber;
        bytes32 commitment;
    }

    // Pyth Entropy contract
    IEntropy public entropy;
    
    // Pyth Entropy provider address (correct one)
    address public provider;
    
    // Treasury wallet that can request entropy
    address public treasury;

    // Request tracking
    mapping(bytes32 => EntropyRequest) public requests;
    bytes32[] public requestIds;

    // Game type counters for analytics
    mapping(GameType => uint256) public gameTypeRequests;
    mapping(GameType => uint256) public gameTypeFulfilled;

    modifier onlyTreasury() {
        require(msg.sender == treasury, "Only treasury can call this function");
        _;
    }

    constructor(
        address _entropy,
        address _provider,
        address _treasury
    ) {
        entropy = IEntropy(_entropy);
        provider = _provider;
        treasury = _treasury;
    }

    /**
     * @dev Request random entropy using Pyth Entropy
     * @param userRandomNumber The user's random number for the request
     * @return sequenceNumber The sequence number for the entropy request
     */
    function request(
        bytes32 userRandomNumber
    ) external payable onlyTreasury returns (uint64 sequenceNumber) {
        // Get the actual fee from Pyth Entropy contract
        uint128 requestFee = entropy.getFee(provider);
        require(msg.value >= requestFee, "Insufficient fee for entropy request");

        // Call the actual Pyth Entropy contract with correct interface
        sequenceNumber = entropy.requestWithCallback{value: requestFee}(
            provider,
            userRandomNumber
        );

        // Store request using sequence number as key
        bytes32 requestId = keccak256(abi.encodePacked(sequenceNumber));
        requests[requestId] = EntropyRequest({
            requester: msg.sender,
            gameType: GameType.MINES, // Default, will be updated by frontend
            gameSubType: "",
            fulfilled: false,
            randomValue: bytes32(0),
            timestamp: block.timestamp,
            sequenceNumber: sequenceNumber,
            commitment: userRandomNumber
        });

        requestIds.push(requestId);
        gameTypeRequests[GameType.MINES]++;

        emit EntropyRequested(requestId, GameType.MINES, "", msg.sender);
        
        // Return excess payment
        if (msg.value > requestFee) {
            payable(msg.sender).transfer(msg.value - requestFee);
        }
    }

    /**
     * @dev Get the current entropy fee from Pyth contract
     * @return The current fee in wei
     */
    function entropyFee() external view returns (uint256) {
        return entropy.getFee(provider);
    }

    /**
     * @dev Callback function called by Pyth Entropy when random value is ready
     * @param sequenceNumber The sequence number of the request
     * @param randomValue The random value from Pyth Entropy
     */
    function entropyCallback(
        uint64 sequenceNumber,
        address,
        bytes32 randomValue
    ) internal override {
        bytes32 requestId = keccak256(abi.encodePacked(sequenceNumber));
        require(requests[requestId].requester != address(0), "Request not found");
        require(!requests[requestId].fulfilled, "Request already fulfilled");

        requests[requestId].fulfilled = true;
        requests[requestId].randomValue = randomValue;
        gameTypeFulfilled[requests[requestId].gameType]++;

        emit EntropyFulfilled(requestId, randomValue);
    }

    /**
     * @dev Get the entropy contract address (required by IEntropyConsumer)
     * @return The entropy contract address
     */
    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }

    /**
     * @dev Get entropy request details
     * @param requestId The ID of the entropy request
     * @return Entropy request details
     */
    function getRequest(bytes32 requestId) external view returns (EntropyRequest memory) {
        return requests[requestId];
    }

    /**
     * @dev Check if a request is fulfilled
     * @param requestId The request ID to check
     * @return True if fulfilled
     */
    function isRequestFulfilled(bytes32 requestId) external view returns (bool) {
        return requests[requestId].fulfilled;
    }

    /**
     * @dev Get random value for a fulfilled request
     * @param requestId The request ID
     * @return Random value (0 if not fulfilled)
     */
    function getRandomValue(bytes32 requestId) external view returns (bytes32) {
        if (!requests[requestId].fulfilled) {
            return bytes32(0);
        }
        return requests[requestId].randomValue;
    }

    /**
     * @dev Update treasury address (only owner)
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @dev Withdraw accumulated fees (only owner)
     * @param to Address to send fees to
     */
    function withdrawFees(address to) external onlyOwner {
        require(to != address(0), "Invalid recipient address");
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(to).transfer(balance);
    }

    /**
     * @dev Get contract info
     * @return contractAddress Contract address
     * @return treasuryAddress Treasury address
     * @return entropyAddress Entropy contract address
     * @return providerAddress Provider address
     * @return totalRequests Total request count
     * @return contractBalance Contract balance
     */
    function getContractInfo() external view returns (
        address contractAddress,
        address treasuryAddress,
        address entropyAddress,
        address providerAddress,
        uint256 totalRequests,
        uint256 contractBalance
    ) {
        contractAddress = address(this);
        treasuryAddress = treasury;
        entropyAddress = address(entropy);
        providerAddress = provider;
        totalRequests = requestIds.length;
        contractBalance = address(this).balance;
    }
}