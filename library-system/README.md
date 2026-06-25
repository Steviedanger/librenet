# 📖 LibreNet — Library Management System

A full-stack MERN library portal: browse a catalogue, borrow books for 14 days,
read PDFs online with saved progress and bookmarks, and manage everything from
an admin console. Deep-navy / forest-green academic theme, fully responsive and
keyboard accessible.

## Tech stack

| Layer    | Tech |
|----------|------|
| Frontend | React + Vite, React Router, Axios, TailwindCSS |
| Backend  | Node.js, Express |
| Database | MongoDB + Mongoose |
| Auth     | JWT (15-min access token in memory + 7-day refresh token in an httpOnly cookie), bcryptjs |
| Uploads  | Multer (book covers + PDFs) |
| Email    | Nodemailer (verification + password reset) |

## Features

- **Auth** — registration with email verification, login, silent token refresh,
  forgot/reset password, role-based access (`student` / `admin`).
- **Catalogue** — search (debounced), filter by genre/availability/year, sort by
  newest/popular/title/year, 10-per-page pagination.
- **Reading** — in-browser PDF reader with page controls and progress autosaved
  every 30 seconds; bookmarks.
- **Borrowing** — 14-day loans, returns, overdue flagging, borrow history.
- **Student dashboard** — current loans, reading progress, bookmarks, history.
- **Admin** — add/edit/delete books (with cover + PDF upload), activate/deactivate
  users, view all borrow records, summary stats.

---

## Prerequisites

- **Node.js** 18+
- **MongoDB** running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI

---

## Setup

### 1. Backend

```bash
cd backend
npm install
```

Open `backend/.env` and adjust as needed. The important ones:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/library_system
JWT_ACCESS_SECRET=<long random string>
JWT_REFRESH_SECRET=<another long random string>
CLIENT_URL=http://localhost:5173
# Email is optional in dev — if EMAIL_USER is left as the placeholder,
# verification / reset emails are printed to the server console instead of sent.
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

Seed the database with 10 sample books, a demo student and the default admin:

```bash
npm run seed
```

Seeded accounts:

| Role    | Email                 | Password       |
|---------|-----------------------|----------------|
| Admin   | `admin@library.com`   | `Admin@1234`   |
| Student | `student@library.com` | `Student@1234` |

> The demo student is pre-verified so you can log in immediately. New sign-ups
> must verify their email — in dev, look for the verification link printed in the
> **backend console**.

### 2. Frontend

```bash
cd ../frontend
npm install
```

The Vite dev server proxies `/api` and `/uploads` to `http://localhost:5000`,
so no extra frontend config is needed for local development.

---

## Running both servers

Open **two terminals**:

**Terminal 1 — backend (port 5000):**
```bash
cd backend
npm run dev      # nodemon, or: npm start
```

**Terminal 2 — frontend (port 5173):**
```bash
cd frontend
npm run dev
```

Then open **http://localhost:5173**.

- Browse as a guest, or log in as the demo student to borrow and read.
- Log in as the admin and visit **/admin** to manage books and users.

---

## Reading PDFs

The catalogue is seeded with metadata and cover images but **no PDF files**
(those are binary). To try the online reader, log in as admin → **Manage books**
→ edit a book → upload a PDF (and set a page count). The book’s **Read online**
button will then open the in-browser reader.

> **Uploads & storage:** if Cloudinary env vars are set, covers/PDFs are stored
> in Cloudinary; otherwise they’re written to `backend/uploads/` for local dev.

---

## 🚀 Deploy for free (Vercel + Render + Atlas + Cloudinary)

This stack runs entirely on free tiers and gives you a public URL — no local
server, no custom domain required.

| Piece | Host | URL you get |
|-------|------|-------------|
| Frontend | Vercel | `your-app.vercel.app` |
| Backend  | Render | `librenet-api.onrender.com` |
| Database | MongoDB Atlas | (connection string) |
| Uploads  | Cloudinary | (CDN URLs) |

> ⚠️ Render’s free backend **sleeps after ~15 min idle**, so the first request
> after a quiet spell takes ~30–60s to wake. Everything else is instant.

### 0. Push to GitHub
Put the **`library-system/`** folder in a GitHub repo (this is the repo root —
`render.yaml` lives here, `backend/` and `frontend/` are subfolders).

### 1. Cloudinary (uploads) — 2 min
1. Sign up at <https://cloudinary.com> (free).
2. From the dashboard copy **Cloud name**, **API Key**, **API Secret**.
3. Settings → **Security** → enable **“Allow delivery of PDF and ZIP files”**
   (off by default — required for the in-browser PDF reader to load files).

### 2. Backend on Render — 5 min
1. <https://render.com> → **New + → Blueprint** → connect your repo. Render
   detects [`render.yaml`](render.yaml) and creates the `librenet-api` service.
2. When prompted, fill in the env vars:
   - `MONGO_URI` — your Atlas string (include `/library_system` before the `?`)
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — long random strings
   - `CLIENT_URL` — your Vercel URL (you’ll get it in step 3; you can paste a
     placeholder now and update it after, then redeploy)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `EMAIL_*` — optional (leave default to log emails to the Render console)
3. Deploy. Note the URL, e.g. `https://librenet-api.onrender.com`.
4. **Seed the cloud DB once:** locally, point `backend/.env`’s `MONGO_URI` at
   Atlas and run `npm run seed` (or use Render’s **Shell** tab → `npm run seed`).

### 3. Frontend on Vercel — 3 min
1. <https://vercel.com> → **Add New → Project** → import the same repo.
2. **Root Directory: `frontend`** (important — it’s a subfolder).
   Framework preset **Vite** is auto-detected; build/output come from
   [`frontend/vercel.json`](frontend/vercel.json).
3. Add an environment variable:
   - `VITE_API_URL` = your Render URL (no trailing slash), e.g.
     `https://librenet-api.onrender.com`
4. Deploy → you get `https://your-app.vercel.app`.

### 4. Connect the two
Back in Render, set `CLIENT_URL` to your exact Vercel URL and redeploy (this
authorises CORS + sets the cross-site refresh cookie correctly). Done — open
your Vercel URL and log in.

> The code already handles cross-domain auth: cookies switch to
> `SameSite=None; Secure` when `NODE_ENV=production`, and CORS allows your
> `CLIENT_URL` plus any `*.vercel.app` preview deployment.

---

## Project structure

```
library-system/
├── backend/
│   ├── config/db.js              # Mongo connection
│   ├── controllers/              # auth, book, user, borrow logic
│   ├── middleware/               # JWT auth + Multer uploads
│   ├── models/                   # User, Book, BorrowRecord
│   ├── routes/                   # /api/auth, /books, /users, /borrow
│   ├── utils/sendEmail.js        # Nodemailer helper
│   ├── uploads/                  # covers + pdfs (gitignored)
│   ├── seed.js                   # sample data + admin
│   └── server.js
└── frontend/
    └── src/
        ├── components/           # Navbar, BookCard, SearchBar, Pagination, …
        ├── context/AuthContext   # auth state + auto refresh
        ├── hooks/                # useAuth, useBooks
        ├── pages/                # public, student & admin/ pages
        ├── services/             # axios instance + API wrappers
        ├── styles/globals.css    # Tailwind + theme
        └── utils/helpers.js
```

## API overview

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/api/auth/register` | public | Register + send verification |
| GET  | `/api/auth/verify-email` | public | Verify email |
| POST | `/api/auth/login` | public | Login (sets refresh cookie) |
| POST | `/api/auth/refresh` | cookie | New access token |
| POST | `/api/auth/logout` | public | Clear refresh cookie |
| POST | `/api/auth/forgot-password` | public | Email reset link |
| POST | `/api/auth/reset-password` | public | Set new password |
| GET  | `/api/books` | public | List/search/filter/sort/paginate |
| GET  | `/api/books/:id` | public | Book detail |
| GET  | `/api/books/:id/read` | auth | PDF URL + saved page |
| POST/PUT/DELETE | `/api/books/:id?` | admin | Manage books |
| GET  | `/api/users/me` · PUT | auth | Profile |
| GET/POST | `/api/users/bookmarks` | auth | Bookmarks |
| GET/PUT | `/api/users/progress` | auth | Reading progress |
| GET  | `/api/users` · `/stats` · PATCH `/:id/status` | admin | User admin |
| POST | `/api/borrow/:bookId` | auth | Borrow |
| POST | `/api/borrow/:recordId/return` | auth | Return |
| GET  | `/api/borrow/me` | auth | My loans |
| GET  | `/api/borrow` | admin | All loans |

---

Built for readers. Enjoy the quiet. 📚
