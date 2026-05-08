<div align="center">

# 🤖 AI Remote Job Hunter

### *Automated job discovery · AI scoring · One-click applications*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-6-green?style=for-the-badge&logo=mongodb)](https://mongodb.com)
[![n8n](https://img.shields.io/badge/n8n-Automation-orange?style=for-the-badge&logo=n8n)](https://n8n.io)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-AI-purple?style=for-the-badge)](https://openrouter.ai)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)

> A fully automated, AI-powered job hunting system that scrapes remote jobs every hour, scores them against your profile, enriches company data, and lets you send personalized cover letters directly from your Gmail — all from a sleek dashboard.

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔄 **Auto Job Scraping** | Pulls jobs every hour from RemoteOK, Remotive, WeWorkRemotely & Adzuna |
| 🧠 **AI Job Scoring** | Scores each job 1–100 for your skill match using OpenRouter AI |
| 🏢 **Company Enrichment** | Auto-fetches company name, industry, summary, website, LinkedIn & HR emails |
| 📧 **AI Cover Letters** | Generates personalized cover letters using your resume + job description |
| 📬 **Gmail Integration** | Sends emails directly from your Gmail to all HR contacts at once |
| 📎 **Resume Attachment** | Attaches your uploaded resume (PDF/DOCX/TXT) to every sent email |
| ✅ **Status Tracking** | Track every application — New → Applied → Interview → Rejected |
| 🔍 **Smart Search** | Search and filter across title, company, location, industry |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     n8n Automation                          │
│                                                             │
│  RemoteOK ──┐                                               │
│  Remotive ──┼──► Merge ──► Normalize ──► AI Score          │
│  WWR RSS ───┤             & Filter      & Email Gen         │
│  Adzuna ────┘                │                │             │
│                              ▼                ▼             │
│                           Limit(100)    Company Research    │
│                                │              │             │
│                                └──────┬───────┘             │
│                                       ▼                     │
│                              Score ≥ 70? ──► Save MongoDB   │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Dashboard                         │
│                                                             │
│  Job Table ──► Job Detail Modal ──► HR Emails               │
│      │                                  │                   │
│      ▼                                  ▼                   │
│  Email Modal ──► AI Cover Letter ──► Send via Gmail         │
│      │                                  │                   │
│      └──── Resume Upload & Attach ──────┘                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js** 18+ — [nodejs.org](https://nodejs.org)
- **MongoDB** running locally or a cloud URI — [mongodb.com](https://mongodb.com)
- **n8n** installed — [docs.n8n.io](https://docs.n8n.io/getting-started/installation/)
- **OpenRouter** account (free) — [openrouter.ai](https://openrouter.ai)
- **Adzuna** API credentials (free) — [developer.adzuna.com](https://developer.adzuna.com)
- **Gmail** account with App Password enabled

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-username/ai-remote-job-hunter.git
cd ai-remote-job-hunter
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then fill in your values (see [Environment Variables](#-environment-variables) below).

### 3. Set Up the n8n Automation

```bash
# Import the workflow into n8n
# Go to n8n → Workflows → Import from file
# Select: AI Remote Job Hunter.json
```

Replace all placeholder values in the workflow (see [n8n Setup](#-n8n-automation-setup) below).

### 4. Run the Dashboard

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🔑 Environment Variables

Create a `.env` file in the project root with the following:

```env
# ─── Database ────────────────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=n8n-jobs

# ─── AI (OpenRouter) ─────────────────────────────────────────
# Get your free key at: https://openrouter.ai/keys
OPENROUTER_API_KEY=your_openrouter_api_key_here

# ─── Gmail SMTP ──────────────────────────────────────────────
# Your Gmail address
GMAIL_USER=your-email@gmail.com
# App Password (NOT your regular password) — see instructions below
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# ─── Your Profile (used in AI-generated emails) ───────────────
CANDIDATE_NAME=Your Full Name
CANDIDATE_EMAIL=your-email@gmail.com
CANDIDATE_PHONE=+1-234-567-8900
CANDIDATE_LINKEDIN=linkedin.com/in/your-profile
CANDIDATE_GITHUB=github.com/your-username
```

### 📌 How to get each key

<details>
<summary><b>🔑 OpenRouter API Key</b></summary>

1. Go to [openrouter.ai](https://openrouter.ai) and sign up (free)
2. Navigate to **Keys** → **Create Key**
3. Copy the key and paste it as `OPENROUTER_API_KEY`
4. The free tier uses `openrouter/auto` which routes to available free models

</details>

<details>
<summary><b>📬 Gmail App Password</b></summary>

> ⚠️ You must use an **App Password**, not your regular Gmail password.

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Navigate to **Security** → **2-Step Verification** (must be ON)
3. Search for **"App passwords"** at the bottom of the Security page
4. Select **Mail** as the app → click **Generate**
5. Copy the 16-character password (e.g. `gotx cmov fiml ogbd`)
6. Paste it as `GMAIL_APP_PASSWORD` — spaces are fine, or remove them

</details>

<details>
<summary><b>🗄️ MongoDB URI</b></summary>

**Local MongoDB:**
```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=n8n-jobs
```

**MongoDB Atlas (cloud):**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
MONGODB_DB=n8n-jobs
```

</details>

---

## ⚙️ n8n Automation Setup

The automation workflow is in **`AI Remote Job Hunter.json`**. Import it into n8n and replace the following placeholders:

### Step 1 — Import the Workflow

1. Open your n8n instance (default: `http://localhost:5678`)
2. Go to **Workflows** → **Import from File**
3. Select `AI Remote Job Hunter.json`

### Step 2 — Replace Placeholders

Open the imported workflow and update these values:

| Node | Field | Placeholder | Replace With |
|---|---|---|---|
| `OpenRouter Score And Email` | Authorization header | `YOUR_OPENROUTER_API_KEY` | Your OpenRouter API key |
| `HTTP Request` (Company Research) | Authorization header | `YOUR_OPENROUTER_API_KEY` | Your OpenRouter API key |
| `Adzuna Jobs` | URL params | `YOUR_ADZUNA_APP_ID` | Your Adzuna App ID |
| `Adzuna Jobs` | URL params | `YOUR_ADZUNA_APP_KEY` | Your Adzuna App Key |
| `Save To MongoDB` | Credentials | `YOUR_MONGODB_CREDENTIAL_ID` | Create MongoDB credential in n8n |

### Step 3 — Configure MongoDB Credential in n8n

1. In n8n, go to **Credentials** → **New Credential**
2. Search for **MongoDB**
3. Enter your connection string and database name (`n8n-jobs`)
4. Save and link it to the **Save To MongoDB** node

### Step 4 — Get Adzuna API Keys

1. Sign up at [developer.adzuna.com](https://developer.adzuna.com) (free)
2. Create an application to get your `App ID` and `App Key`
3. Update the Adzuna Jobs node URL with your credentials

### Step 5 — Activate the Workflow

1. Click the toggle to **Activate** the workflow
2. It will run automatically every hour
3. You can also click **Execute Workflow** to run it manually

---

## 🗂️ n8n Workflow — What Each Node Does

```
Schedule Trigger (every 1 hour)
    │
    ├──► RemoteOK Jobs        — Fetches from remoteok.com API
    ├──► Remotive Jobs        — Fetches from remotive.com API
    ├──► WWR RSS Jobs         — Fetches WeWorkRemotely RSS feed
    └──► Adzuna Jobs          — Fetches from Adzuna API (requires key)
         │
    Merge 1 + Merge 2 + Merge 3
         │
    Normalize, Filter & Deduplicate
         │   • Strips HTML from descriptions
         │   • Filters by allowed keywords (React, MERN, Node, etc.)
         │   • Blocks irrelevant roles (sales, legal, marketing, etc.)
         │   • Deduplicates by URL
         │   • Only keeps jobs posted within last 72 hours
         │
    Limit (100 jobs max)
         │
    OpenRouter Score & Email  — AI scores job 1-100 + drafts cover letter
         │
    Parse AI Output           — Extracts score, reason, email subject/body
         │
    HTTP Request              — AI identifies real company from description
         │
    Company Research AI       — Enriches: name, industry, summary, website,
         │                       LinkedIn, HR email guess, possible HR emails
         │
    High Match? (score ≥ 70)
         │
    Save To MongoDB           — Upserts job record (deduplicates by URL)
```

---

## 📊 Dashboard Features

### Job Table
- Paginated list of all jobs (20 per page)
- Search across title, company, location, industry
- Filter by status: New / Applied / Interview / Rejected / Saved
- Quick **applied toggle** — click the circle icon to mark as applied instantly

### Job Detail Modal
- Full job description
- Company info: summary, industry, website, LinkedIn, careers page
- **HR Emails** — all discovered emails with **"Use & Send"** button
- AI match score and reasoning
- Saved email preview

### Email Modal
- Upload resume (PDF, DOCX, TXT) for personalized generation
- AI generates cover letter using your profile + job description
- Edit subject and body before sending
- **Send to all HR emails at once** — each gets a separate personal email
- Resume automatically attached to every sent email
- Per-email delivery status shown after sending

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── generate-email/    # AI cover letter generation
│   │   ├── jobs/              # Job CRUD + status updates
│   │   ├── parse-resume/      # PDF/DOCX/TXT text extraction
│   │   └── send-email/        # Gmail SMTP sending
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx               # Main dashboard
├── components/
│   ├── EmailModal.tsx          # Cover letter + Gmail send
│   ├── JobDetailModal.tsx      # Job details + company info
│   ├── ResumeUploader.tsx      # Drag & drop resume upload
│   ├── SkeletonRow.tsx         # Loading skeleton
│   └── StatusBadge.tsx         # Status pill component
├── lib/
│   └── mongodb.ts              # MongoDB connection singleton
├── types/
│   └── job.ts                  # TypeScript interfaces
├── AI Remote Job Hunter.json   # n8n workflow (import this)
├── .env                        # Your environment variables
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, Lucide Icons |
| **Backend** | Next.js API Routes (Node.js) |
| **Database** | MongoDB 6 |
| **Automation** | n8n |
| **AI** | OpenRouter (free models via `openrouter/auto`) |
| **Email** | Nodemailer + Gmail SMTP |
| **File Parsing** | pdf-parse, mammoth |
| **File Upload** | react-dropzone |

---

## 🔧 Available Scripts

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## 🐛 Troubleshooting

<details>
<summary><b>Gmail authentication failed</b></summary>

- Make sure **2-Step Verification** is enabled on your Google account
- Use an **App Password**, not your regular Gmail password
- Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
- The password should be 16 characters — spaces are optional

</details>

<details>
<summary><b>AI service error 429 (rate limit)</b></summary>

- The free tier of OpenRouter has rate limits per model
- The app uses `openrouter/auto` which automatically routes to models with available capacity
- If you hit limits, wait a few minutes and try again
- Consider upgrading to a paid OpenRouter plan for higher limits

</details>

<details>
<summary><b>No jobs appearing in dashboard</b></summary>

1. Check your MongoDB connection — make sure it's running
2. Run the n8n workflow manually (click **Execute Workflow**)
3. Check n8n execution logs for errors
4. Verify your MongoDB credential is correctly linked in n8n
5. Make sure the database name matches: `n8n-jobs`

</details>

<details>
<summary><b>n8n workflow import fails</b></summary>

- Make sure you're using n8n version 1.0+
- Go to **Settings** → **n8n API** and check the version
- Try importing via **Workflows** → **Import from URL** if file import fails

</details>

<details>
<summary><b>Adzuna jobs not loading</b></summary>

- Sign up at [developer.adzuna.com](https://developer.adzuna.com) for free API keys
- Replace `YOUR_ADZUNA_APP_ID` and `YOUR_ADZUNA_APP_KEY` in the Adzuna Jobs node
- The other 3 sources (RemoteOK, Remotive, WWR) work without any API key

</details>

---

## 🔒 Security Notes

- Never commit your `.env` file — it's in `.gitignore`
- The `AI Remote Job Hunter.json` file uses placeholders — safe to share
- Gmail App Passwords are scoped to a single app and can be revoked anytime
- OpenRouter free keys have usage limits — monitor at [openrouter.ai/activity](https://openrouter.ai/activity)

---

## 📄 License

MIT — feel free to use, modify, and distribute.

---

<div align="center">

Built with ❤️ by **Musharaf Faheem**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-musharaf--faheem-blue?style=flat&logo=linkedin)](https://linkedin.com/in/musharaf-faheem)
[![GitHub](https://img.shields.io/badge/GitHub-mushi42-black?style=flat&logo=github)](https://github.com/mushi42)

</div>
