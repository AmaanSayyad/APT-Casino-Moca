# Game AIR Integration Example

## How to Add AIR Rewards to Your Game

### Step 1: Import Required Components

```javascript
import { useAIRRewards } from '@/hooks/useAIRRewards';
import AIRRewardsNotification from '@/components/MocaAIR/AIRRewardsNotification';
```

### Step 2: Use the Hook in Your Game Component

```javascript
function YourGameComponent() {
  const {
    currentRewards,
    showNotification,
    showRewards,
    hideRewards,
    extractRewards
  } = useAIRRewards();

  // Your existing game logic...
  
  return (
    <div>
      {/* Your game UI */}
      
      {/* Add AIR Rewards Notification */}
      {showNotification && currentRewards && (
        <AIRRewardsNotification
          rewards={currentRewards}
          onClose={hideRewards}
          autoClose={5000}
        />
      )}
    </div>
  );
}
```

### Step 3: Show Rewards After Game Ends

When you save the game result, extract and show rewards:

```javascript
const handleGameEnd = async (gameData) => {
  try {
    // Save game result (this already includes AIR tracking)
    const response = await fetch('/api/log-game-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player: address,
        gameType: 'ROULETTE',
        betAmount: betAmount,
        won: isWin,
        winAmount: winAmount,
        multiplier: multiplier,
        // ... other game data
      })
    });

    const result = await response.json();

    if (result.success) {
      // Extract and show AIR rewards
      const rewards = extractRewards(result);
      if (rewards) {
        showRewards(rewards);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Complete Example

```javascript
"use client";

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useAIRRewards } from '@/hooks/useAIRRewards';
import AIRRewardsNotification from '@/components/MocaAIR/AIRRewardsNotification';

function RouletteGame() {
  const { address } = useAccount();
  const [betAmount, setBetAmount] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // AIR Rewards
  const {
    currentRewards,
    showNotification,
    showRewards,
    hideRewards,
    extractRewards
  } = useAIRRewards();

  const handleSpin = async () => {
    setIsPlaying(true);
    
    try {
      // 1. Play the game (your game logic)
      const gameResult = await playRoulette(betAmount);
      
      // 2. Save result and get AIR rewards
      const response = await fetch('/api/log-game-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: address,
          gameType: 'ROULETTE',
          betAmount: betAmount,
          won: gameResult.isWin,
          winAmount: gameResult.winAmount,
          multiplier: gameResult.multiplier,
          gameSubType: gameResult.betType,
          entropyTxHash: gameResult.entropyTxHash,
          entropySequenceNumber: gameResult.sequenceNumber,
          randomValue: gameResult.randomValue,
          gameData: JSON.stringify(gameResult.details)
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Game saved:', result.gameId);
        
        // 3. Show AIR rewards notification
        const rewards = extractRewards(result);
        if (rewards) {
          console.log('🎁 Rewards earned:', rewards);
          showRewards(rewards);
        }
      }
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="game-container">
      {/* Game UI */}
      <div className="game-board">
        <button 
          onClick={handleSpin}
          disabled={isPlaying}
          className="spin-button"
        >
          {isPlaying ? 'Spinning...' : 'Spin'}
        </button>
      </div>

      {/* AIR Rewards Notification */}
      {showNotification && currentRewards && (
        <AIRRewardsNotification
          rewards={currentRewards}
          onClose={hideRewards}
          autoClose={5000}
        />
      )}
    </div>
  );
}

export default RouletteGame;
```

## Reward Calculation

The rewards are automatically calculated based on:

### AIR Rewards
```javascript
// Base: 10 AIR per MOCA bet
airReward = betAmount * 10

// Win bonus: 20% of win amount
if (won) {
  airReward += winAmount * 0.2
}

// Game type multiplier
multipliers = {
  ROULETTE: 1.0,
  PLINKO: 1.2,
  MINES: 1.5,
  WHEEL: 1.1
}

airReward = Math.floor(airReward * multiplier)
```

### Realm Points
```javascript
// Base: 1 point per game
realmPoints = 1

// Win bonus: 5 points
if (won) {
  realmPoints += 5
}

// Game type multiplier
realmPoints = Math.floor(realmPoints * multiplier)
```

## Customization

### Change Auto-Close Duration

```javascript
<AIRRewardsNotification
  rewards={currentRewards}
  onClose={hideRewards}
  autoClose={10000} // 10 seconds
/>
```

### Disable Auto-Close

```javascript
<AIRRewardsNotification
  rewards={currentRewards}
  onClose={hideRewards}
  autoClose={false} // Manual close only
/>
```

### Custom Styling

The notification uses Tailwind CSS and can be customized by modifying the component.

## Testing

1. **Enable AIR in environment:**
   ```bash
   NEXT_PUBLIC_ENABLE_MOCA_AIR=true
   ```

2. **Play a game**

3. **Check console for logs:**
   ```
   🎁 Moca AIR rewards calculated: { airReward: 100, realmPoints: 6, multiplier: 1 }
   💰 AIR Reward: 100
   ⭐ Realm Points: 6
   🎯 Multiplier: 1x
   ```

4. **See notification appear** in top-right corner

## Troubleshooting

### Rewards not showing?

1. Check `NEXT_PUBLIC_ENABLE_MOCA_AIR=true` in `.env.local`
2. Verify game result API call is successful
3. Check browser console for errors
4. Ensure `mocaAIRRewards` is in API response

### Notification not appearing?

1. Check `showNotification` state
2. Verify `currentRewards` has values
3. Check z-index conflicts
4. Ensure component is rendered

## Notes

- ✅ Rewards are calculated automatically when games are logged
- ✅ No additional API calls needed
- ✅ Works with all game types
- ✅ Gracefully handles errors (won't break game if AIR fails)
- ✅ Rewards are shown even if credential issuance is not set up yet
