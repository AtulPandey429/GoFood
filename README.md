# GoFood — Food Delivery Platform

MERN stack food delivery application with user authentication, restaurant listings, cart management, and order placement.

**Live:** [https://production-gofood.onrender.com/](https://production-gofood.onrender.com/)  
**Stack:** React, Node.js, Express, MongoDB, JWT

## Features

- User registration and login with JWT authentication
- Browse restaurants and food items
- Shopping cart with add/remove functionality
- Order placement and management
- RESTful API with Express and MongoDB (Mongoose)
- Responsive React frontend

## Project Structure

```
GoFood/
├── app.js              # Express server entry point
├── controllers/        # Route handlers
├── model/              # Mongoose schemas
├── routers/            # API routes
├── middleware/         # Auth and validation middleware
├── Config/             # Database configuration
└── client/             # React frontend
```

## Setup

```bash
git clone https://github.com/AtulPandey429/GoFood.git
cd GoFood
npm install
npm install --prefix ./client

# Create .env in root with:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret

npm run dev    # Runs backend + frontend concurrently
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Express server |
| `npm run client` | Start React dev server |
| `npm run dev` | Run both concurrently |

## Deployment

Deployed on **Render** at [production-gofood.onrender.com](https://production-gofood.onrender.com/).

## Author

**Atul Pandey** — [GitHub](https://github.com/AtulPandey429) | [LinkedIn](https://www.linkedin.com/in/atul-pandey429)
