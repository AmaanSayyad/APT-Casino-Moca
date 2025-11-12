# Moca AIR Integration Guide

## Overview

This integration uses the official **@mocanetwork/airkit** SDK for AIR (Autonomous Incentive Rewards) credential management.

Based on: [Moca Network AIR Credential Example](https://github.com/MocaNetwork/air-credential-example)

## Features

- ✅ **Credential Issuance**: Issue digital credentials to players
- ✅ **Credential Verification**: Verify player credentials
- ✅ **Activity Tracking**: Track gaming activity for rewards
- ✅ **Reward Calculation**: Automatic AIR and Realm Points calculation
- ✅ **Event System**: Real-time credential events

## Installation

The required packages are already installed:

```bash
npm install @mocanetwork/airkit jose
```

## Configuration

### 1. Get Your Credentials

Visit [Moca Network Developer Portal](https://developers.moca.network) to obtain:

- **Partner ID**: Your unique partner identifier
- **Issuer DID**: Decentralized identifier for credential issuance
- **Credential ID**: Type of credential to issue
- **Private Key**: For JWT generation (backend only!)
- **KID**: Key ID for JWT signing

### 2. Environment Variables

Add to your `.env.local`:

```bash
# Moca AIR Integration
NEXT_PUBLIC_MOCA_PARTNER_ID=your_partner_id_here
NEXT_PUBLIC_MOCA_ENV=SANDBOX  # or STAGING
NEXT_PUBLIC_MOCA_ISSUER_DID=did:example:issuer123
NEXT_PUBLIC_MOCA_CREDENTIAL_ID=your_credential_id_here
NEXT_PUBLIC_ENABLE_MOCA_AIR=true

# Backend only (NEVER expose in client!)
MOCA_PRIVATE_KEY=your_private_key_here
MOCA_KID=your_kid_here
MOCA_JWT_ALGORITHM=ES256
```

### 3. Environment Options

- **SANDBOX**: Testing environment
  - Widget: `https://credential-widget.sandbox.air3.com`
  - API: `https://credential.api.sandbox.air3.com`

- **STAGING**: Staging environment
  - Widget: `https://credential-widget.test.air3.com`
  - API: `https://credential.api.test.air3.com`

## Usage

### In React Components

```javascript
import { useMocaAIR } from '@/hooks/useMocaAIR';

function GameComponent() {
  const { 
    isInitialized,
    rewards,
    trackGameActivity,
    issueGamingCredential 
  } = useMocaAIR();

  // Track game activity
  const handleGameEnd = async (gameData) => {
    const result = await trackGameActivity({
      gameType: 'ROULETTE',
      betAmount: 10,
      won: true,
      winAmount: 20
    });

    if (result.success) {
      console.log('AIR Reward:', result.rewards.airReward);
      console.log('Realm Points:', result.rewards.realmPoints);
    }
  };

  // Issue gaming credential
  const handleIssueCredential = async () => {
    const result = await issueGamingCredential({
      gameType: 'ROULETTE',
      totalGames: 100,
      totalWins: 45,
      betAmount: 1000,
      winAmount: 1200
    });

    if (result.success) {
      console.log('Credential prepared:', result.credentialSubject);
    }
  };

  return (
    <div>
      {isInitialized && (
        <div>
          <p>AIR Rewards: {rewards.airReward}</p>
          <p>Realm Points: {rewards.realmPoints}</p>
        </div>
      )}
    </div>
  );
}
```

### Automatic Game Tracking

The integration is already added to the game result logging API:

```javascript
// src/app/api/log-game-result/route.js
// Automatically tracks activity when games are logged
```

### Listen to Credential Events

```javascript
useEffect(() => {
  const handleCredentialIssued = (event) => {
    console.log('Credential issued:', event.detail);
    // Show success message, update UI, etc.
  };

  window.addEventListener('moca-credential-issued', handleCredentialIssued);

  return () => {
    window.removeEventListener('moca-credential-issued', handleCredentialIssued);
  };
}, []);
```

## Reward System

### AIR Rewards Calculation

```javascript
// Base reward: 10 AIR per MOCA bet
airReward = betAmount * 10

// Win bonus: 20% of win amount
if (won) {
  airReward += winAmount * 0.2
}

// Game type multipliers
multipliers = {
  ROULETTE: 1.0,
  PLINKO: 1.2,
  MINES: 1.5,
  WHEEL: 1.1
}

airReward = airReward * multiplier
```

### Realm Points Calculation

```javascript
// Base points: 1 per game
realmPoints = 1

// Win bonus: 5 points
if (won) {
  realmPoints += 5
}

// Apply game type multiplier
realmPoints = realmPoints * multiplier
```

## API Reference

### MocaAIRService

#### `initialize()`
Initialize the AIR service with SDK.

```javascript
await mocaAIRService.initialize();
```

#### `issueCredential(params)`
Issue a credential to a user.

```javascript
const result = await mocaAIRService.issueCredential({
  authToken: 'jwt_token',
  credentialId: 'credential_id',
  credentialSubject: {
    walletAddress: '0x...',
    gameType: 'ROULETTE',
    totalGames: 100
  },
  issuerDid: 'did:example:issuer123'
});
```

#### `verifyCredential(params)`
Verify a user's credential.

```javascript
const result = await mocaAIRService.verifyCredential({
  authToken: 'jwt_token',
  programId: 'program_id',
  redirectUrlForIssuer: 'https://yourapp.com/issue'
});
```

#### `trackActivity(walletAddress, activityData)`
Track user activity and calculate rewards.

```javascript
const result = await mocaAIRService.trackActivity('0x...', {
  gameType: 'ROULETTE',
  betAmount: 10,
  won: true,
  winAmount: 20
});
```

#### `issueGamingCredential(walletAddress, gameData)`
Prepare gaming credential data.

```javascript
const result = await mocaAIRService.issueGamingCredential('0x...', {
  gameType: 'ROULETTE',
  totalGames: 100,
  totalWins: 45
});
```

## Credential Verification Statuses

- ✅ **Compliant**: Valid and meets requirements
- ❌ **NonCompliant**: Does not meet requirements
- ⏳ **Pending**: Waiting for blockchain confirmation
- 🔄 **Revoking**: Currently being revoked
- 🚫 **Revoked**: Revoked and no longer valid
- ⏰ **Expired**: Expired and no longer valid
- 🔍 **NotFound**: No credential found

## Security Best Practices

### ⚠️ CRITICAL: JWT Generation

**NEVER generate JWTs on the client side in production!**

```javascript
// ❌ BAD - Don't do this in production
const jwt = generateJwt({ privateKey, partnerId });

// ✅ GOOD - Generate on backend
const response = await fetch('/api/generate-air-jwt', {
  method: 'POST',
  body: JSON.stringify({ partnerId })
});
const { jwt } = await response.json();
```

### Backend JWT Generation

Create an API route for JWT generation:

```javascript
// src/app/api/generate-air-jwt/route.js
import { SignJWT } from 'jose';

export async function POST(request) {
  const { partnerId } = await request.json();
  
  // Load private key from secure storage
  const privateKey = process.env.MOCA_PRIVATE_KEY;
  
  // Generate JWT
  const jwt = await new SignJWT({ partnerId })
    .setProtectedHeader({ alg: 'ES256', kid: process.env.MOCA_KID })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey);
  
  return Response.json({ jwt });
}
```

## Troubleshooting

### Issue: "Partner ID not configured"

**Solution**: Add `NEXT_PUBLIC_MOCA_PARTNER_ID` to `.env.local`

### Issue: "AIR Service not initialized"

**Solution**: 
1. Check `NEXT_PUBLIC_ENABLE_MOCA_AIR=true`
2. Verify Partner ID is valid
3. Check console for initialization errors

### Issue: "Failed to issue credential"

**Solution**:
1. Verify JWT token is valid
2. Check credential ID exists
3. Ensure issuer DID is correct
4. Review API endpoint configuration

### Issue: Widget not loading

**Solution**:
1. Check environment configuration
2. Verify widget URL is accessible
3. Check browser console for errors
4. Ensure CORS is properly configured

## Testing

### Test in Sandbox Environment

```bash
NEXT_PUBLIC_MOCA_ENV=SANDBOX
NEXT_PUBLIC_ENABLE_MOCA_AIR=true
```

### Mock Data for Development

The service gracefully handles missing configuration:
- Returns calculated rewards even without API
- Logs activity locally
- Provides feedback without failing

## Migration from Old Service

If you were using the old `MocaStackService.js`:

1. Update imports:
```javascript
// Old
import mocaStackService from '@/services/MocaStackService';

// New
import mocaAIRService from '@/services/MocaAIRService';
```

2. Update hook usage:
```javascript
// Old
import { useMocaStack } from '@/hooks/useMocaStack';

// New
import { useMocaAIR } from '@/hooks/useMocaAIR';
```

3. Update environment variables (see Configuration section)

## Resources

- [Moca Network Documentation](https://docs.moca.network/)
- [AIR Credential Example](https://github.com/MocaNetwork/air-credential-example)
- [AirKit SDK Documentation](https://www.npmjs.com/package/@mocanetwork/airkit)
- [Moca Developer Portal](https://developers.moca.network)

## Support

- Discord: [discord.gg/moca](https://discord.gg/moca)
- Email: developers@moca.network
- GitHub Issues: [Report an issue](https://github.com/MocaNetwork/air-credential-example/issues)

## License

MIT License - See LICENSE file for details
