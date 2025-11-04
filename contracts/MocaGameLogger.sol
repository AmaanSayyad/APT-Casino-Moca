// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MocaGameLogger
 * @dev Game result logging contract for Moca Chain
 * Logs all game results from Wheels, Plinko, Roulette, and Mines games
 */
contract MocaGameLogger is Ownable {
    
    enum GameType {
        MINES,
        PLINKO,
        ROULETTE,
        WHEEL
    }
    
    struct GameResult {
        uint256 gameId;
        address player;
        GameType gameType;
        string gameSubType;
        uint256 betAmount;
        bool won;
        uint256 winAmount;
        uint256 multiplier; // Multiplier * 100 (e.g., 250 = 2.5x)
        bytes32 entropyTxHash; // Arbitrum Sepolia entropy transaction hash
        uint64 entropySequenceNumber;
        bytes32 randomValue;
        uint256 timestamp;
        uint256 blockNumber;
        string gameData; // JSON string with game-specific data
    }
    
    // Events
    event GameLogged(
        uint256 indexed gameId,
        address indexed player,
        GameType indexed gameType,
        string gameSubType,
        uint256 betAmount,
        bool won,
        uint256 winAmount,
        bytes32 entropyTxHash
    );
    
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    
    // Storage
    mapping(uint256 => GameResult) public games;
    mapping(address => uint256[]) public playerGames;
    mapping(GameType => uint256[]) public gamesByType;
    
    uint256 public totalGames;
    uint256 public totalBetAmount;
    uint256 public totalWinAmount;
    
    // Game type counters
    mapping(GameType => uint256) public gameTypeCount;
    mapping(GameType => uint256) public gameTypeWins;
    mapping(GameType => uint256) public gameTypeBetAmount;
    mapping(GameType => uint256) public gameTypeWinAmount;
    
    // Treasury address that can log games
    address public treasury;
    
    modifier onlyTreasury() {
        require(msg.sender == treasury, "Only treasury can log games");
        _;
    }
    
    constructor(address _treasury) {
        treasury = _treasury;
    }
    
    /**
     * @dev Log a game result
     * @param player Player address
     * @param gameType Type of game (0=MINES, 1=PLINKO, 2=ROULETTE, 3=WHEEL)
     * @param gameSubType Sub-type of game (e.g., "red", "9-mines", "high-risk")
     * @param betAmount Bet amount in wei
     * @param won Whether player won
     * @param winAmount Win amount in wei
     * @param multiplier Multiplier * 100 (e.g., 250 = 2.5x)
     * @param entropyTxHash Arbitrum Sepolia entropy transaction hash
     * @param entropySequenceNumber Entropy sequence number
     * @param randomValue Random value used
     * @param gameData JSON string with game-specific data
     */
    function logGame(
        address player,
        GameType gameType,
        string memory gameSubType,
        uint256 betAmount,
        bool won,
        uint256 winAmount,
        uint256 multiplier,
        bytes32 entropyTxHash,
        uint64 entropySequenceNumber,
        bytes32 randomValue,
        string memory gameData
    ) external onlyTreasury {
        require(player != address(0), "Invalid player address");
        require(betAmount > 0, "Bet amount must be greater than 0");
        
        uint256 gameId = totalGames + 1;
        
        games[gameId] = GameResult({
            gameId: gameId,
            player: player,
            gameType: gameType,
            gameSubType: gameSubType,
            betAmount: betAmount,
            won: won,
            winAmount: winAmount,
            multiplier: multiplier,
            entropyTxHash: entropyTxHash,
            entropySequenceNumber: entropySequenceNumber,
            randomValue: randomValue,
            timestamp: block.timestamp,
            blockNumber: block.number,
            gameData: gameData
        });
        
        // Update mappings
        playerGames[player].push(gameId);
        gamesByType[gameType].push(gameId);
        
        // Update counters
        totalGames++;
        totalBetAmount += betAmount;
        totalWinAmount += winAmount;
        
        gameTypeCount[gameType]++;
        gameTypeBetAmount[gameType] += betAmount;
        
        if (won) {
            gameTypeWins[gameType]++;
            gameTypeWinAmount[gameType] += winAmount;
        }
        
        emit GameLogged(
            gameId,
            player,
            gameType,
            gameSubType,
            betAmount,
            won,
            winAmount,
            entropyTxHash
        );
    }
    
    /**
     * @dev Get game result by ID
     * @param gameId Game ID
     * @return GameResult struct
     */
    function getGame(uint256 gameId) external view returns (GameResult memory) {
        require(gameId > 0 && gameId <= totalGames, "Invalid game ID");
        return games[gameId];
    }
    
    /**
     * @dev Get player's game history
     * @param player Player address
     * @param offset Starting index
     * @param limit Number of games to return
     * @return gameIds Array of game IDs
     */
    function getPlayerGames(
        address player,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory gameIds) {
        uint256[] memory allGames = playerGames[player];
        
        if (allGames.length == 0 || offset >= allGames.length) {
            return new uint256[](0);
        }
        
        uint256 end = offset + limit;
        if (end > allGames.length) {
            end = allGames.length;
        }
        
        gameIds = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            uint256 reverseIndex = allGames.length - 1 - i;
            gameIds[i - offset] = allGames[reverseIndex]; // Reverse order (newest first)
        }
    }
    
    /**
     * @dev Get games by type
     * @param gameType Game type
     * @param offset Starting index
     * @param limit Number of games to return
     * @return gameIds Array of game IDs
     */
    function getGamesByType(
        GameType gameType,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory gameIds) {
        uint256[] memory allGames = gamesByType[gameType];
        
        if (allGames.length == 0 || offset >= allGames.length) {
            return new uint256[](0);
        }
        
        uint256 end = offset + limit;
        if (end > allGames.length) {
            end = allGames.length;
        }
        
        gameIds = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            uint256 reverseIndex = allGames.length - 1 - i;
            gameIds[i - offset] = allGames[reverseIndex]; // Reverse order (newest first)
        }
    }
    
    /**
     * @dev Get recent games
     * @param limit Number of games to return
     * @return gameIds Array of recent game IDs
     */
    function getRecentGames(uint256 limit) external view returns (uint256[] memory gameIds) {
        if (totalGames == 0) {
            return new uint256[](0);
        }
        
        uint256 count = limit > totalGames ? totalGames : limit;
        gameIds = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            gameIds[i] = totalGames - i; // Newest first (totalGames is 1-based)
        }
    }
    
    /**
     * @dev Get game statistics
     * @return totalGamesCount Total number of games
     * @return totalBetAmountSum Total bet amount
     * @return totalWinAmountSum Total win amount
     * @return houseEdge House edge percentage * 100 (e.g., 250 = 2.5%)
     */
    function getGameStats() external view returns (
        uint256 totalGamesCount,
        uint256 totalBetAmountSum,
        uint256 totalWinAmountSum,
        uint256 houseEdge
    ) {
        totalGamesCount = totalGames;
        totalBetAmountSum = totalBetAmount;
        totalWinAmountSum = totalWinAmount;
        
        if (totalBetAmount > 0) {
            houseEdge = ((totalBetAmount - totalWinAmount) * 10000) / totalBetAmount;
        } else {
            houseEdge = 0;
        }
    }
    
    /**
     * @dev Get game type statistics
     * @param gameType Game type
     * @return count Number of games
     * @return wins Number of wins
     * @return betAmount Total bet amount
     * @return winAmount Total win amount
     * @return winRate Win rate percentage * 100 (e.g., 4500 = 45%)
     */
    function getGameTypeStats(GameType gameType) external view returns (
        uint256 count,
        uint256 wins,
        uint256 betAmount,
        uint256 winAmount,
        uint256 winRate
    ) {
        count = gameTypeCount[gameType];
        wins = gameTypeWins[gameType];
        betAmount = gameTypeBetAmount[gameType];
        winAmount = gameTypeWinAmount[gameType];
        
        if (count > 0) {
            winRate = (wins * 10000) / count;
        } else {
            winRate = 0;
        }
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
     * @dev Get contract info
     * @return contractAddress This contract address
     * @return treasuryAddress Treasury address
     * @return totalGamesCount Total games logged
     * @return contractBalance Contract balance
     */
    function getContractInfo() external view returns (
        address contractAddress,
        address treasuryAddress,
        uint256 totalGamesCount,
        uint256 contractBalance
    ) {
        contractAddress = address(this);
        treasuryAddress = treasury;
        totalGamesCount = totalGames;
        contractBalance = address(this).balance;
    }
}