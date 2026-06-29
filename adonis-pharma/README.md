# Adonis Pharma Analytics Platform

Enterprise-grade pharmaceutical sales analytics platform for Adonis Laboratories Pvt. Ltd.
~150 users · Role-based access (BE / Manager / Admin) · Built with Next.js + Supabase

---

## Quick Start

```bash
git clone https://github.com/your-org/adonis-pharma.git
cd adonis-pharma
npm install
cp .env.example .env.local
# fill in .env.local with your Supabase credentials
npm run dev
```

---

## Deployment Guide

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Install Supabase CLI: `npm install -g supabase`
3. Link project: `supabase link --project-ref YOUR_PROJECT_REF`
4. Run all migrations:
   ```bash
   supabase db push
   # or run manually in SQL editor:
   # paste contents of supabase/migrations/ALL_MIGRATIONS.sql
   ```
5. Run seeds (in order):
   ```bash
   psql $DATABASE_URL -f supabase/seeds/seed_products.sql
   psql $DATABASE_URL -f supabase/seeds/seed_cfa_stockist_hq.sql
   psql $DATABASE_URL -f supabase/seeds/seed_targets.sql
   psql $DATABASE_URL -f supabase/seeds/seed_historical_sales.sql
   ```
6. Enable Email Auth in Supabase Dashboard → Auth → Providers
7. Copy project URL and keys from Dashboard → Settings → API

### 2. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...anon key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...service key...   # server-only, never exposed to browser
NEXT_PUBLIC_APP_NAME="Adonis Analytics"
NEXT_PUBLIC_COMPANY="Adonis Laboratories Pvt. Ltd."
```

### 3. Vercel Deployment

1. Push repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Set Framework Preset: **Next.js**
4. Add all environment variables from step 2
5. Deploy

API routes run automatically as Vercel Serverless Functions.
No separate backend server needed.

---

## First-Time Admin Setup

After deployment:

1. Go to your Supabase Dashboard → Auth → Users → Invite User
2. Create an admin account for yourself
3. In SQL editor, insert your user profile:
   ```sql
   INSERT INTO user_profiles (auth_user_id, emp_id, role)
   VALUES (
     'your-supabase-auth-uuid',
     'ADLA02',             -- your employee ID
     'admin'
   );
   ```
4. Log in to the platform → Admin → Users → create accounts for all 150 users
5. Admin → Upload → Upload the first monthly sales dump

---

## Monthly Workflow (Admin)

1. **Admin → Upload** → select the Stockist Sales Dump Excel for the month
2. Select **Month** and **Fiscal Year**
3. Click **Upload & Process** — the system will:
   - Parse the Excel (same format as the historical files)
   - Club alias product codes to canonical products
   - Map stockists → HQ → employee
   - Insert sales transactions
   - Refresh all dashboard summaries
   - Refresh system forecasts (3-month rolling average)
   - Auto-populate next month's opening stock from this month's closing
4. Notify BEs to log in and enter their **Secondary Quantity** in Stock → Statement
5. Dashboards update automatically — no manual refresh needed

---

## Phase Build Status

| Phase | What | Status |
|-------|------|--------|
| 1 | Database schema + seeds | ✅ Ready to run |
| 2 | Upload engine + auth | ✅ Core written |
| 3 | Sales dashboards | 🔧 Build next |
| 4 | Stock module | 🔧 After Phase 3 |
| 5 | Forecasting engine | 🔧 After Phase 4 |
| 6 | Reports + hardening | 🔧 Final phase |

---

## Key Business Rules

| Rule | Implementation |
|------|---------------|
| BE target split | `src/lib/calculations/index.ts` → `splitByBECount()` |
| Product code clubbing | `src/lib/upload/index.ts` → `clubProductsInRows()` |
| Closing qty formula | DB trigger + `closingQty()` in calculations |
| Opening qty carry-forward | `propagate_stock_openings()` SQL RPC |
| System forecast | `(m1 + m2 + m3) / 3` — DB generated column |
| Growth % | `((CY - LY) / LY) × 100` |
| Fiscal year | April = month 1, March = month 12 |

---

## Repository Structure

See `REPO_STRUCTURE.md` for the full file tree.

## ER Diagram

See `docs/ER_DIAGRAM.md` for the Mermaid ERD (open in any Mermaid viewer or GitHub).
