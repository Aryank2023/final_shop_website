# MAA VAISHNO VIDEO FILM’S — Web Application & Management Console

A full-stack, production-oriented website and administrative platform crafted for **MAA VAISHNO VIDEO FILM’S**, Hajipur’s premier photography, cinematography, customized sublimation gifts, and digital cyber cafe center.

---

## 🌟 Key Highlights & Architecture

### 1. Liquid Glass Design System
- **Color Palette:** Pure white & soft ivory background (`#FFFFFF`, `#FCFBF7`), elegant crimson red accent (`#E11D48`, `#BE123C`), soft blush rose surfaces (`#FFF1F2`, `rgba(225, 29, 72, 0.08)`), and deep charcoal text (`#0F172A`).
- **Surface Elevation:** Multi-layer translucent backdrop blur (`backdrop-filter: blur(16px)`), micro reflective light ribbons, glossy borders, and soft ambient shadows.
- **Aesthetic:** Bright, high-end photography studio atmosphere rather than dark generic AI themes.

### 2. Signature Interactive 3D Gimbal-Mounted Camera
- **Photorealistic Three.js WebGL Rig:** A realistic mirrorless/DSLR camera body with prime multi-barrel cinema lens, Arca-Swiss plate, red recording tally LED, and metallic hardware.
- **Cursor-Tracking Mechanics:**
  - Cursor moves left/right/up/down $\rightarrow$ camera yaw and pitch follow the cursor with smooth mechanical lerp easing.
  - Returns to center neutral when mouse leaves.
- **Critical Mechanical Constraint Honored:**
  - The gimbal stand, tripod base, ergonomic handle, and lower pan hub remain **100% fixed, upright, and stationary**.
  - **Only** the camera body and optical lens assembly tilt and swivel.
  - Safe mechanical rotation boundaries ($\pm 31^\circ$ horizontal yaw, $\pm 18^\circ$ vertical pitch).
- **Reduced Motion & Touch:** Gentle pointer tracking on touch devices, graceful static render when `prefers-reduced-motion` is active.

### 3. Dodging Animated Quadcopter Drone
- Realistic compact aerial quadcopter with 4 animated spinning rotor blur discs, dual front navigation sensors, 4K camera gimbal pod, and aerodynamic carbon arms.
- **Vector Pointer Avoidance:** Continuously measures cursor distance. When the pointer approaches within a 150px detection radius, the drone dynamically calculates an evasion vector away from the cursor, applies natural flight banking tilt, and navigates to a safe bounded coordinate within the hero section.
- Non-blocking pointer events ensuring all navigation and CTAs remain clickable.

### 4. Interactive Live Customization Preview Simulator
- Genuine interactive simulator where customers select product templates (sublimation ceramic mugs, illuminated LED frames, t-shirts, cushions).
- Real-time photo upload and text customization (names, dates, font styles, typography colors) composited live onto the product with realistic lighting and warping.
- Instant prefilled WhatsApp order generator.

---

## 📂 Project Structure

```
d:/final website/
├── public/
│   ├── logo.png                # Official business logo
│   └── uploads/                # Persistent image upload directory
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/auth/     # Login, logout, session verification
│   │   │   ├── admin/products/ # Full CRUD with image attachments
│   │   │   ├── admin/upload/   # Authenticated multipart file upload
│   │   │   ├── admin/inquiries/# Inquiries query & notes update
│   │   │   ├── admin/services/ # Services management
│   │   │   ├── admin/portfolio/# Portfolio showcase management
│   │   │   ├── admin/settings/ # Site copy & contact settings
│   │   │   └── inquiries/      # Public rate-limited customer inquiry submission
│   │   ├── admin/
│   │   │   ├── login/          # Direct URL hidden login page
│   │   │   ├── dashboard/      # Telemetry & stats overview
│   │   │   ├── products/       # Products manager with modal & uploader
│   │   │   ├── categories/     # Category hierarchy
│   │   │   ├── services/       # Photography & cyber cafe packages
│   │   │   ├── portfolio/      # Wedding films & shoot showcases
│   │   │   ├── inquiries/      # Customer lead tracker & private notes
│   │   │   └── settings/       # Live site identity & Maps URL settings
│   │   ├── layout.tsx          # LocalBusiness Schema.org JSON-LD & OG tags
│   │   ├── page.tsx            # Live database-backed scrolling homepage
│   │   └── globals.css         # Liquid Glass CSS design tokens
│   ├── components/
│   │   ├── Navbar.tsx          # Floating glass navigation (NO public admin link)
│   │   ├── GimbalCamera.tsx    # 3D Three.js cursor-tracking gimbal camera
│   │   ├── InteractiveDrone.tsx# Quadcopter drone with dodge physics
│   │   ├── PhotographyServices.tsx
│   │   ├── PortfolioGallery.tsx
│   │   ├── ProductCatalog.tsx
│   │   ├── MugCollectionShowcase.tsx
│   │   ├── FrameCollectionShowcase.tsx
│   │   ├── CustomizationPreview.tsx
│   │   ├── CyberCafeSection.tsx
│   │   ├── InquiryForm.tsx     # Client-validated glass inquiry form
│   │   ├── GoogleMapCard.tsx   # Verified Lalganj Road Hajipur location
│   │   └── Footer.tsx
│   └── lib/
│       ├── prisma.ts           # Prisma singleton
│       ├── auth.ts             # Jose JWT & bcrypt authentication
│       ├── utils.ts            # INR formatting, dates, slugification
│       └── email.ts            # Email alert dispatcher
├── prisma/
│   ├── schema.prisma           # Relational schema
│   └── seed.js                 # Database seeder with full catalog
├── tests/
│   └── core.test.js            # Automated unit tests
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🛠️ Setup & Running Locally

### 1. Prerequisites
- Node.js 18+ (tested on Node v24.16.0)
- npm 9+

### 2. Installation
```bash
# Clone or navigate to the repository
cd "d:/final website"

# Install dependencies
npm install
```

### 3. Database Initialization & Seeding
The project uses Prisma ORM with SQLite for instant zero-dependency local execution, and can seamlessly connect to PostgreSQL in production.

```bash
# Sync database schema
npx prisma db push

# Seed first administrator, site settings, catalog products, and services
node prisma/seed.js
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the public site.

---

## 🔐 Administrative Access & Security

- **Hidden Route:** The public website has **NO public admin login button or link**.
- **Direct Login URL:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Default Seed Administrator Credentials:**
  - **Username:** `admin` (or `admin@maavaishnovideofilms.com`)
  - **Password:** `MaaVaishno@2026!`
- **Security Features:**
  - Password hashing via `bcryptjs`.
  - HTTP-only signed JWT session cookies with 24h expiration.
  - Brute-force rate limiting on login attempts (IP-based).
  - Server-side session verification on all `/api/admin/*` endpoints and dashboard routes.
  - Audit logging for administrative actions in `AdminAuditLog` table.
  - Upload endpoints restrict file size (5MB), validate MIME type, and generate random filenames to prevent path traversal.

---

## 🧪 Running Automated Tests

Run the test suite using Node's native test runner:
```bash
npm test
```
All unit tests cover:
- Bcrypt password hashing and verification.
- Accurate integer paise to INR (`₹`) formatting.
- URL slug generation and character sanitization.
- Indian 10-digit mobile phone number validation.

---

## 🚀 Production Deployment (PostgreSQL + Vercel / Railway / Docker)

### Switching to PostgreSQL
1. In `prisma/schema.prisma`, update the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. In `.env`, set:
   ```env
   DATABASE_URL="postgresql://username:password@db-host:5432/maavaishno?schema=public"
   ```
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   node prisma/seed.js
   ```

### Production Build
```bash
npm run build
npm run start
```

---

## 📍 Verified Business Information

- **Business Name:** MAA VAISHNO VIDEO FILM’S
- **Proprietor:** Abhimanyu Kumar
- **Mobile:** 9708345649
- **Address:** Near Strawberry Kids School, Hathsarganj, Lalganj Road, Hajipur, Vaishali, Bihar - 844101.
- **Verified Google Maps Link:** [https://maps.app.goo.gl/ZSZKFxj4UMeUjVz68](https://maps.app.goo.gl/ZSZKFxj4UMeUjVz68)
