// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _transferOwnership(_msgSender());
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

/**
 * @title MocaGameLogger
 * @dev Complete game logging contract for Moca Chain
 * Logs detailed game information similar to 0G Network implementation
 */
contract MocaGameLogger is Ownable {
    
    struct GameLog {
        string gameId;
        string gameType;
        address userAddress;
        uint256 betAmount;
        uint256 payoutAmount;
        bool isWin;
        string gameConfig;
        string resultData;
        string entropyProof;
        uint256 timestamp;
        uint256 blockNumber;
    }
    
    // Events
    event GameLogged(
        string indexed gameId,
        string indexed gameType,
        address indexed userAddress,
        uint256 betAmount,
        uint256 payoutAmount,
        bool isWin,
        uint256 timestamp
    );
    
    event LoggerStatsUpdated(
        uint256 totalLogs,
        uint256 totalGasUsed,
        address lastLogger
    );
    
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    
    // Storage
    mapping(string => GameLog) public gameLogs;
    mapping(string => bool) public gameExists;
    mapping(address => uint256) public userLogCounts;
    mapping(string => uint256) public gameTypeLogCounts;
    mapping(address => string[]) public userGameIds;
    
    uint256 public totalLogs;
    uint256 public totalGasUsed;
    address public lastLogger;
    string[] public allGameIds;
    
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
     * @dev Log a complete game result with detailed information
     * @param gameId Unique game identifier
     * @param gameType Type of game (MINES, PLINKO, ROULETTE, WHEEL)
     * @param userAddress Player's address
     * @param betAmount Bet amount in wei
     * @param payoutAmount Payout amount in wei
     * @param isWin Whether the game was won
     * @param gameConfig JSON string of game configuration
     * @param resultData JSON string of game result data
     * @param entropyProof JSON string of entropy proof data
     */
    function logGame(
        string memory gameId,
        string memory gameType,
        address userAddress,
        uint256 betAmount,
        uint256 payoutAmount,
        bool isWin,
        string memory gameConfig,
        string memory resultData,
        string memory entropyProof
    ) external onlyTreasury {
        require(bytes(gameId).length > 0, "Game ID cannot be empty");
        require(!gameExists[gameId], "Game already logged");
        require(userAddress != address(0), "Invalid user address");
        
        uint256 gasStart = gasleft();
        
        // Create game log
        GameLog memory newLog = GameLog({
            gameId: gameId,
            gameType: gameType,
            userAddress: userAddress,
            betAmount: betAmount,
            payoutAmount: payoutAmount,
            isWin: isWin,
            gameConfig: gameConfig,
            resultData: resultData,
            entropyProof: entropyProof,
            timestamp: block.timestamp,
            blockNumber: block.number
        });
        
        // Store the log
        gameLogs[gameId] = newLog;
        gameExists[gameId] = true;
        
        // Update mappings and arrays
        userLogCounts[userAddress]++;
        gameTypeLogCounts[gameType]++;
        userGameIds[userAddress].push(gameId);
        allGameIds.push(gameId);
        totalLogs++;
        lastLogger = msg.sender;
        
        // Calculate gas used
        uint256 gasUsed = gasStart - gasleft();
        totalGasUsed += gasUsed;
        
        // Emit events
        emit GameLogged(
            gameId,
            gameType,
            userAddress,
            betAmount,
            payoutAmount,
            isWin,
            block.timestamp
        );
        
        emit LoggerStatsUpdated(
            totalLogs,
            totalGasUsed,
            msg.sender
        );
    }
    
    /**
     * @dev Get game log by ID
     * @param gameId Game ID
     * @return GameLog struct
     */
    function getGameLog(string memory gameId) external view returns (GameLog memory) {
        require(gameExists[gameId], "Game not found");
        return gameLogs[gameId];
    }
    
    /**
     * @dev Get user's games with pagination
     * @param userAddress User's address
     * @param offset Starting index
     * @param limit Number of games to return
     * @return gameIds Array of game IDs for the user
     */
    function getUserGames(
        address userAddress,
        uint256 offset,
        uint256 limit
    ) external view returns (string[] memory gameIds) {
        string[] memory userGames = userGameIds[userAddress];
        
        if (userGames.length == 0 || offset >= userGames.length) {
            return new string[](0);
        }
        
        uint256 end = offset + limit;
        if (end > userGames.length) {
            end = userGames.length;
        }
        
        gameIds = new string[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            uint256 reverseIndex = userGames.length - 1 - i;
            gameIds[i - offset] = userGames[reverseIndex]; // Newest first
        }
    }
    
    /**
     * @dev Get games by type with pagination
     * @param gameType Game type
     * @param offset Starting index
     * @param limit Number of games to return
     * @return gameIds Array of game IDs
     */
    function getGamesByType(
        string memory gameType,
        uint256 offset,
        uint256 limit
    ) external view returns (string[] memory gameIds) {
        uint256 found = 0;
        uint256 skipped = 0;
        
        // Count total games of this type first
        uint256 totalOfType = gameTypeLogCounts[gameType];
        if (totalOfType == 0 || offset >= totalOfType) {
            return new string[](0);
        }
        
        // Calculate actual limit
        uint256 actualLimit = limit;
        if (offset + limit > totalOfType) {
            actualLimit = totalOfType - offset;
        }
        
        gameIds = new string[](actualLimit);
        
        // Iterate through all games in reverse order (newest first)
        for (uint256 i = allGameIds.length; i > 0 && found < actualLimit; i--) {
            string memory currentGameId = allGameIds[i - 1];
            GameLog memory game = gameLogs[currentGameId];
            
            if (keccak256(bytes(game.gameType)) == keccak256(bytes(gameType))) {
                if (skipped >= offset) {
                    gameIds[found] = currentGameId;
                    found++;
                } else {
                    skipped++;
                }
            }
        }
        
        // Resize array if needed
        if (found < actualLimit) {
            string[] memory resizedGameIds = new string[](found);
            for (uint256 i = 0; i < found; i++) {
                resizedGameIds[i] = gameIds[i];
            }
            return resizedGameIds;
        }
        
        return gameIds;
    }
    
    /**
     * @dev Get recent games with pagination
     * @param offset Starting index
     * @param limit Number of games to return
     * @return gameIds Array of recent game IDs
     */
    function getRecentGames(uint256 offset, uint256 limit) external view returns (string[] memory gameIds) {
        if (allGameIds.length == 0 || offset >= allGameIds.length) {
            return new string[](0);
        }
        
        uint256 end = offset + limit;
        if (end > allGameIds.length) {
            end = allGameIds.length;
        }
        
        gameIds = new string[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            uint256 reverseIndex = allGameIds.length - 1 - i;
            gameIds[i - offset] = allGameIds[reverseIndex]; // Newest first
        }
    }
    
    /**
     * @dev Get logger statistics
     * @return _totalLogs Total number of logs
     * @return _totalGasUsed Total gas used
     * @return _lastLogger Last logger address
     * @return _averageGasPerLog Average gas per log
     */
    function getLoggerStats() external view returns (
        uint256 _totalLogs,
        uint256 _totalGasUsed,
        address _lastLogger,
        uint256 _averageGasPerLog
    ) {
        _totalLogs = totalLogs;
        _totalGasUsed = totalGasUsed;
        _lastLogger = lastLogger;
        _averageGasPerLog = totalLogs > 0 ? totalGasUsed / totalLogs : 0;
    }
    
    /**
     * @dev Get user's log count
     * @param user User address
     * @return count Number of games logged by user
     */
    function getUserLogCount(address user) external view returns (uint256) {
        return userLogCounts[user];
    }
    
    /**
     * @dev Get game type log count
     * @param gameType Game type
     * @return count Number of games of this type
     */
    function getGameTypeLogCount(string memory gameType) external view returns (uint256) {
        return gameTypeLogCounts[gameType];
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
     * @return totalLogsCount Total games logged
     */
    function getContractInfo() external view returns (
        address contractAddress,
        address treasuryAddress,
        uint256 totalLogsCount
    ) {
        contractAddress = address(this);
        treasuryAddress = treasury;
        totalLogsCount = totalLogs;
    }
}