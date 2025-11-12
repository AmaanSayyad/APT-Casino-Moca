# Moca Stack & AIR Integration Guide

## Overview

This document explains how to integrate and use Moca Stack features including AIR (Autonomous Incentive Rewards), Moca ID, and Realm Points in the APT Casino application.

## Features

### 1. AIR (Autonomous Incentive Rewards)
- Automatic rewards for gameplay
- Balance tracking
- Transaction history
- Reward multipliers

### 2. Moca ID
- Unique user identification
- Cross-platform identity
- Achievement tracking
- Profile management

### 3. Realm Points
- Experience points system
- Level progression
- Leaderboards
- Special rewards

## Setup

### Step 1: Get API Credentials

1. Visit [Moca Network Developer Portal](https://developers.moca.network)
2. Create an account or sign in
3. Navigate to "API Keys" section
4. Generate a new AIR API key
5. Copy your credentials

### Step 2: Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Moca Stack & AIR Integration
NEXT_PUBLIC_MOCA_AIR_API_KEY=your_air_api_key_here
NEXT_PUBLIC_MOCA_AIR_API_URL=https://api.moca.network/air
NEXT_PUBLIC_MOCA_ID_API_URL=https://api.moca.network/id
NEXT_PUBLIC_MOCA_REALM_API_URL=https://api.moca.network/realm
NEXT_PUBLIC_ENABLE_MOCA_STACK=true
```

### Step 3: Verify Integration

Run the application and check the console for:
```
🔧 Initializing Moca Stack...
✅ Moca Stack initialized successfully
```

## Usage

### In React Components

```javascript
import { useMocaStack } from '@/hooks/useMocaStack';

function MyComponent() {
  const { 
    mocaId, 
    airBalance, 
    realmData, 
    awardAIR, 
    trackGameActivity 
  } = useMocaStack();

  // Display user data
  console.log('Moca ID:', mocaId);
  console.log('AIR Balance:', airBalance);
  console.log('Realm Points:', realmData.points);
  console.log('Level:', realmData.level);

  // Award AIR
  const handleReward = async () => {
    const result = await awardAIR(100, 'daily_bonus');
    if (result.success) {
      console.log('Reward successful!');
    }
  };

  // Track game activity
  const handleGameEnd = async (gameData) => {
    const result = await trackGameActivity({
      gameType: 'ROULETTE',
      betAmount: 10,
      won: true,
      winAmount: 20
    });
    
    if (result.levelUp) {
      console.log('Level up!');
    }
  };
}
```

### Display Moca Stack Widget

```javascript
import MocaStackWidget from '@/components/MocaStack/MocaStackWidget';

function Layout() {
  return (
    <div>
      <MocaStackWidget />
      {/* Your other components */}
    </div>
  );
}
```

### In API Routes

```javascript
import mocaStackService from '@/services/MocaStackService';

export async function POST(request) {
  const { walletAddress, gameData } = await request.json();

  // Award AIR
  const airResult = await mocaStackService.awardAIR(
    walletAddress,
    100,
    'game_win'
  );

  // Track activity
  const realmResult = await mocaStackService.trackGameActivity(
    walletAddress,
    gameData
  );

  return Response.json({
    air: airResult,
    realm: realmResult
  });
}
```

## Reward System

### AIR Rewards

Automatic rewards are given for:
- **Playing games**: 10 AIR per MOCA bet
- **Winning games**: Bonus 20% of win amount
- **Daily login**: 50 AIR
- **Achievements**: Variable amounts

### Realm Points

Points are earned through:
- **Game participation**: 1 point per game
- **Winning**: 5 points per win
- **Consecutive wins**: Multiplier bonus
- **High stakes**: Bonus for larger bets

### Level System

| Level | Points Required | Benefits |
|-------|----------------|----------|
| 1     | 0              | Basic access |
| 2     | 100            | +5% AIR bonus |
| 3     | 300            | +10% AIR bonus |
| 4     | 600            | +15% AIR bonus |
| 5     | 1000           | +20% AIR bonus |

## API Reference

### MocaStackService

#### `initialize()`
Initialize the Moca Stack connection.

```javascript
await mocaStackService.initialize();
```

#### `getMocaId(walletAddress)`
Get or create Moca ID for a user.

```javascript
const mocaId = await mocaStackService.getMocaId('0x...');
```

#### `awardAIR(walletAddress, amount, reason)`
Award AIR to a user.

```javascript
const result = await mocaStackService.awardAIR(
  '0x...',
  100,
  'game_win'
);
```

#### `getAIRBalance(walletAddress)`
Get user's AIR balance.

```javascript
const balance = await mocaStackService.getAIRBalance('0x...');
```

#### `trackGameActivity(walletAddress, gameData)`
Track game activity for Realm Points.

```javascript
const result = await mocaStackService.trackGameActivity(
  '0x...',
  {
    gameType: 'ROULETTE',
    betAmount: 10,
    won: true,
    winAmount: 20
  }
);
```

#### `getRealmData(walletAddress)`
Get user's Realm Points and level.

```javascript
const realmData = await mocaStackService.getRealmData('0x...');
```

## Troubleshooting

### Issue: "AIR API key not configured"

**Solution**: Make sure you've added `NEXT_PUBLIC_MOCA_AIR_API_KEY` to your `.env.local` file.

### Issue: "Failed to connect to Moca Stack"

**Solution**: 
1. Check your internet connection
2. Verify API key is valid
3. Check API endpoint URLs
4. Review console for detailed error messages

### Issue: "Rewards not showing up"

**Solution**:
1. Ensure `NEXT_PUBLIC_ENABLE_MOCA_STACK=true`
2. Check wallet is connected
3. Verify API calls are successful in Network tab
4. Try refreshing user data with `refresh()` function

## Testing

### Test Mode

For development, you can use test mode:

```bash
NEXT_PUBLIC_MOCA_AIR_API_URL=https://api-test.moca.network/air
NEXT_PUBLIC_ENABLE_MOCA_STACK=true
```

### Mock Data

If API is not available, the service will gracefully degrade:
- AIR balance will show 0
- Realm points will show 0
- Features will be disabled but app will continue working

## Security

- **Never expose API keys** in client-side code
- Use environment variables for sensitive data
- Validate all user inputs
- Rate limit API calls
- Monitor for suspicious activity

## Support

For issues or questions:
- Moca Network Discord: [discord.gg/moca](https://discord.gg/moca)
- Developer Docs: [docs.moca.network](https://docs.moca.network)
- Email: developers@moca.network

## Changelog

### v1.0.0 (Current)
- Initial Moca Stack integration
- AIR rewards system
- Moca ID support
- Realm Points tracking
- Level progression system
