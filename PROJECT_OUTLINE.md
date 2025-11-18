# Tamil Real Estate Transaction Extraction & Web UI

## Project Overview
Build a full-stack solution to ingest, parse, translate, and store 30 years of Tamil real-estate transactions from PDFs into PostgreSQL, and present them in a searchable web UI.

## Technology Stack (As Required)
- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS
- **Backend**: Next.js API routes (Node.js)
- **Database**: PostgreSQL with Drizzle ORM
- **PDF Processing**: pdf-parse or similar library
- **Translation**: Free/open-source library (Google Translate API free tier or similar)
- **Authentication**: NextAuth.js or simple auth

## Architecture & Project Structure

```
/NiranAI
├── src/
│   ├── app/                    # Next.js 14 app router
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (dashboard)/
│   │   │   ├── upload/
│   │   │   ├── transactions/
│   │   │   └── preview/
│   │   ├── api/                # API routes
│   │   │   ├── upload/
│   │   │   ├── transactions/
│   │   │   ├── translate/
│   │   │   └── search/
│   │   └── layout.tsx
│   ├── lib/                    # Core business logic
│   │   ├── pdf/
│   │   │   ├── parser.ts      # PDF parsing logic
│   │   │   └── extractor.ts   # Transaction extraction
│   │   ├── translation/
│   │   │   └── translator.ts  # Tamil to English
│   │   ├── db/
│   │   │   ├── schema.ts      # Drizzle schema
│   │   │   └── client.ts      # DB connection
│   │   └── validation/
│   │       └── schemas.ts     # Zod schemas
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── upload/
│   │   ├── transactions/
│   │   └── preview/
│   └── types/                # TypeScript types
├── public/
├── drizzle/                  # Database migrations
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── schema.sql                # PostgreSQL schema
└── tsconfig.json
```

## Database Schema

```sql
-- Transactions Table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  survey_number VARCHAR(255),
  district VARCHAR(255),
  document_number VARCHAR(255),
  registration_date DATE,
  execution_date DATE,
  buyer_name_tamil TEXT,
  buyer_name_english TEXT,
  seller_name_tamil TEXT,
  seller_name_english TEXT,
  house_number VARCHAR(255),
  property_description_tamil TEXT,
  property_description_english TEXT,
  property_value DECIMAL(15, 2),
  village VARCHAR(255),
  taluk VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pdf_source VARCHAR(255)
);

-- Create indexes for search performance
CREATE INDEX idx_buyer_name ON transactions(buyer_name_english);
CREATE INDEX idx_seller_name ON transactions(seller_name_english);
CREATE INDEX idx_survey_number ON transactions(survey_number);
CREATE INDEX idx_document_number ON transactions(document_number);
CREATE INDEX idx_registration_date ON transactions(registration_date);
```

## Key Features to Implement

### 1. PDF Ingestion & Parsing
- Accept Tamil PDF upload
- Extract text content preserving structure
- Parse transaction fields (buyer, seller, dates, property details)
- Handle multi-page documents

### 2. Translation Engine
- Translate Tamil fields to English
- Preserve accuracy of names and document references
- Batch processing for efficiency

### 3. Filtering & Search
- Query by: buyer name, seller name, house number, survey number, date range
- Return matching transactions in JSON
- Efficient indexing on searchable fields

### 4. API Development
- `POST /api/upload` - PDF upload endpoint
- `GET /api/transactions` - Get all/filtered transactions
- `POST /api/translate` - Translation endpoint
- `GET /api/search` - Search with query parameters

### 5. Web UI
- **Login Page**: Simple authentication (demo credentials)
- **Upload Page**: Drag-and-drop PDF upload with progress
- **Results Table**: Display all transactions with sorting/filtering
- **PDF Preview**: Side-by-side comparison with extracted data
- **Responsive Design**: Mobile-friendly with Tailwind CSS

## Quality Standards (Per Evaluation Criteria)

✅ **Correctness**: Accurate extraction and translation of all transactions
✅ **Code Quality**: Clean architecture, modular code, meaningful naming, TypeScript
✅ **User Experience**: Intuitive UI, clear upload/preview/results flow
✅ **Performance**: Process 30-year PDF in reasonable time
✅ **Documentation**: Comprehensive README, schema diagrams, setup instructions

## Development Phases

### Phase 1: Setup & Infrastructure
- Initialize Next.js project with TypeScript
- Set up Git repository
- Configure PostgreSQL + Drizzle ORM
- Create database schema

### Phase 2: Core Functionality
- PDF parsing logic
- Tamil text extraction
- Translation service integration
- Database operations

### Phase 3: API Development
- Upload endpoint with validation
- Transaction CRUD operations
- Search/filter logic

### Phase 4: Frontend Development
- Authentication UI
- Upload interface
- Results table with filters
- PDF preview component

### Phase 5: Testing & Documentation
- End-to-end testing
- README with setup instructions
- Database seed data
- Demo credentials

## Libraries & Tools

### Core Dependencies
- `next` - Framework
- `typescript` - Type safety
- `drizzle-orm` - Database ORM
- `postgres` - PostgreSQL client
- `zod` - Schema validation
- `pdf-parse` - PDF text extraction
- `tailwindcss` - Styling
- `lucide-react` - Icons

### Additional Tools
- Translation API (Google Translate free tier / open-source alternative)
- NextAuth.js or simple JWT authentication
- React Hook Form for forms
- shadcn/ui for UI components

## Deliverables

1. **GitHub Repository** with all source code
2. **README.md** with:
   - Setup & run instructions
   - Architecture overview
   - Library choices explanation
   - Schema diagrams
3. **Database Schema SQL** file
4. **Demo Credentials** for UI login
5. **Working Application** that meets all requirements

## Timeline Estimate

- **Day 1-2**: Setup, infrastructure, database schema
- **Day 3-4**: PDF parsing, extraction, translation logic
- **Day 5-6**: API development and testing
- **Day 7-8**: Frontend UI development
- **Day 9**: Integration, testing, documentation
- **Day 10**: Final polish, README, deployment prep

---

**Deadline**: 10 days from project kick-off
**Submission**: GitHub repository link by end of day

