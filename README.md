# MAA VAISHNO VIDEO FILM'S — Web Application & Management Console

A production-ready, full-stack website and administrative platform crafted for **MAA VAISHNO VIDEO FILM'S**, Hajipur's premier photography, cinematography, customized sublimation gifts, and digital cyber cafe center.

---

## 🌟 Technology Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (v15.5.29, App Router, React 18.3.1)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (v5.6.3)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v3.4.14) & PostCSS
- **Database & ORM:** [Neon Serverless PostgreSQL](https://neon.tech/) with [Prisma ORM](https://www.prisma.io/) (v5.21.1)
- **Media & Asset Storage:** [ImageKit.io](https://imagekit.io/) (remote media delivery with buffer-level MIME verification)
- **Transactional Email:** [Brevo REST API](https://www.brevo.com/) (v3 Transactional Email)
- **3D Graphics & Animations:** [Three.js](https://threejs.org/) (WebGL cursor-tracking gimbal camera)
- **Authentication & Security:** Signed JWTs via [jose](https://github.com/panva/jose) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Production Hosting:** [Vercel](https://vercel.com/)

---

## 🎨 Key Highlights & Architecture

### 1. Liquid Glass Design System
- **Color Palette:** Pure white & soft ivory background (`#FFFFFF`, `#FCFBF7`), elegant crimson red accents (`#E11D48`, `#BE123C`), soft blush rose surfaces (`#FFF1F2`, `rgba(225, 29, 72, 0.08)`), and deep charcoal typography (`#0F172A`).
- **Surface Elevation:** Multi-layer translucent backdrop blur (`backdrop-filter: blur(16px)`), micro reflective light ribbons, glossy borders, and soft ambient shadows.
- **Aesthetic:** Bright, high-end photography studio atmosphere rather than generic dark themes.

### 2. Signature Interactive 3D Gimbal-Mounted Camera
- **Photorealistic Three.js WebGL Rig:** Realistic mirrorless camera body with cinema prime lens, Arca-Swiss plate, red recording tally LED, and metallic hardware.
- **Cursor-Tracking Mechanics:** Camera body and lens assembly smoothly track pointer movements via mechanical lerp easing while the tripod base and ergonomic handle remain fixed and upright.
- **Accessibility & Touch:** Gentle pointer tracking on touch devices, graceful static render when `prefers-reduced-motion` is active.

### 3. Dodging Animated Quadcopter Drone
- Realistic compact aerial quadcopter with 4 spinning rotor blur discs, navigation sensors, and 4K camera gimbal pod.
- **Vector Pointer Avoidance:** Dynamically detects approaching cursor within a 150px radius and banks away to safe bounded coordinates without blocking click events on interactive UI components.

### 4. Interactive Live Customization Preview Simulator
- Real-time customization simulator where customers select product templates (sublimation ceramic mugs, illuminated LED frames, t-shirts, cushions).
- Live photo upload and text customization composited dynamically onto products with realistic lighting and instant WhatsApp quote generation.

### 5. Resilient Customer Inquiry Pipeline
- Validates user input through Zod and persists leads directly into Neon PostgreSQL (`ContactMessage` table).
- Automatically dispatches studio transactional alert emails via Brevo REST API in a decoupled, non-blocking flow (email network timeouts never block or fail inquiry creation).

---

## 📁 Repository Structure

```
final_shop_website/
├── public/
│   ├── logo.png                     # Official business logo
│   └── uploads/                     # Local fallback storage directory
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/auth/          # Login, logout, change-password
│   │   │   ├── admin/categories/    # Category management CRUD
│   │   │   ├── admin/imagekit-auth/ # ImageKit client-side auth signature
│   │   │   ├── admin/inquiries/     # Inquiry retrieval & notes update
│   │   │   ├── admin/inquiries/[id]/# Dynamic inquiry status & deletion
│   │   │   ├── admin/portfolio/     # Portfolio showcase management
│   │   │   ├── admin/products/      # Product catalog CRUD
│   │   │   ├── admin/products/[id]/ # Dynamic product update & deletion
│   │   │   ├── admin/services/      # Photography packages management
│   │   │   ├── admin/settings/      # Studio contact & metadata settings
│   │   │   ├── admin/upload/        # Authenticated upload & safe deletion
│   │   │   ├── inquiries/           # Public rate-limited inquiry endpoint
│   │   │   └── products/            # Public product listing API
│   │   ├── admin/                   # Administrative UI dashboard & pages
│   │   │   ├── categories/
│   │   │   ├── change-password/
│   │   │   ├── dashboard/
│   │   │   ├── inquiries/
│   │   │   ├── login/
│   │   │   ├── portfolio/
│   │   │   ├── products/
│   │   │   ├── services/
│   │   │   └── settings/
│   │   ├── product/[slug]/          # Canonical redirect to /products/[slug]
│   │   ├── products/[slug]/         # Dynamic product details page
│   │   ├── layout.tsx               # Root layout & LocalBusiness Schema.org
│   │   ├── page.tsx                 # Dynamic studio homepage
│   │   └── globals.css              # Liquid Glass design tokens
│   ├── components/
│   │   ├── Navbar.tsx               # Floating glass header (no public admin link)
│   │   ├── GimbalCamera.tsx         # Three.js 3D gimbal camera
│   │   ├── InteractiveDrone.tsx     # Animated drone with physics avoidance
│   │   ├── PhotographyServices.tsx  # Studio photography packages showcase
│   │   ├── PortfolioGallery.tsx     # Portfolio gallery grid
│   │   ├── ProductCatalog.tsx       # Live product showcase with filter tabs
│   │   ├── MugCollectionShowcase.tsx
│   │   ├── FrameCollectionShowcase.tsx
│   │   ├── CustomizationPreview.tsx # Interactive product simulator
│   │   ├── CyberCafeSection.tsx     # Digital cyber cafe & CSC services
│   │   ├── InquiryForm.tsx          # Client-validated inquiry form
│   │   ├── ProductDetailsView.tsx   # Detailed product view component
│   │   ├── GoogleMapCard.tsx        # Verified studio map location
│   │   └── Footer.tsx
│   ├── lib/
│   │   ├── auth.ts                  # Jose JWT verification, bcrypt & RBAC
│   │   ├── email.ts                 # Brevo Transactional Email REST API helper
│   │   ├── prisma.ts                # Prisma client singleton
│   │   ├── utils.ts                 # INR currency, dates, and slug formatting
│   │   └── storage/
│   │       └── imagekit.ts          # ImageKit upload, buffer MIME check & deletion
│   └── middleware.ts                # Edge auth routing for /admin and /api/admin
├── prisma/
│   └── schema.prisma                # Relational PostgreSQL schema
├── tests/
│   └── core.test.js                 # 12 automated unit test suites
├── .env.example                     # Environment template with safe placeholders
├── package.json
└── tsconfig.json
```

---

## 🗄️ Database Architecture (Neon Serverless PostgreSQL)

The application uses **Neon Serverless PostgreSQL** configured through Prisma ORM.

### Dual Connection String Configuration

In [`prisma/schema.prisma`](prisma/schema.prisma), two distinct connection URLs are configured:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

- **`DATABASE_URL` (Pooled Connection):** Points to Neon's connection pooler (`-pooler` in the hostname). This pooled string is used by the Next.js runtime and serverless functions during production request handling to support high-concurrency connections efficiently.
- **`DIRECT_URL` (Direct Connection):** Points directly to the primary Neon compute node without pooling. This is required by the Prisma CLI for schema migrations and DDL statements, which cannot run over transactional connection poolers.

### ⚠️ Migration Safety & Production Database Rules (CRITICAL)

The production database is **Neon Serverless PostgreSQL**. To prevent data loss, transaction aborts, or schema corruption, observe the following operational rules:

1. **Production Neon Migration History is Unreconciled:**
   - The production Neon PostgreSQL database schema was established out-of-band and its migration history table (`_prisma_migrations`) is not currently reconciled with the local migration tree.
   - **DO NOT run `npm run db:migrate` against production.**
   - **DO NOT run `npx prisma migrate deploy` against production.**
   - Production database schema comparison and migration reconciliation must be performed separately using a verified database connection and an explicitly reviewed, dedicated change management procedure.
2. **NEVER run `npx prisma db push` (or `npm run db:push`) against production:** `db push` bypasses migration tracking, does not record migration metadata, and can lead to unrecoverable data loss or schema drift.
3. **NEVER run `prisma migrate reset` or `prisma migrate dev` (or `npm run db:migrate:dev`) against production:** These development-only commands drop existing tables and recreate schemas from scratch, permanently destroying production customer and product data.
4. **NEVER automatically execute migrations during build or deployment:** Do not attach migration commands to Vercel build steps (`next build`) or automated deployment pipelines.
5. **No Automated Seeding:** The legacy seed script (`prisma/seed.js`) has been permanently deleted from the repository. Do not attempt to run database seeds; initial administrator credentials, studio settings, and products are already established in the production database.

---

## 🔑 Environment Variables Configuration

Create a local environment file (`.env.local` or `.env`) based on [`.env.example`](.env.example). **Never commit real credentials or secrets to version control.**

| Variable Name | Required | Description | Example / Safe Placeholder |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | Neon pooled PostgreSQL connection string for runtime queries | `postgresql://USER:PASSWORD@ep-xyz-pooler.region.aws.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | **Yes** | Neon direct connection string for Prisma CLI migrations | `postgresql://USER:PASSWORD@ep-xyz.region.aws.neon.tech/neondb?sslmode=require` |
| `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` | **Yes** | ImageKit public API key for frontend widgets | `public_xxxxxxxxxxxxxxxxxxxxxxxxxxx=` |
| `IMAGEKIT_PRIVATE_KEY` | **Yes** | ImageKit secret private key (server-side only) | `private_xxxxxxxxxxxxxxxxxxxxxxxxxxx=` |
| `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`| **Yes** | ImageKit endpoint URL for media delivery | `https://ik.imagekit.io/your_imagekit_id` |
| `JWT_SECRET` | **Yes** | Minimum 32-character random secret for signing admin JWTs | `generate-a-strong-secret-key-at-least-32-chars` |
| `BREVO_API_KEY` | Optional | Brevo REST API v3 key for transactional email alerts | `xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `BREVO_SENDER_EMAIL` | Optional | Verified sender email address registered in Brevo | `maavaishnovideofilm@gmail.com` |
| `BREVO_SENDER_NAME` | Optional | Display name appearing on outbound notification emails | `MAA VAISHNO VIDEO FILM'S` |
| `NOTIFICATION_EMAIL` | Optional | Destination inbox receiving customer inquiry alerts | `maavaishnovideofilm@gmail.com` |
| `NEXT_PUBLIC_APP_URL` | Optional | Canonical site URL (used for metadataBase and sitemaps)| `http://localhost:3000` |

*Note: If `BREVO_API_KEY` is omitted, inquiries are safely saved in the database while outbound email delivery is skipped.*

---

## 🛠️ Local Development Guide

### 1. Prerequisites
- **Node.js:** v18.18+ or v20+ (tested on Node v24.16.0)
- **npm:** v9+
- Access to a development PostgreSQL database (or Neon branch)

### 2. Installation
```bash
# Clone the repository and navigate into the project directory
cd "d:/final website"

# Install dependencies
npm install
```

### 3. Configure Local Environment
Copy the example environment template and configure your local PostgreSQL connection:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env.local
```

**macOS / Linux / Git Bash:**
```bash
cp .env.example .env.local
```
Update `.env.local` with valid development credentials for `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, and ImageKit keys.

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Available Scripts (from `package.json`)
- `npm run dev` — Starts local development server at `http://localhost:3000` via `next dev -p 3000`.
- `npm run build` — Compiles production application and performs full Next.js 15 type checking via `next build`.
- `npm run start` — Starts production server locally via `next start -p 3000`.
- `npm run lint` — Runs Next.js ESLint checks via `next lint`.
- `npm test` — Executes automated unit test suite via `node --test tests/core.test.js`.
- `npm run db:push` — Executes `prisma db push` (Development only. NEVER run against production).
- `npm run db:migrate` — Executes `prisma migrate deploy`. **CRITICAL WARNING:** Do NOT run this against the production Neon database. The production migration history is currently unreconciled. Migrations must only be executed in a development environment or after a separate verified reconciliation procedure has been performed.
- `npm run db:migrate:dev` — Executes `prisma migrate dev` (Development only. NEVER run against production).
- `npm run db:studio` — Opens Prisma Studio GUI for database inspection via `prisma studio`. Avoid connecting directly to production databases during active customer traffic.

---

## 🧪 Automated Testing

Run the test suite using Node's native test runner:
```bash
npm test
```

The test suite ([`tests/core.test.js`](tests/core.test.js)) validates 12 critical subsystems:
1. **Password Hashing:** Secure bcryptjs salt generation and password verification.
2. **Currency Formatting:** Accurate integer paise to INR (`₹`) formatting.
3. **Slug Generation:** URL sanitization, non-word removal, and hyphens.
4. **Mobile Validation:** Strict Indian 10-digit mobile number regex (`^[6-9]\d{9}$`).
5. **RBAC Authorization:** Strict OWNER-only permission checks.
6. **Upload Folder Allowlist:** Restricts uploads to permitted directories (`products`, `portfolio`, `services`).
7. **Password Policy:** Enforces complexity (minimum 8 characters, uppercase, lowercase, numbers, symbols).
8. **Safe Filename Generation:** Generates random, unguessable storage filenames from verified MIME types.
9. **Path Traversal & Unicode Protection:** Blocks directory traversal, Windows UNC paths, and deceptive extensions.
10. **Buffer-Level Magic Byte MIME Detection:** Inspects actual buffer headers (JPEG, PNG, WebP, GIF, MP4, WebM, QuickTime).
11. **Local Deletion Path Safety:** Prevents symlink escape, traversal, directory deletion, and missing file errors.
12. **Brevo Email Integration:** Tests missing key fallback, HTML escaping, payload structure, mocked dispatch, and DB resilience.

---

## 🚀 Vercel Production Deployment Guide

Deploying the application to Vercel utilizes standard Next.js 15 App Router conventions.

### Step 1: Connect GitHub Repository to Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** and select **Project**.
3. Locate and import the **`Aryank2023/final_shop_website`** repository (or `final_shop_website`).

### Step 2: Configure Project Settings & Deployment Branch
- **Framework Preset:** `Next.js` (automatically detected).
- **Root Directory:** `./`
- **Production Branch:** **`vercel-deployment`**
  > **IMPORTANT:** The intended deployment branch is `vercel-deployment`. This branch must first exist on GitHub before selecting it in Vercel. Do **not** select or deploy from `main`.
- **Build Command:** `next build` (or `npm run build`)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)

### Step 3: Add Production Environment Variables
In the **Environment Variables** section of the Vercel project configuration, add all production variables:
- `DATABASE_URL` (Neon pooled connection string)
- `DIRECT_URL` (Neon direct connection string)
- `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`
- `JWT_SECRET` (Strong random string, min. 32 characters)
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `NOTIFICATION_EMAIL`
- `NEXT_PUBLIC_APP_URL` (Set to your live production domain, e.g. `https://maavaishnovideofilms.com`)

### Step 4: Deploy & Verify
1. Click **Deploy**. Vercel will install dependencies, compile TypeScript, optimize static pages, and deploy edge middleware.
2. Once the build completes, visit the live deployment URL.
3. Verify core functionality:
   - Homepage loads with 3D Gimbal Camera and Quadcopter Drone.
   - Products and Services catalogs render correctly from Neon PostgreSQL.
   - Submit a test inquiry via the public form to verify database persistence and Brevo email delivery.
   - Access the hidden admin login at `/admin/login`.

### Step 5: Troubleshooting Build Failures
If a deployment fails, inspect the build output in **Vercel Dashboard -> Deployments -> [Select Deployment] -> Build Logs**:
- **Missing Environment Variables:** Ensure all required variables (especially `DATABASE_URL` and `JWT_SECRET`) are configured in Vercel.
- **Type Checking Errors:** Ensure `npm run build` succeeds locally before pushing changes.
- **Database Connection Timeouts:** Ensure `DATABASE_URL` uses Neon's pooled connection string (`-pooler`) with `?sslmode=require`.

---

## 🔒 Administrative Access & Security Features

- **Hidden Admin Route:** The public website contains **NO public login links or administrative buttons**.
- **Admin Access URL:** Accessible directly at `/admin/login`.
- **Authentication & RBAC:**
  - Secure bcryptjs password hashing.
  - HTTP-only signed JWT session cookies with 24-hour expiration.
  - Mandatory password change enforcement on initial administrator logins.
  - Strict OWNER role-based access control across all `/api/admin/*` endpoints.
- **Brute-Force & Rate Limiting:**
  - IP-based rate limiting on login attempts.
  - Rate limiting on public customer inquiry submissions (max 5 requests per 10 minutes per IP).
  - Honeypot anti-spam fields on public forms.
- **Audit Logging:** Administrative updates and deletions are recorded in the `AuditLog` table.
- **Media Upload Hardening:** Strict buffer magic-byte validation, extension derivation from detected MIME types, safe deletion path resolution, and symlink escape rejection.

---

## 📍 Verified Business Information

- **Business Name:** MAA VAISHNO VIDEO FILM'S
- **Proprietor:** Abhimanyu Kumar
- **Mobile:** +91 9708345649
- **Address:** Near Strawberry Kids School, Hathsarganj, Lalganj Road, Hajipur, Vaishali, Bihar - 844101.
- **Verified Google Maps Location:** [https://maps.app.goo.gl/PXY8owyi2jSiD1oc7](https://maps.app.goo.gl/PXY8owyi2jSiD1oc7)
 