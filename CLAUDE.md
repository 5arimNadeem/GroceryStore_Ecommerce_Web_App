# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MERN stack grocery delivery e-commerce app ("GreenCart"). Split into two independent packages: `server/` (Express + MongoDB) and `client/` (React + Vite).

## Commands

### Server
```bash
cd server
npm run server   # Development with nodemon (hot reload)
npm start        # Production (node server.js)
```

### Client
```bash
cd client
npm run dev      # Development server (Vite, port 5173)
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

## Architecture

### Server (`server/`)
- **Entry**: `server.js` — Express app setup, CORS (allows `localhost:5173`), cookie-parser, connects to MongoDB, mounts routes
- **Config**: `configs/db.js` — Mongoose connection using `MONGODB_URI` env var
- **Pattern**: Routes → Controllers → Models. Middleware applied per-route (not globally)
- **Auth**: JWT stored in HTTP-only cookies. `middlewares/authUser.js` verifies token and injects `userId` into `req.body`
- **All responses** use `{ success: boolean, message?: string, data?: any }` JSON shape

### Client (`client/`)
- **Entry**: `main.jsx` → `App.jsx` with React Router v7
- **State**: Global app state in `context/AppContext.jsx` (React Context)
- **Routing**: Pages in `pages/`, with a nested seller portal under `pages/seller/`
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin — no `tailwind.config.js` needed)
- **Notifications**: `react-hot-toast` for user feedback

### Environment Variables

Server (`server/.env`):
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret
- `NODE_ENV` — `development` or `production`
- `PORT` — defaults to `4000`

Client (`client/.env`):
- `VITE_CURRENCY` — currency symbol (e.g. `$`)

### API Endpoints
Base URL: `http://localhost:4000`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/user/register` | No | Register new user |
| POST | `/api/user/login` | No | Login, sets cookie |
| GET | `/api/user/is-auth` | Yes | Check auth status |
| GET | `/api/user/logout` | Yes | Clear auth cookie |

Future routes for products, orders, seller, and cart are expected to follow the same `routes/ → controllers/ → models/` pattern.
