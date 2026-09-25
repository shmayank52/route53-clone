# Route 53 Clone

A functional clone of the AWS Route 53 console — hosted zone and DNS record management with a
FastAPI backend, SQLite persistence, and a Next.js (TypeScript) frontend styled to match the
real Route 53 UI. Authentication is mocked (no real AWS account required).

> This is a portfolio/academic project. It does not perform real DNS resolution — creating a
> record here does not affect real-world DNS. The focus is on recreating the console's data
> model, workflows, and UI/UX.

---

## 1. Project structure

```
route53-clone/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, router registration
│   │   ├── database.py        # SQLAlchemy engine/session setup
│   │   ├── models.py          # ORM models: User, HostedZone, Record
│   │   ├── schemas.py         # Pydantic request/response schemas
│   │   ├── auth.py            # Password hashing, JWT creation/validation
│   │   └── routers/
│   │       ├── auth.py        # /api/auth/*
│   │       ├── hosted_zones.py# /api/hosted-zones/*
│   │       └── records.py     # /api/hosted-zones/{id}/records/*
│   ├── requirements.txt
│   └── run.sh                 # convenience script: venv + install + run
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── login/page.tsx
    │   │   ├── dashboard/page.tsx
    │   │   ├── hosted-zones/page.tsx        # list, search, create/edit/delete
    │   │   ├── hosted-zones/[id]/page.tsx   # record CRUD within a zone
    │   │   ├── traffic-policies/page.tsx    # "Coming soon" placeholder
    │   │   ├── health-checks/page.tsx       # "Coming soon" placeholder
    │   │   ├── resolver/page.tsx            # "Coming soon" placeholder
    │   │   └── profiles/page.tsx            # "Coming soon" placeholder
    │   ├── components/        # Sidebar, TopNav, Modal, Pagination, ProtectedLayout, ComingSoon
    │   ├── lib/                # api.ts (Axios client), auth-context.tsx, toast-context.tsx
    │   └── types/index.ts
    ├── package.json
    ├── tailwind.config.js
    └── next.config.js
```

---

## 2. Setup instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --reload-dir app --host 0.0.0.0 --port 8000
```

`--reload-dir app` is important: it tells uvicorn to only watch the `app/` source folder for
changes, not the whole `backend/` directory. Without it, every write to `route53.db` (the
SQLite file, which also lives in `backend/`) looks like a code change and triggers a server
restart mid-request — which shows up in the browser as a spurious "network error" even though
the write actually succeeded.

(or simply run `./run.sh` on macOS/Linux, which does the above for you.)

The API is now available at `http://localhost:8000`. SQLite tables are created automatically on
first run (`route53.db` appears in `backend/`). Interactive API docs are at
`http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
cp .env.local.example .env.local   # sets NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
```

Open `http://localhost:3000`. You'll land on the login screen — click **"Need an account? Create
one"** to register a demo user (this is a mocked auth system; any email/password works, no
verification step).

### Production build

```bash
# backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# frontend
npm run build && npm run start
```

For a hosted demo, deploy the backend (e.g. Render/Railway/Fly.io) and the frontend (e.g.
Vercel), pointing `NEXT_PUBLIC_API_URL` at the deployed backend URL. Make sure CORS on the
backend allows the deployed frontend's origin (currently wide-open with `allow_origins=["*"]`
for demo simplicity — tighten this for real deployments).

---

## 3. Architecture overview

- **Frontend (Next.js App Router)**: Client-rendered pages under `src/app`. A shared
  `AuthProvider` (React context) stores the JWT and user in `localStorage` and exposes
  `login`/`register`/`logout`. `ProtectedLayout` wraps every authenticated page, redirecting to
  `/login` when there's no session, and renders the shared `TopNav` (AWS-style top bar) and
  `Sidebar` (Route 53 left nav: Dashboard, Hosted zones, Traffic policies, Health checks,
  Resolver, Profiles).
- **API client**: `lib/api.ts` wraps Axios, attaches the bearer token to every request, and
  redirects to `/login` on a 401 response.
- **Notifications**: `lib/toast-context.tsx` provides a global `notify()` used after every
  create/update/delete action, matching Route 53's notification banners.
- **Backend (FastAPI)**: A conventional layered structure — `models.py` (SQLAlchemy ORM),
  `schemas.py` (Pydantic validation/serialization), and per-resource routers. Every hosted-zone
  and record endpoint is scoped to `current_user` (via a JWT dependency), so each mocked account
  only sees its own zones/records — mirroring how Route 53 is scoped to an AWS account.
- **Business logic mirroring Route 53 semantics**:
  - Creating a hosted zone auto-creates the default **NS** and **SOA** records (like real Route
    53), which can't be edited or deleted individually.
  - Hosted zone names are normalized to a trailing dot (`example.com.`).
  - `record_count` on the zone is kept in sync as records are added/removed.
  - Duplicate (name, type) record pairs within a zone are rejected, mirroring Route 53's
    uniqueness rule.

---

## 4. Database schema

**users**
| Column           | Type     | Notes                        |
|------------------|----------|-------------------------------|
| id               | string (UUID) | Primary key             |
| email            | string   | Unique                       |
| hashed_password  | string   | bcrypt hash                  |
| full_name        | string   |                               |
| account_id       | string   | Mocked 12-digit AWS account ID |
| created_at       | datetime |                               |

**hosted_zones**
| Column         | Type     | Notes                                  |
|----------------|----------|-----------------------------------------|
| id             | string   | Primary key, `Z`-prefixed (Route53-style) |
| name           | string   | Domain name, trailing-dot normalized    |
| comment        | string   |                                          |
| private_zone   | boolean  |                                          |
| record_count   | integer  | Denormalized count, kept in sync        |
| owner_id       | string (FK → users.id) |                          |
| created_at / updated_at | datetime |                                |

**records**
| Column          | Type     | Notes                                          |
|-----------------|----------|-------------------------------------------------|
| id              | string (UUID) | Primary key                              |
| hosted_zone_id  | string (FK → hosted_zones.id) |                          |
| name            | string   | Fully-qualified record name                     |
| record_type     | string   | A / AAAA / CNAME / TXT / MX / NS / PTR / SRV / CAA / SOA |
| ttl             | integer  |                                                   |
| values          | text     | JSON-encoded array of string values              |
| routing_policy  | string   | Simple / Weighted / Latency / Failover / Geolocation / Multivalue answer |
| alias           | boolean  |                                                   |
| created_at / updated_at | datetime |                                          |

`HostedZone.records` cascades on delete — deleting a zone deletes all its records.

---

## 5. API overview

Base URL: `http://localhost:8000`. All endpoints except `/api/auth/register` and
`/api/auth/login` require an `Authorization: Bearer <token>` header. Full interactive docs (via
Swagger UI) are auto-generated at `/docs`.

### Auth
| Method | Path                | Description                          |
|--------|----------------------|---------------------------------------|
| POST   | `/api/auth/register` | Create a mocked account, returns JWT  |
| POST   | `/api/auth/login`    | Login, returns JWT                    |
| GET    | `/api/auth/me`       | Current user profile                  |
| POST   | `/api/auth/logout`   | No-op (stateless JWT; client discards token) |

### Hosted zones
| Method | Path                          | Description                                   |
|--------|--------------------------------|------------------------------------------------|
| GET    | `/api/hosted-zones`             | List zones (`search`, `page`, `page_size`)     |
| POST   | `/api/hosted-zones`             | Create a zone (auto-creates NS/SOA records)    |
| GET    | `/api/hosted-zones/{zone_id}`   | Get a single zone                              |
| PUT    | `/api/hosted-zones/{zone_id}`   | Update a zone's comment                        |
| DELETE | `/api/hosted-zones/{zone_id}`   | Delete a zone and its records                  |

### DNS records
| Method | Path                                             | Description                              |
|--------|---------------------------------------------------|--------------------------------------------|
| GET    | `/api/hosted-zones/{zone_id}/records`               | List records (`search`, `record_type`, `page`, `page_size`) |
| POST   | `/api/hosted-zones/{zone_id}/records`               | Create a record                          |
| PUT    | `/api/hosted-zones/{zone_id}/records/{record_id}`   | Update TTL / values / routing policy     |
| DELETE | `/api/hosted-zones/{zone_id}/records/{record_id}`   | Delete a record (default NS/SOA protected) |

---

## 6. Possible extensions (not included by default)

- BIND zone file import/export
- Dark mode
- Keyboard shortcuts
- Bulk record operations (the hosted-zone list already has row selection wired up as a starting
  point for bulk delete)
