# Lightning Swap - Project Structure

## 📁 Complete File Tree

```
UnleashBTC-/
│
├── lightning-swap/                          ⚡ NEW - Lightning Swap Module
│   ├── package.json                         # Dependencies & scripts
│   ├── tsconfig.json                        # TypeScript config
│   ├── .gitignore                           # Git ignore rules
│   ├── README.md                            # Complete documentation
│   ├── INTEGRATION_GUIDE.md                 # Step-by-step integration
│   ├── OVERVIEW.md                          # Technical architecture
│   ├── QUICK_REFERENCE.md                   # Quick reference card
│   ├── STRUCTURE.md                         # This file
│   │
│   └── src/
│       ├── index.ts                         # Main entry point & exports
│       │
│       ├── types/
│       │   └── index.ts                     # TypeScript interfaces:
│       │                                    # - SwapRequest
│       │                                    # - SwapTransaction
│       │                                    # - SwapQuote
│       │                                    # - LightningInvoice
│       │                                    # - SwapConfig
│       │
│       ├── utils/
│       │   └── constants.ts                 # Configuration:
│       │                                    # - Network configs
│       │                                    # - Token addresses
│       │                                    # - Fee structures
│       │                                    # - Error messages
│       │
│       └── services/
│           └── AtomiqSwapService.ts         # Core service:
│                                            # - Initialize Atomiq SDK
│                                            # - Generate invoices
│                                            # - Execute swaps
│                                            # - Monitor status
│                                            # - Calculate reserves
│
├── api/                                      🔄 UPDATED - Backend API
│   └── src/
│       ├── server.ts                        # ✏️ Added Lightning routes
│       │
│       └── routes/
│           ├── health.ts                    # Health check
│           ├── privy.ts                     # Privy auth routes
│           └── lightning.ts                 # ⚡ NEW - Lightning routes:
│                                            # - POST /lightning/quote
│                                            # - POST /lightning/swap
│                                            # - GET /lightning/swap/:id
│                                            # - GET /lightning/swaps
│                                            # - GET /lightning/config
│
├── unleashbtc-rn-app/                       📱 UPDATED - Mobile App
│   └── components/
│       ├── LoginScreen.tsx                  # Existing components
│       ├── StarknetScreen.tsx               # Existing components
│       ├── UserScreen.tsx                   # Existing components
│       └── LightningSwapScreen.tsx          # ⚡ NEW - Lightning UI:
│                                            # - Swap direction selector
│                                            # - Amount input with validation
│                                            # - Quote display
│                                            # - QR code for invoices
│                                            # - Real-time status
│                                            # - Transaction links
│
└── LIGHTNING_INTEGRATION_SUMMARY.md         📄 NEW - Integration summary
```

## 🗂️ File Sizes & Complexity

| File                      | Lines | Purpose          | Complexity |
| ------------------------- | ----- | ---------------- | ---------- |
| `AtomiqSwapService.ts`    | ~450  | Core swap logic  | High       |
| `lightning.ts` (API)      | ~300  | Backend routes   | Medium     |
| `LightningSwapScreen.tsx` | ~750  | UI component     | High       |
| `types/index.ts`          | ~150  | Type definitions | Low        |
| `constants.ts`            | ~100  | Configuration    | Low        |
| `README.md`               | ~400  | Documentation    | N/A        |
| `INTEGRATION_GUIDE.md`    | ~600  | Integration docs | N/A        |
| `OVERVIEW.md`             | ~500  | Architecture     | N/A        |

**Total**: ~3,250 lines of code + documentation

## 📦 Module Dependencies

### lightning-swap/

```json
{
  "dependencies": {
    "@atomiqlabs/sdk": "^1.0.0",
    "@atomiqlabs/chain-starknet": "^1.0.0",
    "starknet": "^8.5.3",
    "get-starknet": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.6",
    "typescript": "^5.7.2"
  }
}
```

### api/

No new dependencies (uses Express, existing deps)

### unleashbtc-rn-app/

No new dependencies (uses React Native, Privy, existing deps)

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. LightningSwapScreen.tsx (UI)                            │
│     User inputs amount, gets quote, confirms                │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ↓ fetch()
┌─────────────────────────────────────────────────────────────┐
│  2. /api/src/routes/lightning.ts (API)                      │
│     Validates request, processes swap                       │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ↓ AtomiqSwapService
┌─────────────────────────────────────────────────────────────┐
│  3. /lightning-swap/src/services/AtomiqSwapService.ts       │
│     Executes swap logic, generates invoice                  │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ↓ Atomiq SDK
┌─────────────────────────────────────────────────────────────┐
│  4. @atomiqlabs/sdk                                         │
│     Bridges Lightning ↔ Starknet                            │
└───────────────────┬─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ↓                       ↓
┌──────────────┐        ┌──────────────┐
│  Lightning   │        │   Starknet   │
│   Network    │        │              │
└──────────────┘        └──────────────┘
```

## 🎯 File Relationships

### Types & Interfaces

```
types/index.ts
    ↓ (used by)
    ├── AtomiqSwapService.ts
    ├── lightning.ts (API routes)
    └── LightningSwapScreen.tsx
```

### Configuration

```
utils/constants.ts
    ↓ (used by)
    ├── AtomiqSwapService.ts
    └── lightning.ts (API routes)
```

### Service Layer

```
AtomiqSwapService.ts
    ↓ (used by)
    └── lightning.ts (API routes)
```

### UI Component

```
LightningSwapScreen.tsx
    ↓ (calls)
    └── /api/src/routes/lightning.ts
```

## 📊 Code Organization

### By Layer

**Presentation Layer** (UI)

- `LightningSwapScreen.tsx` - React Native component

**Application Layer** (API)

- `lightning.ts` - Express routes

**Business Logic Layer** (Services)

- `AtomiqSwapService.ts` - Core swap logic

**Data Layer** (Types & Config)

- `types/index.ts` - Type definitions
- `constants.ts` - Configuration

**External Layer** (SDK)

- `@atomiqlabs/sdk` - Third-party service

### By Concern

**Swap Management**

- Quote generation
- Invoice creation
- Status monitoring
- Transaction execution

**User Interface**

- Input validation
- Quote display
- QR code generation
- Status updates

**API Management**

- Request validation
- Authentication
- Error handling
- Response formatting

**Configuration**

- Network settings
- Fee structures
- Token addresses
- Limits & thresholds

## 🔍 Key Components

### 1. Service Layer (`AtomiqSwapService.ts`)

```typescript
class AtomiqSwapService {
  // Setup & Configuration
  constructor(config);
  initializeSwapper();
  setStarknetSigner(account);

  // Core Operations
  getSwapQuote(request);
  executeLightningToStarknet(request);
  executeStarknetToLightning(request, invoice);
  monitorSwapStatus(swapId);

  // Utilities
  calculateGasReserve(amount);
  validateSwapRequest(request);
  createLightningInvoice(amount);
}
```

### 2. API Routes (`lightning.ts`)

```typescript
// Public endpoints
POST /lightning/quote        // Get quote
GET  /lightning/config       // Get config

// Authenticated endpoints
POST /lightning/swap         // Create swap
GET  /lightning/swap/:id     // Get status
GET  /lightning/swaps        // User history
POST /lightning/verify-payment  // Verify payment
```

### 3. UI Component (`LightningSwapScreen.tsx`)

```typescript
export default function LightningSwapScreen() {
  // State Management
  const [direction, setDirection] = useState(...)
  const [amount, setAmount] = useState(...)
  const [status, setStatus] = useState(...)
  const [quote, setQuote] = useState(...)
  const [invoice, setInvoice] = useState(...)

  // Actions
  const handleGetQuote = async () => {...}
  const handleInitiateSwap = async () => {...}
  const monitorSwap = async (id) => {...}

  // Render different states
  return (
    <ScrollView>
      {status === 'IDLE' && <InputForm />}
      {status === 'QUOTE' && <QuoteDisplay />}
      {status === 'INVOICE_GENERATED' && <InvoiceQR />}
      {status === 'COMPLETED' && <SuccessScreen />}
    </ScrollView>
  )
}
```

## 📝 Documentation Structure

```
Documentation/
├── README.md                    # Complete module docs
│   ├── Features
│   ├── Installation
│   ├── Usage examples
│   ├── API reference
│   └── Configuration
│
├── INTEGRATION_GUIDE.md         # Step-by-step guide
│   ├── Prerequisites
│   ├── Installation steps
│   ├── Configuration
│   ├── Customization
│   └── Production setup
│
├── OVERVIEW.md                  # Architecture docs
│   ├── System architecture
│   ├── Component details
│   ├── Data flow
│   └── Security
│
├── QUICK_REFERENCE.md           # Quick reference
│   ├── Common commands
│   ├── API endpoints
│   ├── Configuration
│   └── Troubleshooting
│
└── STRUCTURE.md                 # This file
    ├── File tree
    ├── Dependencies
    ├── Data flow
    └── Relationships
```

## 🎨 UI Components Breakdown

```
LightningSwapScreen
├── Header
│   ├── Title: "⚡ Lightning Swap"
│   └── Subtitle: Description
│
├── Direction Selector
│   ├── Button: "⚡ → Starknet"
│   └── Button: "Starknet → ⚡"
│
├── Input Form (IDLE state)
│   ├── Amount input (sats)
│   ├── Recipient address input
│   └── "Get Quote" button
│
├── Quote Display (QUOTE state)
│   ├── Fee breakdown
│   ├── Gas reserve info
│   ├── Output amount
│   └── "Confirm" / "Cancel" buttons
│
├── Invoice Display (INVOICE_GENERATED state)
│   ├── QR Code
│   ├── Payment request text
│   ├── "Copy" button
│   └── Loading indicator
│
├── Processing (PROCESSING state)
│   ├── Loading spinner
│   └── Status message
│
└── Result (COMPLETED/FAILED state)
    ├── Status icon (✅/❌)
    ├── Transaction hash link
    └── "New Swap" button
```

## 🔧 Configuration Files

### TypeScript Config (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist"
  }
}
```

### Package Config (`package.json`)

```json
{
  "name": "@unleashbtc/lightning-swap",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  }
}
```

## 🚀 Build Output

After running `npm run build`:

```
lightning-swap/
├── dist/                        # Compiled JavaScript
│   ├── index.js
│   ├── index.d.ts              # Type definitions
│   ├── services/
│   │   ├── AtomiqSwapService.js
│   │   └── AtomiqSwapService.d.ts
│   ├── types/
│   │   ├── index.js
│   │   └── index.d.ts
│   └── utils/
│       ├── constants.js
│       └── constants.d.ts
│
└── src/                         # Source TypeScript
    └── (original files)
```

## 📊 Metrics

**Total Files Created**: 12

- 7 source files (.ts, .tsx)
- 5 documentation files (.md)

**Total Lines of Code**: ~3,250

- TypeScript: ~1,800
- Documentation: ~1,450

**Test Coverage**: Ready for implementation

- Unit tests: TODO
- Integration tests: TODO
- E2E tests: TODO

---

This structure provides a complete, modular, and well-documented Lightning Network integration that's ready to use! 🚀
