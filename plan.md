# Implementation Plan — Crypto Wallet, Notifications & Admin Dashboard

A phased plan to add Web3 wallet auth, live crypto pricing, Telegram/Discord notifications, and an admin dashboard — refactored around **factory-based, strategy-pattern architecture** for extensibility and testability.

---

## Table of Contents

1. [Goals & Scope](#goals--scope)
2. [Current State & Gaps](#current-state--gaps)
3. [Target Architecture (Factory-Based)](#target-architecture-factory-based)
4. [Proposed Folder Structure](#proposed-folder-structure)
5. [User Review Required](#user-review-required)
6. [Phase 1 — Foundation & Infrastructure](#phase-1--foundation--infrastructure)
7. [Phase 2 — Authentication & Wallets](#phase-2--authentication--wallets)
8. [Phase 3 — Crypto Pricing & Checkout](#phase-3--crypto-pricing--checkout)
9. [Phase 4 — Notifications](#phase-4--notifications)
10. [Phase 5 — Admin Dashboard](#phase-5--admin-dashboard)
11. [Phase 6 — Security, Quality & DevOps](#phase-6--security-quality--devops)
12. [Verification Plan](#verification-plan)
13. [Suggested Future Enhancements](#suggested-future-enhancements)

---

## Goals & Scope

| Area | Deliverable |
|------|-------------|
| Wallets | Gem (XRPL) + Freighter (Stellar) with sandbox fallback |
| Payments | Cash on Delivery + XRP/XLM crypto checkout |
| Pricing | Live XRP/XLM feeds (USD + INR) on menu and cart |
| Notifications | Telegram Bot + Discord Webhook on order events |
| Admin | Stats, order management, food CRUD, user overview |
| Architecture | Factory/strategy patterns — add new wallet or channel without touching core logic |

---

## Current State & Gaps

**What exists today**

- Express + MongoDB food delivery app (GoFood)
- Email/password auth with JWT (no auth middleware on protected routes)
- Orders stored per-user email in a single `order_data` array
- Food items loaded into `global.food_items` / `global.foodCategory` at startup
- Hardcoded OnRender API URLs in the React client
- No admin role, no wallet auth, no notification layer

**Gaps the plan must address (not in original plan)**

| Gap | Risk | Resolution |
|-----|------|------------|
| `Order.email` has `unique: true` | One order document per user — blocks multiple orders correctly but schema is confusing | Refactor to `userId` + separate `orders` collection or sub-documents with `_id` |
| No JWT middleware | Anyone can hit `/orderdata`, `/myOrder` with any email | Add `authMiddleware` + `adminMiddleware` |
| Wallet login has no signature verification spec | Spoofed addresses could authenticate | Challenge–response nonce flow (see Phase 2) |
| No `.env.example` | Hard to onboard reviewers | Document all required env vars |
| No centralized error handler | Inconsistent API responses | `errorHandler` middleware |
| `CreateUser.js` router mixes concerns | Hard to extend | Split into `auth`, `user`, `admin` routers + controllers |
| No price API caching | CoinGecko rate limits | TTL cache in `PriceFeedFactory` |
| Cart route missing in `App.js` | Cart only via modal | Add `/cart` route (optional) |
| Password required on `Contacts` | Wallet-only users cannot register | Make `password` optional when `walletAddress` is set |

---

## Target Architecture (Factory-Based)

Use **factories** to choose implementations at runtime. Routers stay thin; business logic lives in **services**; data access in **repositories**.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Router    │────▶│    Controller    │────▶│      Service        │
└─────────────┘     └──────────────────┘     └──────────┬──────────┘
                                                        │
                        ┌───────────────────────────────┼───────────────────────────────┐
                        ▼                               ▼                               ▼
              ┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
              │ WalletFactory   │           │ Notification    │           │ PaymentFactory  │
              │ gem|freighter|  │           │ Factory         │           │ cash|xrp|xlm    │
              │ sandbox         │           │ telegram|discord|│           │                 │
              └─────────────────┘           │ console           │           └─────────────────┘
                                            └─────────────────┘
                        ┌───────────────────────────────┐
                        ▼                               ▼
              ┌─────────────────┐           ┌─────────────────┐
              │ PriceFeedFactory│           │ DatabaseFactory │
              │ coingecko|paprika│          │ mongo|memory    │
              └─────────────────┘           └─────────────────┘
```

### Backend Factories

| Factory | Path | Responsibility |
|---------|------|----------------|
| `WalletAuthFactory` | `factories/wallet/` | `create(type)` → `GemAuth`, `FreighterAuth`, `SandboxAuth` — connect, sign challenge, verify |
| `PaymentFactory` | `factories/payment/` | `create(method)` → `CashPayment`, `XrpPayment`, `XlmPayment` — validate + record tx metadata |
| `NotificationFactory` | `factories/notification/` | `create(channel)` → `TelegramNotifier`, `DiscordNotifier`, `ConsoleNotifier` (dev fallback) |
| `PriceFeedFactory` | `factories/priceFeed/` | `create(provider)` → `CoinGeckoProvider`, `CoinPaprikaProvider` with automatic fallback |
| `DatabaseFactory` | `factories/database/` | `create()` → `MongoAdapter` or `InMemoryAdapter` when connection fails |

**Shared contracts (interfaces via base classes or JSDoc typedefs)**

```js
// factories/notification/INotifier.js
class INotifier {
  async send(recipient, payload) { throw new Error('Not implemented'); }
  async testConnection(recipient) { throw new Error('Not implemented'); }
}

// factories/wallet/IWalletProvider.js
class IWalletProvider {
  async connect() {}
  async signMessage(message) {}
  async sendPayment({ to, amount, asset }) {}
}
```

### Frontend Factories

| Factory | Path | Responsibility |
|---------|------|----------------|
| `WalletFactory` | `client/src/factories/wallet/` | `create('gem' \| 'freighter' \| 'sandbox')` — unified connect/pay/sign API |
| `ApiClientFactory` | `client/src/factories/api/` | Single axios/fetch wrapper with base URL from `config.js` + auth header injection |
| `PriceFormatterFactory` | `client/src/factories/price/` | Format INR/USD/XRP/XLM display strings consistently |

### Supporting Patterns

- **Constants/Enums** — `constants/orderStatus.js`, `constants/paymentMethods.js` (avoid magic strings)
- **Repository layer** — `repositories/OrderRepository.js`, `UserRepository.js` (abstract Mongoose vs in-memory)
- **DTOs** — `dto/orderDto.js` for normalized API request/response shapes
- **State machine** — `services/orderStatusService.js` — valid transitions: `Placed → Preparing → Dispatched → Delivered`

---

## Proposed Folder Structure

```
personal/
├── Config/
│   ├── db.js                    # delegates to DatabaseFactory
│   └── env.js                   # validated env loader (joi/envalid)
├── constants/
│   ├── orderStatus.js
│   ├── paymentMethods.js
│   └── walletTypes.js
├── factories/
│   ├── database/
│   │   ├── DatabaseFactory.js
│   │   ├── MongoAdapter.js
│   │   └── InMemoryAdapter.js
│   ├── notification/
│   │   ├── NotificationFactory.js
│   │   ├── TelegramNotifier.js
│   │   ├── DiscordNotifier.js
│   │   └── ConsoleNotifier.js
│   ├── payment/
│   │   ├── PaymentFactory.js
│   │   ├── CashPayment.js
│   │   ├── XrpPayment.js
│   │   └── XlmPayment.js
│   ├── priceFeed/
│   │   ├── PriceFeedFactory.js
│   │   ├── CoinGeckoProvider.js
│   │   └── CoinPaprikaProvider.js
│   └── wallet/
│       ├── WalletAuthFactory.js
│       ├── GemAuth.js
│       ├── FreighterAuth.js
│       └── SandboxAuth.js
├── middleware/
│   ├── authMiddleware.js        # JWT verification
│   ├── adminMiddleware.js       # isAdmin guard
│   ├── errorHandler.js
│   └── validation.js            # extend with wallet/order schemas
├── repositories/
│   ├── UserRepository.js
│   ├── OrderRepository.js
│   └── FoodRepository.js
├── services/
│   ├── authService.js
│   ├── orderService.js
│   ├── notificationService.js   # orchestrates NotificationFactory
│   ├── adminService.js
│   └── priceService.js
├── controllers/
│   ├── authController.js
│   ├── orderController.js
│   ├── adminController.js
│   └── userController.js
├── routers/
│   ├── auth.js
│   ├── orders.js
│   ├── admin.js
│   └── display.js
├── seeds/
│   └── foodSeed.js              # default categories + items
├── model/
│   ├── Contacts.js
│   └── Order.js
├── client/src/
│   ├── config.js
│   ├── factories/
│   │   ├── wallet/
│   │   │   ├── WalletFactory.js
│   │   │   ├── GemWallet.js
│   │   │   ├── FreighterWallet.js
│   │   │   └── SandboxWallet.js
│   │   └── api/
│   │       └── ApiClient.js
│   ├── contexts/
│   │   ├── CryptoContext.js
│   │   └── AuthContext.js       # NEW — centralize user + token state
│   ├── components/
│   ├── hooks/
│   │   ├── useWallet.js
│   │   └── useCryptoPrices.js
│   └── screens/
└── app.js
```

---

## User Review Required

> [!IMPORTANT]
> **Wallet Integrations and Fallbacks**
> Direct integrations:
> 1. **Gem Wallet** (XRPL) — `window.gemApi` / `@gemwallet/api`
> 2. **Freighter Wallet** (Stellar) — `window.freighterApi` / `@stellar/freighter-api`
>
> A **Developer Sandbox Mode** toggle on login and checkout simulates connect/sign/pay when extensions are missing. Production code paths remain intact; sandbox is selected via `WalletFactory.create('sandbox')`.

> [!IMPORTANT]
> **Telegram & Discord Notifications**
> 1. **Telegram** — Bot API; users link via Chat ID or bot deep-link
> 2. **Discord** — Webhook URL per user (primary); optional bot DM later
> 3. **Fallback** — `ConsoleNotifier` logs events when tokens/URLs are unset (no crash)

> [!TIP]
> **Database Fallback**
> `DatabaseFactory` tries MongoDB first; on failure or empty collections, `InMemoryAdapter` seeds from `seeds/foodSeed.js` into globals so the app loads immediately.

> [!IMPORTANT]
> **Wallet Auth Security (NEW)**
> Wallet login must use **challenge–response**, not address-only trust:
> 1. `GET /api/auth/wallet-challenge` → server returns `{ nonce, expiresAt }`
> 2. Client signs `nonce` with wallet
> 3. `POST /api/auth/wallet-login` → `{ walletAddress, walletType, signature, nonce }`
> 4. Server verifies signature (XRPL/Stellar libs) before issuing JWT

---

## Phase 1 — Foundation & Infrastructure

### [MODIFY] `Config/db.js`
- Delegate connection to `DatabaseFactory`
- Seed `food_items` / `food_category` when collections are empty
- Do not crash when `process.env.URL` is missing

### [NEW] `Config/env.js`
- Validate required/optional env vars at startup
- Fail fast with clear messages for production; warn for dev

### [NEW] `.env.example`
```
URL=mongodb://localhost:27017/gofood
ACCESS_TOKEN_SECRET=
PORT=5000
TELEGRAM_BOT_TOKEN=
DISCORD_BOT_TOKEN=
NODE_ENV=development
SANDBOX_MODE=true
COINGECKO_API_KEY=          # optional
MERCHANT_XRP_ADDRESS=
MERCHANT_XLM_ADDRESS=
```

### [NEW] `constants/` + `seeds/foodSeed.js`
- Centralize status enums and default menu data

### [NEW] `middleware/authMiddleware.js` & `adminMiddleware.js`
- Protect `/api/orders/*`, `/api/user/notifications`, `/api/admin/*`

### [NEW] `middleware/errorHandler.js`
- Unified `{ success, message, code }` error responses

### [MODIFY] `app.js`
- Register routers: `/api/auth`, `/api/orders`, `/api/admin`, `/api/display`
- Mount `errorHandler` last
- Add `GET /api/health` for smoke tests

### [NEW] `repositories/` layer
- Abstract Mongoose queries; enables in-memory testing

---

## Phase 2 — Authentication & Wallets

### [MODIFY] `model/Contacts.js`
- `isAdmin` (Boolean, default `false`)
- `walletAddress` (String, unique, sparse)
- `walletType` (enum: `gem` | `freighter`)
- `password` — **optional** when wallet auth is used
- `notifications`: `{ telegramChatId, discordWebhookUrl, enableTelegram, enableDiscord }`

### [NEW] `factories/wallet/` (backend verification helpers)
- `GemAuth.verifySignature(address, message, signature)`
- `FreighterAuth.verifySignature(...)`
- `SandboxAuth` — always passes in dev

### [NEW] `services/authService.js`
- `issueWalletChallenge()`, `verifyWalletLogin()`, `loginWithCredentials()`, `registerUser()`

### [NEW] `routers/auth.js` (split from `CreateUser.js`)
| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/signup` | Email registration |
| `POST /api/auth/login` | Email login → JWT + profile (`isAdmin`, notifications) |
| `GET /api/auth/wallet-challenge` | Returns signing nonce |
| `POST /api/auth/wallet-login` | Verify signature, upsert user, return JWT |
| `GET /api/auth/me` | Current user profile (auth required) |

### Frontend

### [NEW] `client/src/contexts/AuthContext.js`
- Token, user profile, `isAdmin`, login/logout helpers

### [NEW] `client/src/factories/wallet/WalletFactory.js`
- `create(type)` → Gem / Freighter / Sandbox implementations

### [MODIFY] `client/src/screens/Login.js`
- Traditional login + **Sign In with Web3 Wallet**
- Sandbox mode toggle (dev only, hidden in production via env)

### [MODIFY] `client/src/components/Navbar.js`
- Connect Wallet dropdown (Gem / Freighter)
- Abbreviated address when connected
- Admin Dashboard link when `user.isAdmin`

### [NEW] `client/src/hooks/useWallet.js`
- Thin hook wrapping `WalletFactory` + `AuthContext`

---

## Phase 3 — Crypto Pricing & Checkout

### [NEW] `factories/priceFeed/`
- CoinGecko primary, CoinPaprika fallback
- 60s TTL cache in `services/priceService.js`
- `GET /api/crypto/prices` → `{ xrp: { usd, inr }, xlm: { usd, inr }, updatedAt }`

### [NEW] `client/src/contexts/CryptoContext.js`
- Poll prices, expose `toXrp(inr)`, `toXlm(inr)`, `formatDualPrice(inr)`

### [MODIFY] `client/src/index.js`
- Wrap with `AuthProvider` + `CryptoProvider`

### [NEW] `client/src/config.js`
- `API_BASE_URL` — `http://localhost:5000` in dev, relative in prod

### [MODIFY] `Card.js` & `Home.js`
- Dual price: `₹150 (~3.12 XRP)`
- Replace all hardcoded OnRender URLs with `ApiClient`

### [MODIFY] `model/Order.js`
- Per-order metadata inside `order_data` entries:
  - `paymentMethod`, `cryptoAsset`, `cryptoAmount`, `txHash`
  - `paymentStatus`, `deliveryStatus`, `orderId`, `createdAt`
- Consider removing `email: unique` — use `userId` reference instead

### [NEW] `factories/payment/`
- `CashPayment.process()` — mark Pending, no tx
- `XrpPayment.process()` / `XlmPayment.process()` — validate tx hash format; optional on-chain verify later

### [MODIFY] `client/src/screens/Cart.js`
- Payment selector: Cash | Crypto (XRP/XLM based on connected wallet)
- Live crypto amount at checkout
- `WalletFactory` → `sendPayment()` or sandbox mock tx hash
- POST to `/api/orders` with payment metadata

### [NEW] `services/orderService.js`
- Create order → trigger `notificationService.sendOrderNotification()`

---

## Phase 4 — Notifications

### [NEW] `factories/notification/`
| Class | Behavior |
|-------|----------|
| `TelegramNotifier` | `POST https://api.telegram.org/bot<token>/sendMessage` |
| `DiscordNotifier` | Webhook embed POST |
| `ConsoleNotifier` | `console.log` structured event — used when env tokens missing |

### [NEW] `services/notificationService.js`
```js
async function notifyUser(user, event, order) {
  const channels = [];
  if (user.notifications.enableTelegram) channels.push(NotificationFactory.create('telegram'));
  if (user.notifications.enableDiscord) channels.push(NotificationFactory.create('discord'));
  if (!channels.length) channels.push(NotificationFactory.create('console'));
  await Promise.allSettled(channels.map(c => c.send(user, { event, order })));
}
```

**Events:** `order_placed`, `payment_confirmed`, `status_preparing`, `status_dispatched`, `status_delivered`

### [NEW] `routers/user.js`
| Endpoint | Description |
|----------|-------------|
| `PUT /api/user/notifications` | Save preferences + chat ID / webhook URL |
| `POST /api/user/notifications/test` | Send test message via selected channel |

### [NEW] `client/src/screens/NotificationSettings.js`
- Toggles, Chat ID / Webhook inputs, **Test Connection** button
- Link to Telegram bot (`t.me/YourBot`)

---

## Phase 5 — Admin Dashboard

### [NEW] `services/adminService.js`
- Aggregate stats, revenue by day, filter orders

### [NEW] `routers/admin.js` (all routes behind `adminMiddleware`)
| Endpoint | Description |
|----------|-------------|
| `GET /api/admin/stats` | Users, orders, revenue (INR/USD/XRP/XLM), chart series |
| `GET /api/admin/orders` | Paginated list with filters |
| `PATCH /api/admin/orders/:id/status` | Update delivery/payment status → notify user |
| `GET/POST/PUT/DELETE /api/admin/food-items` | Menu CRUD |
| `GET /api/admin/users` | User list (email + wallet, no passwords) |

### [NEW] `client/src/screens/AdminDashboard.js` + `.css`
- Dark glassmorphism theme, neon accents
- Stats grid, SVG revenue chart, orders table, status actions
- Food manager modal, active users panel
- **Protected route** — redirect non-admins

### [MODIFY] `client/src/App.js`
- Routes: `/admin`, `/notifications`, `/cart` (optional)
- `ProtectedRoute` + `AdminRoute` wrapper components

---

## Phase 6 — Security, Quality & DevOps

### Security
- [ ] Rate limit `/api/auth/*` and `/api/orders` (express-rate-limit)
- [ ] Sanitize Discord webhook URLs server-side (HTTPS only)
- [ ] Never expose `TELEGRAM_BOT_TOKEN` to frontend
- [ ] CORS whitelist for production origin
- [ ] Audit log collection for admin status changes (who, when, what)

### Validation
- [ ] Joi schemas for wallet login, order payload, notification settings, admin updates
- [ ] `express-validator` or extend existing Joi middleware

### Testing (recommended additions)
- [ ] Unit tests for each factory (`jest`)
- [ ] Integration tests for auth + order flow (`supertest`)
- [ ] Frontend: wallet sandbox E2E smoke test

### DevOps
- [ ] `npm run dev` — fix script (currently runs wrong concurrently command)
- [ ] `GET /api/health` in CI smoke check
- [ ] Optional: Swagger/OpenAPI at `/api/docs`

---

## Verification Plan

### Automated
- [ ] Server boots with and without `URL` env var
- [ ] Factory unit tests: each notifier, each wallet sandbox, price fallback
- [ ] Auth middleware rejects missing/invalid JWT
- [ ] Admin routes return 403 for non-admin users
- [ ] Order creation persists crypto metadata

### Manual
- [ ] **Wallet login** — Gem, Freighter, and Sandbox modes
- [ ] **Dual pricing** — menu and cart show correct XRP/XLM equivalents
- [ ] **Crypto checkout** — tx hash saved; sandbox produces mock hash
- [ ] **Notifications** — Telegram + Discord on order place and admin status change
- [ ] **Admin dashboard** — stats, chart, order status update, food CRUD
- [ ] **Regression** — email signup/login still works

---

## Suggested Future Enhancements

| Feature | Why |
|---------|-----|
| On-chain tx verification | Confirm XRP/XLM payment before marking `Paid` |
| Order tracking page | Customer-facing timeline (Placed → Delivered) |
| Email notifications | Fourth channel via `EmailNotifier` in factory |
| Multi-currency merchant wallet | Admin config for receive addresses per asset |
| Redis price cache | Scale beyond in-process TTL |
| WebSocket live ticker | Push price updates instead of polling |
| Refund / cancel flow | Status `Cancelled` + payment reversal notes |
| Inventory / stock flags | Admin marks items out of stock |
| Promo codes | Discount engine in `PaymentFactory` |
| PWA + push notifications | Mobile-friendly order alerts |
| i18n | Hindi/English toggle for UI |
| Docker Compose | One-command local Mongo + app |
| CI pipeline | GitHub Actions — lint, test, build |

---

## Implementation Order (Quick Reference)

```
Phase 1  →  env, factories scaffold, middleware, folder restructure
Phase 2  →  wallet auth + AuthContext + WalletFactory
Phase 3  →  prices, cart crypto checkout, PaymentFactory
Phase 4  →  NotificationFactory + settings screen
Phase 5  →  admin API + dashboard UI
Phase 6  →  security hardening, tests, docs
```
