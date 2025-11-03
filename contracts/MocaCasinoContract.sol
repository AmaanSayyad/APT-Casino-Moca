// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MocaCasinoContract
 * @dev Casino contract for Moca Chain Testnet
 * Handles deposits, withdrawals, and game interactions
 * Entropy generation is handled by Arbitrum Sepolia backend
 */
contract MocaCasinoContract is Ownable, ReentrancyGuard {
    event Deposit(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed user, uint256 amount, uint256 timestamp);
    event GamePlayed(address indexed user, GameType gameType, uint256 betAmount, uint256 timestamp);
    event GameResult(address indexed user, GameType gameType, uint256 betAmount, uint256 winAmount, bool won, uint256 timestamp);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event MinDepositUpdated(uint256 oldAmount, uint256 newAmount);
    event MaxDepositUpdated(uint256 oldAmount, uint256 newAmount);

    enum GameType {
        MINES,
        PLINKO, 
        ROULETTE,
        WHEEL
    }

    struct UserBalance {
        uint256 balance;
        uint256 totalDeposited;
        uint256 totalWithdrawn;
        uint256 totalWon;
        uint256 totalLost;
        uint256 gamesPlayed;
        uint256 lastActivity;
    }

    struct GameSession {
        address user;
        GameType gameType;
        uint256 betAmount;
        uint256 timestamp;
        bool completed;
        bool won;
        uint256 winAmount;
        bytes32 entropyRequestId; // Reference to Arbitrum Sepolia entropy request
    }

    // Treasury wallet
    address public treasury;
    
    // User balances
    mapping(address => UserBalance) public userBalances;
    
    // Game sessions
    mapping(bytes32 => GameSession) public gameSessions;
    bytes32[] public gameSessionIds;
    
    // Deposit/Withdrawal limits
    uint256 public minDeposit = 0.001 ether; // 0.001 MOCA
    uint256 public maxDeposit = 100 ether;   // 100 MOCA
    uint256 public minWithdrawal = 0.001 ether;
    
    // Game statistics
    mapping(GameType => uint256) public gameTypeCount;
    mapping(GameType => uint256) public gameTypeTotalBets;
    mapping(GameType => uint256) public gameTypeTotalWins;
    
    // Contract statistics
    uint256 public totalDeposits;
    uint256 public totalWithdrawals;
    uint256 public totalGamesPlayed;
    uint256 public contractBalance;

    modifier onlyTreasury() {
        require(msg.sender == treasury, "Only treasury can call this function");
        _;
    }

    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be greater than 0");
        _;
    }

    constructor(address _treasury) {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
    }

    /**
     * @dev Deposit MOCA tokens to user balance
     */
    function deposit() external payable validAmount(msg.value) nonReentrant {
        require(msg.value >= minDeposit, "Deposit amount too low");
        require(msg.value <= maxDeposit, "Deposit amount too high");

        UserBalance storage user = userBalances[msg.sender];
        user.balance += msg.value;
        user.totalDeposited += msg.value;
        user.lastActivity = block.timestamp;

        totalDeposits += msg.value;
        contractBalance += msg.value;

        emit Deposit(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Withdraw MOCA tokens from user balance
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external validAmount(amount) nonReentrant {
        require(amount >= minWithdrawal, "Withdrawal amount too low");
        
        UserBalance storage user = userBalances[msg.sender];
        require(user.balance >= amount, "Insufficient balance");
        require(address(this).balance >= amount, "Insufficient contract balance");

        user.balance -= amount;
        user.totalWithdrawn += amount;
        user.lastActivity = block.timestamp;

        totalWithdrawals += amount;
        contractBalance -= amount;

        payable(msg.sender).transfer(amount);

        emit Withdrawal(msg.sender, amount, block.timestamp);
    }

    /**
     * @dev Start a game session (called by frontend before entropy request)
     * @param gameType Type of game being played
     * @param betAmount Amount being bet
     * @return sessionId Unique session ID
     */
    function startGameSession(
        GameType gameType,
        uint256 betAmount
    ) external validAmount(betAmount) returns (bytes32 sessionId) {
        UserBalance storage user = userBalances[msg.sender];
        require(user.balance >= betAmount, "Insufficient balance for bet");

        // Deduct bet amount from user balance
        user.balance -= betAmount;
        user.lastActivity = block.timestamp;

        // Create session ID
        sessionId = keccak256(abi.encodePacked(
            msg.sender,
            gameType,
            betAmount,
            block.timestamp,
            block.number
        ));

        // Store game session
        gameSessions[sessionId] = GameSession({
            user: msg.sender,
            gameType: gameType,
            betAmount: betAmount,
            timestamp: block.timestamp,
            completed: false,
            won: false,
            winAmount: 0,
            entropyRequestId: bytes32(0)
        });

        gameSessionIds.push(sessionId);
        gameTypeCount[gameType]++;
        gameTypeTotalBets[gameType] += betAmount;

        emit GamePlayed(msg.sender, gameType, betAmount, block.timestamp);
    }

    /**
     * @dev Complete a game session with results (called by treasury after entropy fulfillment)
     * @param sessionId Game session ID
     * @param won Whether the user won
     * @param winAmount Amount won (if any)
     * @param entropyRequestId Reference to the entropy request on Arbitrum Sepolia
     */
    function completeGameSession(
        bytes32 sessionId,
        bool won,
        uint256 winAmount,
        bytes32 entropyRequestId
    ) external onlyTreasury {
        GameSession storage session = gameSessions[sessionId];
        require(session.user != address(0), "Session not found");
        require(!session.completed, "Session already completed");

        session.completed = true;
        session.won = won;
        session.winAmount = winAmount;
        session.entropyRequestId = entropyRequestId;

        UserBalance storage user = userBalances[session.user];
        user.gamesPlayed++;
        user.lastActivity = block.timestamp;

        if (won && winAmount > 0) {
            user.balance += winAmount;
            user.totalWon += winAmount;
            gameTypeTotalWins[session.gameType] += winAmount;
            contractBalance -= winAmount;
        } else {
            user.totalLost += session.betAmount;
            contractBalance += session.betAmount;
        }

        totalGamesPlayed++;

        emit GameResult(
            session.user,
            session.gameType,
            session.betAmount,
            winAmount,
            won,
            block.timestamp
        );
    }

    /**
     * @dev Get user balance and statistics
     * @param user User address
     * @return User balance information
     */
    function getUserBalance(address user) external view returns (UserBalance memory) {
        return userBalances[user];
    }

    /**
     * @dev Get game session details
     * @param sessionId Session ID
     * @return Game session information
     */
    function getGameSession(bytes32 sessionId) external view returns (GameSession memory) {
        return gameSessions[sessionId];
    }

    /**
     * @dev Get all game session IDs for a user
     * @param user User address
     * @return Array of session IDs
     */
    function getUserGameSessions(address user) external view returns (bytes32[] memory) {
        uint256 count = 0;
        
        // Count user sessions
        for (uint256 i = 0; i < gameSessionIds.length; i++) {
            if (gameSessions[gameSessionIds[i]].user == user) {
                count++;
            }
        }

        // Create result array
        bytes32[] memory result = new bytes32[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < gameSessionIds.length; i++) {
            if (gameSessions[gameSessionIds[i]].user == user) {
                result[index] = gameSessionIds[i];
                index++;
            }
        }

        return result;
    }

    /**
     * @dev Get contract statistics
     * @return _totalDeposits Total deposits amount
     * @return _totalWithdrawals Total withdrawals amount
     * @return _totalGamesPlayed Total games played count
     * @return _contractBalance Current contract balance
     * @return _userCount Approximate user count
     */
    function getContractStats() external view returns (
        uint256 _totalDeposits,
        uint256 _totalWithdrawals,
        uint256 _totalGamesPlayed,
        uint256 _contractBalance,
        uint256 _userCount
    ) {
        _totalDeposits = totalDeposits;
        _totalWithdrawals = totalWithdrawals;
        _totalGamesPlayed = totalGamesPlayed;
        _contractBalance = contractBalance;
        _userCount = gameSessionIds.length; // Approximation
    }

    /**
     * @dev Get game type statistics
     * @param gameType Game type to query
     * @return count Number of games played for this type
     * @return totalBets Total bets amount for this type
     * @return totalWins Total wins amount for this type
     */
    function getGameTypeStats(GameType gameType) external view returns (
        uint256 count,
        uint256 totalBets,
        uint256 totalWins
    ) {
        count = gameTypeCount[gameType];
        totalBets = gameTypeTotalBets[gameType];
        totalWins = gameTypeTotalWins[gameType];
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
     * @dev Update minimum deposit amount (only owner)
     * @param newMinDeposit New minimum deposit amount
     */
    function updateMinDeposit(uint256 newMinDeposit) external onlyOwner {
        uint256 oldAmount = minDeposit;
        minDeposit = newMinDeposit;
        emit MinDepositUpdated(oldAmount, newMinDeposit);
    }

    /**
     * @dev Update maximum deposit amount (only owner)
     * @param newMaxDeposit New maximum deposit amount
     */
    function updateMaxDeposit(uint256 newMaxDeposit) external onlyOwner {
        uint256 oldAmount = maxDeposit;
        maxDeposit = newMaxDeposit;
        emit MaxDepositUpdated(oldAmount, newMaxDeposit);
    }

    /**
     * @dev Emergency withdrawal for owner (only in case of emergency)
     * @param to Address to send funds to
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient address");
        require(amount <= address(this).balance, "Insufficient contract balance");
        
        payable(to).transfer(amount);
    }

    /**
     * @dev Get contract balance
     * @return Current contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Receive function to accept MOCA deposits
     */
    receive() external payable {
        // Allow direct MOCA transfers to contract
        contractBalance += msg.value;
    }
}