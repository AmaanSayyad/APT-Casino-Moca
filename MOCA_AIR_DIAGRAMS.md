# Moca AIR - Architecture Diagrams

## 🏗️ System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend - React App"
        UI[Game UI Components]
        Hook[useAIRRewards Hook]
        Notif[AIR Rewards Notification]
    end
    
    subgraph "Services Layer"
        AIRService[MocaAIRService]
        SDK[@mocanetwork/airkit SDK]
    end
    
    subgraph "Backend API"
        GameAPI[/api/log-game-result]
        HistoryAPI[/api/game-history]
    end
    
    subgraph "Moca AIR Platform"
        Widget[AIR Widget]
        CredAPI[Credential API]
        IssuerAPI[Issuer API]
        VerifierAPI[Verifier API]
    end
    
    subgraph "Blockchain"
        MocaChain[Moca Chain Testnet]
        Logger[MocaGameLogger Contract]
    end
    
    UI --> Hook
    Hook --> AIRService
    AIRService --> SDK
    SDK --> Widget
    SDK --> CredAPI
    
    UI --> GameAPI
    GameAPI --> AIRService
    GameAPI --> Logger
    Logger --> MocaChain
    
    Widget --> IssuerAPI
    Widget --> VerifierAPI
    
    GameAPI --> Notif
    Notif --> UI
    
    style UI fill:#e1f5ff
    style AIRService fill:#fff3e0
    style SDK fill:#f3e5f5
    style MocaChain fill:#e8f5e9
    style Widget fill:#fce4ec
```

## 🎮 Game Flow with AIR Rewards

```mermaid
sequenceDiagram
    participant Player
    participant Game as Game Component
    participant API as /api/log-game-result
    participant AIR as MocaAIRService
    participant Logger as MocaGameLogger
    participant Notif as AIR Notification
    
    Player->>Game: Play Game
    Game->>Game: Generate Result
    
    rect rgb(200, 255, 200)
        Note over Game,API: Game Result Logging
        Game->>API: POST game result
        API->>Logger: Log to blockchain
        Logger-->>API: Transaction Hash
        
        API->>AIR: trackActivity()
        AIR->>AIR: Calculate Rewards
        Note over AIR: AIR = betAmount * 10<br/>+ win bonus (20%)<br/>* game multiplier
        AIR-->>API: Rewards Data
        
        API-->>Game: Success + Rewards
    end
    
    rect rgb(255, 200, 200)
        Note over Game,Notif: Rewards Display
        Game->>Game: extractRewards()
        Game->>Notif: showRewards()
        Notif->>Player: Display Notification
        Note over Player,Notif: Shows AIR + Realm Points
    end
    
    Player->>Notif: View Rewards
    Notif->>Notif: Auto-close (5s)
```

## 🎁 Reward Calculation Flow

```mermaid
flowchart TD
    Start([Game Ends]) --> Input[/Game Data Input/]
    Input --> BaseCalc[Calculate Base AIR<br/>betAmount × 10]
    
    BaseCalc --> WinCheck{Player Won?}
    WinCheck -->|Yes| WinBonus[Add Win Bonus<br/>winAmount × 0.2]
    WinCheck -->|No| GameType
    WinBonus --> GameType
    
    GameType{Game Type?}
    GameType -->|ROULETTE| Mult1[Multiplier: 1.0x]
    GameType -->|PLINKO| Mult2[Multiplier: 1.2x]
    GameType -->|MINES| Mult3[Multiplier: 1.5x]
    GameType -->|WHEEL| Mult4[Multiplier: 1.1x]
    
    Mult1 --> ApplyMult[Apply Multiplier]
    Mult2 --> ApplyMult
    Mult3 --> ApplyMult
    Mult4 --> ApplyMult
    
    ApplyMult --> FinalAIR[Final AIR Reward]
    
    Input --> RealmBase[Base Realm Points: 1]
    RealmBase --> RealmWin{Player Won?}
    RealmWin -->|Yes| RealmBonus[Add 5 Points]
    RealmWin -->|No| RealmMult
    RealmBonus --> RealmMult[Apply Game Multiplier]
    RealmMult --> FinalRealm[Final Realm Points]
    
    FinalAIR --> Output[/Rewards Output/]
    FinalRealm --> Output
    Output --> End([Display to Player])
    
    style Start fill:#e1f5ff
    style End fill:#c8e6c9
    style Output fill:#fff9c4
    style FinalAIR fill:#ffccbc
    style FinalRealm fill:#d1c4e9
```

## 🔐 Credential Issuance Flow

```mermaid
sequenceDiagram
    participant Player
    participant Frontend
    participant Backend
    participant AIRService
    participant Widget as AIR Widget
    participant API as Credential API
    participant Blockchain
    
    Player->>Frontend: Request Credential
    Frontend->>Backend: Generate JWT
    
    rect rgb(255, 240, 200)
        Note over Backend: JWT Generation<br/>(Private Key Required)
        Backend->>Backend: Sign with Private Key
        Backend-->>Frontend: JWT Token
    end
    
    Frontend->>AIRService: issueCredential()
    AIRService->>Widget: Open Widget
    Widget->>Player: Show Credential Form
    
    Player->>Widget: Confirm Details
    Widget->>API: Issue Credential Request
    
    rect rgb(200, 240, 255)
        Note over API,Blockchain: On-Chain Recording
        API->>Blockchain: Record Credential
        Blockchain-->>API: Transaction Hash
    end
    
    API-->>Widget: Credential Issued
    Widget-->>AIRService: Success Event
    AIRService-->>Frontend: credential-issued
    Frontend->>Player: Show Success
    
    Note over Player,Frontend: Credential stored<br/>in player's wallet
```

## 🔍 Credential Verification Flow

```mermaid
flowchart LR
    Start([Player Action]) --> Check{Has Credential?}
    
    Check -->|No| Redirect[Redirect to Issuer]
    Redirect --> Issue[Issue Credential]
    Issue --> Verify
    
    Check -->|Yes| Verify[Verify Credential]
    
    Verify --> VerifyAPI[Credential API]
    VerifyAPI --> Status{Status?}
    
    Status -->|Compliant| Success[✅ Access Granted]
    Status -->|NonCompliant| Fail[❌ Access Denied]
    Status -->|Pending| Wait[⏳ Wait for Confirmation]
    Status -->|Expired| Renew[⏰ Renew Required]
    Status -->|Revoked| Block[🚫 Blocked]
    
    Success --> End([Continue])
    Fail --> End
    Wait --> Retry[Retry Verification]
    Retry --> VerifyAPI
    Renew --> Issue
    Block --> End
    
    style Success fill:#c8e6c9
    style Fail fill:#ffcdd2
    style Wait fill:#fff9c4
    style Renew fill:#ffe0b2
    style Block fill:#f8bbd0
```

## 📊 Data Flow Architecture

```mermaid
graph LR
    subgraph "Client Side"
        Game[Game Component]
        Hook[useAIRRewards]
        Service[MocaAIRService]
    end
    
    subgraph "API Layer"
        LogAPI[/api/log-game-result]
        HistAPI[/api/game-history]
    end
    
    subgraph "Blockchain Layer"
        Logger[MocaGameLogger]
        Chain[Moca Chain]
    end
    
    subgraph "AIR Platform"
        Widget[AIR Widget]
        CredAPI[Credential API]
    end
    
    subgraph "Storage"
        LocalStorage[(Local Storage)]
        Blockchain[(Blockchain)]
    end
    
    Game -->|Game Result| LogAPI
    LogAPI -->|Track Activity| Service
    Service -->|Calculate| Hook
    Hook -->|Display| Game
    
    LogAPI -->|Log Game| Logger
    Logger -->|Write| Chain
    Chain -->|Store| Blockchain
    
    Service -->|Credentials| Widget
    Widget -->|Issue/Verify| CredAPI
    CredAPI -->|Record| Blockchain
    
    Hook -->|Cache| LocalStorage
    
    style Game fill:#e1f5ff
    style Service fill:#fff3e0
    style Logger fill:#e8f5e9
    style Widget fill:#fce4ec
    style Blockchain fill:#f3e5f5
```

## 🎯 Component Interaction

```mermaid
graph TB
    subgraph "Game Components"
        Roulette[Roulette]
        Plinko[Plinko]
        Mines[Mines]
        Wheel[Wheel]
    end
    
    subgraph "Shared Hooks"
        AIRHook[useAIRRewards]
        HistoryHook[useGameHistory]
    end
    
    subgraph "Services"
        AIRService[MocaAIRService]
        LoggerService[MocaGameLoggerService]
    end
    
    subgraph "UI Components"
        Notification[AIRRewardsNotification]
        Widget[MocaAIRTest]
    end
    
    subgraph "External"
        SDK[@mocanetwork/airkit]
        API[Moca AIR API]
    end
    
    Roulette --> AIRHook
    Plinko --> AIRHook
    Mines --> AIRHook
    Wheel --> AIRHook
    
    Roulette --> HistoryHook
    Plinko --> HistoryHook
    Mines --> HistoryHook
    Wheel --> HistoryHook
    
    AIRHook --> AIRService
    HistoryHook --> LoggerService
    
    AIRService --> SDK
    SDK --> API
    
    AIRHook --> Notification
    AIRService --> Widget
    
    style Roulette fill:#ffebee
    style Plinko fill:#e3f2fd
    style Mines fill:#f3e5f5
    style Wheel fill:#e8f5e9
    style AIRHook fill:#fff3e0
    style AIRService fill:#fce4ec
```

## 🔄 State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Uninitialized
    
    Uninitialized --> Initializing: initialize()
    Initializing --> Initialized: Success
    Initializing --> Error: Failed
    
    Initialized --> Tracking: trackActivity()
    Tracking --> CalculatingRewards: Process Data
    CalculatingRewards --> RewardsReady: Calculation Complete
    
    RewardsReady --> DisplayingNotification: showRewards()
    DisplayingNotification --> NotificationVisible: Render
    
    NotificationVisible --> AutoClosing: Timer (5s)
    NotificationVisible --> ManualClose: User Clicks X
    
    AutoClosing --> NotificationHidden: Timeout
    ManualClose --> NotificationHidden: Close
    
    NotificationHidden --> Initialized: Ready for Next
    
    Error --> Initialized: Retry
    
    note right of CalculatingRewards
        AIR = betAmount * 10
        + winBonus (20%)
        * gameMultiplier
        
        Realm = 1 + winBonus (5)
        * gameMultiplier
    end note
    
    note right of DisplayingNotification
        Shows:
        - AIR Reward
        - Realm Points
        - Multiplier
    end note
```

## 🌐 Environment Configuration

```mermaid
graph TB
    subgraph "Environment Variables"
        PartnerID[NEXT_PUBLIC_MOCA_PARTNER_ID]
        IssuerDID[NEXT_PUBLIC_MOCA_ISSUER_DID]
        VerifierDID[NEXT_PUBLIC_MOCA_VERIFIER_DID]
        Env[NEXT_PUBLIC_MOCA_ENV]
        Enable[NEXT_PUBLIC_ENABLE_MOCA_AIR]
    end
    
    subgraph "Configuration"
        Env --> EnvCheck{Environment?}
        EnvCheck -->|SANDBOX| SandboxConfig[Sandbox URLs]
        EnvCheck -->|STAGING| StagingConfig[Staging URLs]
    end
    
    subgraph "Sandbox Environment"
        SandboxConfig --> SandboxWidget[credential-widget.sandbox.air3.com]
        SandboxConfig --> SandboxAPI[credential.api.sandbox.air3.com]
    end
    
    subgraph "Staging Environment"
        StagingConfig --> StagingWidget[credential-widget.test.air3.com]
        StagingConfig --> StagingAPI[credential.api.test.air3.com]
    end
    
    subgraph "Service Initialization"
        PartnerID --> Init[AIRService.initialize]
        IssuerDID --> Init
        VerifierDID --> Init
        Enable --> Init
        SandboxWidget --> Init
        SandboxAPI --> Init
        StagingWidget --> Init
        StagingAPI --> Init
    end
    
    Init --> Ready[Service Ready]
    
    style PartnerID fill:#e1f5ff
    style Enable fill:#c8e6c9
    style Ready fill:#fff9c4
    style SandboxConfig fill:#ffebee
    style StagingConfig fill:#e3f2fd
```

## 📱 User Journey

```mermaid
journey
    title Player's AIR Rewards Journey
    section Game Play
      Connect Wallet: 5: Player
      Select Game: 5: Player
      Place Bet: 5: Player
      Play Game: 5: Player, System
      Get Result: 5: System
    section Rewards
      Calculate AIR: 5: System
      Calculate Realm Points: 5: System
      Log to Blockchain: 5: System
      Show Notification: 5: System
      View Rewards: 5: Player
    section Credentials
      Check Credential: 3: System
      Issue if Needed: 4: Player, System
      Verify Credential: 5: System
      Grant Access: 5: System
    section Progression
      Accumulate Points: 5: Player
      Level Up: 5: Player, System
      Unlock Benefits: 5: Player
      Earn More Rewards: 5: Player
```

## 🔧 Error Handling Flow

```mermaid
flowchart TD
    Start([API Call]) --> Try{Try Operation}
    
    Try -->|Success| Success[Return Success]
    Try -->|Error| ErrorType{Error Type?}
    
    ErrorType -->|Network| NetworkError[Network Error]
    ErrorType -->|Auth| AuthError[Authentication Error]
    ErrorType -->|Validation| ValidationError[Validation Error]
    ErrorType -->|Unknown| UnknownError[Unknown Error]
    
    NetworkError --> Retry{Retry?}
    Retry -->|Yes| Wait[Wait & Retry]
    Wait --> Try
    Retry -->|No| LogError
    
    AuthError --> RefreshToken{Refresh Token?}
    RefreshToken -->|Yes| GetNewToken[Get New Token]
    GetNewToken --> Try
    RefreshToken -->|No| LogError
    
    ValidationError --> LogError[Log Error]
    UnknownError --> LogError
    
    LogError --> Fallback[Use Fallback]
    Fallback --> GracefulDegradation[Graceful Degradation]
    
    Success --> End([Continue])
    GracefulDegradation --> End
    
    style Success fill:#c8e6c9
    style LogError fill:#ffcdd2
    style GracefulDegradation fill:#fff9c4
    
    note right of GracefulDegradation
        - Show cached data
        - Disable AIR features
        - Continue game play
        - Notify user
    end note
```

## 📈 Reward Progression System

```mermaid
graph LR
    subgraph "Level 1"
        L1[0-100 Points]
        L1Bonus[+0% AIR Bonus]
    end
    
    subgraph "Level 2"
        L2[100-300 Points]
        L2Bonus[+5% AIR Bonus]
    end
    
    subgraph "Level 3"
        L3[300-600 Points]
        L3Bonus[+10% AIR Bonus]
    end
    
    subgraph "Level 4"
        L4[600-1000 Points]
        L4Bonus[+15% AIR Bonus]
    end
    
    subgraph "Level 5"
        L5[1000+ Points]
        L5Bonus[+20% AIR Bonus]
    end
    
    L1 -->|Earn Points| L2
    L2 -->|Earn Points| L3
    L3 -->|Earn Points| L4
    L4 -->|Earn Points| L5
    
    L1 --> L1Bonus
    L2 --> L2Bonus
    L3 --> L3Bonus
    L4 --> L4Bonus
    L5 --> L5Bonus
    
    style L1 fill:#e3f2fd
    style L2 fill:#c5e1a5
    style L3 fill:#fff59d
    style L4 fill:#ffcc80
    style L5 fill:#ef9a9a
```

## 🎮 Game Type Multipliers

```mermaid
pie title Game Type Reward Multipliers
    "ROULETTE (1.0x)" : 10
    "WHEEL (1.1x)" : 11
    "PLINKO (1.2x)" : 12
    "MINES (1.5x)" : 15
```

## 📊 Reward Distribution

```mermaid
graph TD
    TotalReward[Total Reward] --> AIR[AIR Tokens]
    TotalReward --> Realm[Realm Points]
    
    AIR --> BaseAIR[Base: betAmount × 10]
    AIR --> WinBonusAIR[Win Bonus: 20%]
    AIR --> MultiplierAIR[Game Multiplier]
    
    Realm --> BaseRealm[Base: 1 point]
    Realm --> WinBonusRealm[Win Bonus: 5 points]
    Realm --> MultiplierRealm[Game Multiplier]
    
    BaseAIR --> FinalAIR[Final AIR]
    WinBonusAIR --> FinalAIR
    MultiplierAIR --> FinalAIR
    
    BaseRealm --> FinalRealm[Final Realm Points]
    WinBonusRealm --> FinalRealm
    MultiplierRealm --> FinalRealm
    
    FinalAIR --> Display[Display to Player]
    FinalRealm --> Display
    
    style TotalReward fill:#e1f5ff
    style FinalAIR fill:#ffccbc
    style FinalRealm fill:#d1c4e9
    style Display fill:#c8e6c9
```

---

## 📝 Diagram Legend

- **Blue boxes**: Frontend components
- **Orange boxes**: Services and APIs
- **Purple boxes**: SDK and external services
- **Green boxes**: Blockchain and storage
- **Pink boxes**: AIR Platform components
- **Yellow boxes**: Data and outputs

## 🔗 Related Documentation

- [MOCA_AIR_INTEGRATION.md](./MOCA_AIR_INTEGRATION.md) - Integration guide
- [GAME_AIR_INTEGRATION_EXAMPLE.md](./GAME_AIR_INTEGRATION_EXAMPLE.md) - Game integration examples
- [Moca Network Documentation](https://docs.moca.network/)
- [AIR Credential Example](https://github.com/MocaNetwork/air-credential-example)
