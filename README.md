# Cyber Risk Assessment

A full-stack web application for conducting weighted cybersecurity risk assessments. Built with Next.js 14, Prisma (SQLite), and Tailwind CSS.

## Features

- **Public Assessment Form** — Company details + multi-category questionnaire
- **Weighted Risk Scoring** — People (20%) + Process (40%) + Technology (40%)
- **On-Screen Risk Report** — Score breakdown, risk level, and recommendations
- **Email Notifications** — HTML report emailed to user and admin
- **Admin Portal** — Manage questions, score ranges, and view all submissions
- **Secure Admin Auth** — JWT-based login with HTTP-only cookies

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | SQLite via Prisma ORM |
| Styling | Tailwind CSS |
| Auth | JWT (jose library) |
| Email | Nodemailer |
| Language | TypeScript |

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Install dependencies

```bash
cd cyber-risk-assessment
npm install
```

### 2. Configure environment

Copy the example env file and update it:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-long-random-secret-string"

# Admin login credentials
ADMIN_EMAIL="admin@yourcompany.com"
ADMIN_PASSWORD="YourSecurePassword123"

# Email where admin receives report copies
ADMIN_REPORT_EMAIL="reports@yourcompany.com"

# SMTP settings (Gmail example)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-gmail@gmail.com"
SMTP_PASS="your-gmail-app-password"
SMTP_FROM="Cyber Risk Assessment <noreply@yourcompany.com>"
```

> **Gmail App Password**: Enable 2FA on your Google account, then go to  
> Google Account → Security → App Passwords → Create a password for "Mail"

### 3. Set up the database

```bash
# Generate Prisma client
npm run db:generate

# Create database tables
npm run db:push

# Seed sample questions and recommendation ranges
npm run db:seed
```

Or run all three at once:

```bash
npm run setup
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Application URLs

| URL | Description |
|---|---|
| `http://localhost:3000` | Public assessment form |
| `http://localhost:3000/result/[id]` | Risk report result page |
| `http://localhost:3000/admin/login` | Admin login |
| `http://localhost:3000/admin` | Admin dashboard |
| `http://localhost:3000/admin/questions` | Question Bank |
| `http://localhost:3000/admin/recommendations` | Risk Score Ranges |
| `http://localhost:3000/admin/submissions` | Submitted Reports |

---

## Admin Credentials (default)

```
Email:    admin@example.com
Password: Admin@123
```

Change these in your `.env.local` file before going to production.

---

## Scoring Logic

### Category Weights
| Category | Weight |
|---|---|
| People | 20% |
| Process | 40% |
| Technology | 40% |

### Formula
1. **Raw Score** = Average of selected choice scores within each category
2. **Weighted Score** = Raw Score × Category Weight
3. **Overall Score** = Sum of all weighted scores

### Default Risk Levels (seeded)
| Score Range | Risk Level |
|---|---|
| 0.00 – 2.49 | Low |
| 2.50 – 4.99 | Moderate |
| 5.00 – 7.49 | High |
| 7.50 – 10.00 | Critical |

> All score ranges and recommendations are configurable by admin.

---

## Production Deployment

### Build for production

```bash
npm run build
npm start
```

### Environment checklist
- [ ] Change `JWT_SECRET` to a long random string (32+ characters)
- [ ] Set strong `ADMIN_PASSWORD`
- [ ] Configure real SMTP credentials
- [ ] Set `NEXT_PUBLIC_APP_URL` to your domain
- [ ] Use a persistent database (PostgreSQL) for production

### Using PostgreSQL in production

1. Install `pg` driver: `npm install pg`
2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Update `DATABASE_URL` in `.env.local` to your PostgreSQL connection string
4. Run `npm run db:push` to create tables

---

## Database Management

```bash
# Open Prisma Studio (visual DB browser)
npm run db:studio

# Re-seed the database (WARNING: clears existing data)
npm run db:seed

# Push schema changes to database
npm run db:push
```

---

## Project Structure

```
cyber-risk-assessment/
├── app/
│   ├── page.tsx                    # Public assessment form
│   ├── result/[id]/page.tsx        # Risk report result page
│   ├── admin/
│   │   ├── layout.tsx              # Admin sidebar layout
│   │   ├── page.tsx                # Dashboard
│   │   ├── login/page.tsx          # Admin login
│   │   ├── questions/page.tsx      # Question bank management
│   │   ├── recommendations/page.tsx # Score range management
│   │   └── submissions/
│   │       ├── page.tsx            # Submissions list
│   │       └── [id]/page.tsx       # Submission detail
│   └── api/
│       ├── auth/login/route.ts
│       ├── auth/logout/route.ts
│       ├── questions/route.ts
│       ├── questions/[id]/route.ts
│       ├── recommendations/route.ts
│       ├── recommendations/[id]/route.ts
│       ├── submissions/route.ts
│       ├── submissions/[id]/route.ts
│       └── admin/dashboard/route.ts
├── lib/
│   ├── db.ts        # Prisma client singleton
│   ├── scoring.ts   # Weighted scoring engine
│   ├── email.ts     # HTML email templates + Nodemailer
│   └── auth.ts      # JWT auth helpers
├── prisma/
│   ├── schema.prisma # Database schema
│   └── seed.ts       # Sample data
└── middleware.ts     # Admin route protection
```
