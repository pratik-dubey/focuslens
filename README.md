# FocusLens 🧠

> AI-powered focus tracker for students. Know when you actually learn.

Built for **GDG Hacker Cup @ KNIT Sultanpur** — PS 2: When Learning Becomes Exhaustion

---

## Quick start

```bash
npm install
# fill in .env.local (see below)
npm run dev
```

## .env.local (minimum required)

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/focuslens
NEXTAUTH_SECRET=any_random_32_char_string
NEXTAUTH_URL=http://localhost:3000
NVIDIA_API_KEY=nvapi-your-key-here
```

Get NVIDIA API key free at → https://build.nvidia.com

## Load the Chrome extension

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `public/extension/` folder

## What's inside

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Login (email + Google) |
| `/signup` | Create account |
| `/dashboard` | Focus overview + heatmaps |
| `/dashboard/daily` | AI daily report |
| `/dashboard/weekly` | AI weekly report |
| `/dashboard/topics` | Topics studied |

## Architecture

See `CONTEXT.md` for full architecture, what's done, what's left, and demo script.
