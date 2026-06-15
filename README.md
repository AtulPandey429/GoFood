# GoFood — Food Delivery Platform with Web3 & Admin Dashboard

MERN stack food delivery application with JWT + wallet authentication, live crypto pricing, crypto checkout, Telegram/Discord notifications, and an admin dashboard.

**Stack:** React, Node.js, Express, MongoDB, JWT, XRP (Gem Wallet), XLM (Freighter)

## Features

- Email/password and Web3 wallet login (Gem, Freighter, Sandbox mode)
- Live XRP/XLM price ticker and dual INR/crypto pricing
- Cash on Delivery and crypto wallet checkout
- Telegram & Discord order notifications
- Admin dashboard with stats, revenue chart, order management, food CRUD
- Factory-based architecture for wallets, payments, notifications, and price feeds
- In-memory fallback when MongoDB is unavailable

## Project Structure

```
personal/
├── app.js                 # Express entry point
├── Config/                # env.js, db.js
├── constants/             # order status, payment methods, wallet types
├── factories/             # database, wallet, payment, notification, priceFeed
├── services/              # auth, order, admin, notification, price
├── repositories/          # User, Order, Food data access
├── controllers/           # Thin route handlers
├── routers/               # auth, orders, admin, display, user
├── middleware/            # auth, admin, validation, errorHandler
├── seeds/                 # Default food menu data
└── client/                # React frontend
```

## Setup

```bash
npm install
npm install --prefix ./client
cp .env.example .env
# Edit .env — set ACCESS_TOKEN_SECRET at minimum

npm run dev    # Starts backend (port 3000) + React dev server (port 3000 proxy)
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `URL` | No (dev) | MongoDB connection string |
| `ACCESS_TOKEN_SECRET` | Yes (prod) | JWT signing secret |
| `PORT` | No | Server port (default 3000) |
| `SANDBOX_MODE` | No | `true` enables wallet sandbox (default in dev) |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot for notifications |
| `ADMIN_EMAIL` | No | Auto-promote this email to admin on startup |
| `MERCHANT_XRP_ADDRESS` | No | XRP receive address for crypto checkout |
| `MERCHANT_XLM_ADDRESS` | No | XLM receive address for crypto checkout |

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | Register |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/wallet-challenge` | No | Get signing nonce |
| POST | `/api/auth/wallet-login` | No | Wallet auth |
| GET | `/api/auth/me` | JWT | Current user |
| POST | `/api/orders` | JWT | Place order |
| POST | `/api/orders/history` | JWT | Order history |
| GET | `/api/crypto/prices` | No | Live XRP/XLM prices |
| PUT | `/api/user/notifications` | JWT | Update notification prefs |
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| GET | `/api/health` | No | Health check |

Legacy `/api/user/*` routes remain as aliases.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Express server |
| `npm run server` | Start with nodemon |
| `npm run client` | Start React dev server |
| `npm run dev` | Run both concurrently |

## Sandbox Mode

Enable **Developer Sandbox Mode** on the login page or use the Sandbox wallet option in the navbar to test wallet auth and crypto payments without browser extensions.

## Author

**Atul Pandey**
