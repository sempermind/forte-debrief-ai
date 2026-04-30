# Forté Debrief AI — Semper Mind

A personalized 1:1 Forté Communication Style debrief powered by AI. Built by Semper Mind.

## Deploy in 10 Minutes

### Step 1 — Add your API keys locally

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
ELEVENLABS_API_KEY=your-elevenlabs-key-here
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
```

> `.env.local` is gitignored — it will never be committed to GitHub.

### Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/forte-debrief-ai.git
git push -u origin main
```

### Step 3 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New Project**
2. Import your `forte-debrief-ai` GitHub repo
3. Before deploying, click **Environment Variables** and add:
   - `ANTHROPIC_API_KEY` → your Anthropic key
   - `ELEVENLABS_API_KEY` → your ElevenLabs key (optional)
   - `ELEVENLABS_VOICE_ID` → your voice ID (optional, defaults to Sarah)
4. Click **Deploy**

That's it. Your app will be live at `forte-debrief-ai.vercel.app`.

---

## How It Works

- **User lands** → enters name + uploads their Forté PDF
- **AI reads the PDF** server-side, extracts profile data, renders mini graphs on the left panel
- **Debrief begins** — the AI facilitator follows your exact debrief methodology
- **Voice toggle** — enables ElevenLabs premium voice with live red waveform visualizer, or falls back to browser TTS if no ElevenLabs key is set
- **Mic button** — participant can speak responses (Chrome/Edge only)

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | Your Anthropic API key |
| `ELEVENLABS_API_KEY` | Optional | ElevenLabs key for premium voice |
| `ELEVENLABS_VOICE_ID` | Optional | Voice ID (defaults to Sarah) |

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Next.js 14** — React framework with API routes
- **Anthropic Claude** — powers the debrief AI (claude-sonnet-4)
- **ElevenLabs** — premium voice synthesis (optional)
- **Web Speech API** — browser TTS fallback + mic input
- **Web Audio API** — drives the live waveform visualizer
