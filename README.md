# EMPHSS School Portal

A modern, full-stack school management and digital identity portal built for **English Medium Public Higher Secondary School (EMPHSS), Bawli**.

**Live Demo:** [https://emphss.vercel.app](https://emphss.vercel.app)

---

## Key Features

### Student & Parent Portal
- **Online Student Registration:** Multi-step digital admission & profile registration with photo upload (JPG/PNG/WebP), subject selection by class, and transport/route tracking.
- **Instant Digital ID Card:** Downloadable/printable digital student ID card with sequential Reference ID (`EMPHSS-XXX`).
- **Secure Student Lookup:** 4-factor verification (Student ID, Date of Birth, Parent Mobile Number, Mother's Name) with rate-limited protection and `HttpOnly` JWT session.
- **Profile Correction Requests:** Students can submit correction requests that require Admin review and approval.
- **Smart Notice Board & Auto Holidays:** Pinned school notices with expiry dates plus automatic regional & national holiday alerts.

### Teacher Portal
- **Faculty Profiles & Verification:** Role-authenticated teacher dashboard with class-wise student directory and pending registration approvals.
- **Digital Award Roll:** Class & exam-wise marks entry with dynamic subject mapping (`Nursery` to `12th`).

### Admin Dashboard
- **School Overview & Analytics:** Live counts of active students, pending approvals, transport vs. local students, and class distribution.
- **Student & Teacher Management:** Search, filter, edit, and CSV export (with formula-injection protection).
- **Session & Class Promotion:** Transactional year-end class promotion (`Nursery` -> `12th` -> `Passed Out`) with hold-back support and audit logs.
- **Settings & Access Control:** Toggle public registration, publish/pin notices, review student correction requests, and rotate teacher access passcodes.

---

## Security Architecture

- **Authentication & Sessions:** Signed `HS256` JWTs (`jose`) stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies with server-side `sessionVersion` revocation.
- **Password Security:** `bcryptjs` hashing for admin & staff credentials (no plaintext password exposure).
- **Serverless Rate Limiting:** PostgreSQL-backed atomic rate limiter (`RateLimit` model) protecting login, student lookup, and registration endpoints.
- **Authorization & IDOR Protection:** Server-side role checks across SSR pages and API routes, teacher profile ownership binding, and pending-only approval/rejection guards.
- **HTTP & Data Hardening:** Strict `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and CSV formula-injection neutralization.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **Styling:** Tailwind CSS v4, Lucide Icons
- **Database & ORM:** PostgreSQL (Neon) + Prisma ORM (`@prisma/client`)
- **Security & Auth:** `jose` (JWT), `bcryptjs`
- **Deployment:** Vercel

---

## Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/emphss-portal.git
   cd emphss-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Copy `.env.example` to `.env` and fill in your PostgreSQL connection strings and JWT secret:
   ```bash
   cp .env.example .env
   ```

4. **Push Prisma schema & seed initial settings**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Run security verification tests**
   ```bash
   npm run build
   node --test tests/security.test.mjs
   ```
