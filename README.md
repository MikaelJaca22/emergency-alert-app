# Emergency Alert System

A community emergency alert management system built with Next.js, Express.js, Supabase, and Infobip SMS.

## Quick Start

### Backend

```bash
cd backend
npm install
npm start
```

The backend runs on `http://localhost:3005`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000`

## Configuration

Edit `backend/.env` with your credentials:

```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
```

Run the SQL schema from `backend/database-schema.sql` in your Supabase SQL Editor.

## Features

- Admin authentication (register/login)
- Resident management (add/edit/delete)
- Emergency alerts with SMS notifications
- SMS simulator for testing
- System logs and reports
