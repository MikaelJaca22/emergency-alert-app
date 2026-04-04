# Emergency Alert System - Frontend

A Next.js web application for community emergency alert management.

## Features

### User Features
- Login/Register authentication
- Report Emergency (Fire, Flood, Earthquake, etc.)
- View community status

### Admin Features
- Dashboard with real-time statistics
- Resident management
- Alert management (create, resolve, cancel)
- SMS broadcasting
- System logs viewer

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State**: React Context

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage
│   │   ├── login/             # Login page
│   │   ├── register/           # Registration page
│   │   ├── report-emergency/   # Emergency report form
│   │   ├── dashboard/          # Admin dashboard
│   │   ├── residents/          # Resident management
│   │   ├── alerts/             # Alert management
│   │   ├── sms/                 # SMS messaging
│   │   └── logs/                # System logs
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   └── layout/             # Layout components
│   ├── hooks/                  # Custom hooks (useAuth)
│   ├── lib/                    # Utilities (api, utils)
│   ├── types/                  # TypeScript types
│   └── styles/                  # Global styles
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Getting Started

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Set environment variables:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3005/api
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## API Configuration

Update `NEXT_PUBLIC_API_URL` in your environment to point to the backend API server.

## Backend Requirements

This frontend requires the backend API server to be running. The backend is in the `/backend` folder.

See the main README for backend setup instructions.
