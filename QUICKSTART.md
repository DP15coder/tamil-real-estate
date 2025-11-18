# Quick Start Guide

## Running the Project

### Prerequisites
- Node.js 18+ installed ✓ (already installed)
- PostgreSQL installed and running
- Dependencies installed ✓ (already done)

### Step 1: Create .env file

```bash
cd /Users/ansr/NiranAI
```

Create a `.env` file with:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/tamil_transactions
JWT_SECRET=change_this_to_a_secure_random_string
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEMO_USERNAME=admin
DEMO_PASSWORD=demo123
```

### Step 2: Set up PostgreSQL Database

Option A - Using psql:
```bash
# Create database
createdb tamil_transactions

# Apply schema
psql -d tamil_transactions -f schema.sql
```

Option B - Using Drizzle:
```bash
npm run db:push
```

### Step 3: Run Development Server

```bash
npm run dev
```

### Step 4: Open Browser

Navigate to: **http://localhost:3000**

Login with:
- Username: `admin`
- Password: `demo123`

## Available Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio (database GUI)
```

## Troubleshooting

### Database Connection Error
If you get database connection errors:
1. Make sure PostgreSQL is running: `pg_isready`
2. Check your DATABASE_URL in .env
3. Verify the database exists: `psql -l | grep tamil_transactions`

### Port 3000 Already in Use
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Module Not Found Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```


