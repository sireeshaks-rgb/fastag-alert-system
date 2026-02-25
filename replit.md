# Vehicle Registry System

## Overview
Full-stack vehicle registry system with Fastag balance management, low balance alerts, and recharge functionality.

## Tech Stack
- **Frontend**: React + TypeScript, Tailwind CSS, Shadcn UI, TanStack Query, Wouter
- **Backend**: Node.js, Express.js, PostgreSQL, Drizzle ORM
- **Database**: PostgreSQL via Replit

## Project Structure
```
shared/
  schema.ts        - Drizzle table definitions and Zod schemas (vehicles table)
  routes.ts        - API contract definitions with Zod validation
server/
  index.ts         - Express server entry point
  db.ts            - Database connection (pg Pool + Drizzle)
  storage.ts       - DatabaseStorage class implementing IStorage interface
  routes.ts        - API route handlers + seed data
  vite.ts          - Vite dev server integration (DO NOT MODIFY)
client/src/
  App.tsx           - Root app with routing
  pages/Home.tsx    - Main dashboard page
  components/
    vehicle-card.tsx  - Expandable vehicle card with recharge
    vehicle-form.tsx  - Add/edit vehicle form
    scanner-ui.tsx    - Simulated QR scanner component
  hooks/
    use-vehicles.ts   - TanStack Query hooks for vehicle CRUD + recharge
  index.css         - Theme variables and custom utilities
```

## Key Features
- Vehicle CRUD (create, read, update, delete)
- Search by vehicle number or owner name
- Expandable vehicle cards with detailed info
- Low Fastag Balance alerts (threshold: ₹200)
  - Red warning badge on card header
  - Pulsing border animation
  - Warning banner in expanded view
  - "Recharge Now" quick action button
- Fastag recharge with simulated QR scanner UI
- Backend computes `isLowBalance` field on every response

## API Endpoints
- `GET /api/vehicles` - List all vehicles (supports `?search=` query)
- `GET /api/vehicles/:id` - Get single vehicle
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle
- `POST /api/vehicles/:id/recharge` - Recharge Fastag balance

## Database
- Single table: `vehicles` with fields: id, vehicleNumber (unique), ownerName, model, mileage, fastagBalance, lastServiceDate, createdAt
- Seeded with 3 example vehicles on first run
