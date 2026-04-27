# Slide Remote Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js web app where a computer displays PDF slides and a phone controls them (next/prev) via a shareable 6-digit room code and Pusher real-time sync.

**Architecture:** Phone POSTs slide commands to a Next.js API route, which triggers a Pusher event on a per-room channel; the presenter page listens client-side and advances slides rendered via PDF.js. No server state — room codes are ephemeral.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Pusher (server SDK + pusher-js client), pdfjs-dist, qrcode.react, Tailwind CSS, Jest + React Testing Library

---

## File Structure

- `package.json` — project deps
- `.env.local.example` — Pusher key template
- `next.config.ts` — webpack alias for pdf.js worker
- `lib/room.ts` — room code generation (pure, testable)
- `lib/pusher-client.ts` — singleton Pusher client
- `lib/pusher-server.ts` — Pusher server SDK instance
- `lib/use-pdf.ts` — custom hook: load PDF, render page to canvas
- `app/page.tsx` — home: upload PDF + generate room code
- `app/present/[code]/page.tsx` — presenter: full-screen slides + QR code
- `app/remote/[code]/page.tsx` — remote: Prev/Next buttons
- `app/api/room/route.ts` — POST: return a new room code
- `app/api/slide/route.ts` — POST: trigger Pusher slide:change event

---

### Task 1: Init project, install deps, create GitHub repo

**Files:**
- Create: `package.json`, `next.config.ts`, `.env.local.example`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`

- [ ] **Step 1: Create Next.js project**

```bash
cd /Users/valdo/Desktop/move-your-slides
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*" --yes
```

Expected: Next.js scaffold created in current directory.

- [ ] **Step 2: Install dependencies**

```bash
npm install pusher pusher-js pdfjs-dist qrcode.react
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest @types/jest
```

- [ ] **Step 3: Add jest config to package.json**

Add to `package.json`:

```json
"jest": {
  "testEnvironment": "node",
  "transform": {
    "^.+\\.tsx?$": ["ts-jest", { "tsconfig": { "jsx": "react" } }]
  },
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/$1"
  }
},
"scripts": {
  "test": "jest"
}
```

(Merge with existing `scripts` — keep `dev`, `build`, `start`, `lint`.)

- [ ] **Step 4: Create `.env.local.example`**

```
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
PUSHER_APP_ID=your_app_id
PUSHER_SECRET=your_pusher_secret
```

- [ ] **Step 5: Create GitHub repo and push**

```bash
cd /Users/valdo/Desktop/move-your-slides
git init
git add .
git commit -m "feat: init Next.js project with dependencies"
gh repo create move-your-slides --public --source=. --remote=origin --push
```

Expected: repo created and pushed at github.com/valdo/move-your-slides (or similar).

---

### Task 2: Room code generation

**Files:**
- Create: `lib/room.ts`
- Create: `lib/room.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/room.test.ts`:

```typescript
import { generateRoomCode } from './room'

describe('generateRoomCode', () => {
  it('returns a 6-character string', () => {
    expect(generateRoomCode()).toHaveLength(6)
  })

  it('only contains uppercase letters and digits', () => {
    const code = generateRoomCode()
    expect(code).toMatch(/^[A-Z0-9]{6}$/)
  })

  it('generates different codes on consecutive calls', () => {
    const codes = new Set(Array.from({ length: 20 }, generateRoomCode))
    expect(codes.size).toBeGreaterThan(1)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest lib/room.test.ts
```

Expected: FAIL — `generateRoomCode` not found.

- [ ] **Step 3: Implement `lib/room.ts`**

```typescript
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function generateRoomCode(): string {
  return Array.from({ length: 6 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('')
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest lib/room.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/room.ts lib/room.test.ts
git commit -m "feat: room code generation"
```

---

### Task 3: Pusher client and server setup

**Files:**
- Create: `lib/pusher-client.ts`
- Create: `lib/pusher-server.ts`

- [ ] **Step 1: Create `.env.local` from example**

```bash
cp .env.local.example .env.local
```

Then fill in real values from your Pusher dashboard (https://pusher.com — free account, create an app, copy keys).

- [ ] **Step 2: Create `lib/pusher-server.ts`**

```typescript
import Pusher from 'pusher'

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})
```

- [ ] **Step 3: Create `lib/pusher-client.ts`**

```typescript
import PusherJs from 'pusher-js'

let client: PusherJs | null = null

export function getPusherClient(): PusherJs {
  if (!client) {
    client = new PusherJs(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })
  }
  return client
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/pusher-client.ts lib/pusher-server.ts .env.local.example
git commit -m "feat: pusher client and server setup"
```

---

### Task 4: API routes

**Files:**
- Create: `app/api/room/route.ts`
- Create: `app/api/slide/route.ts`

- [ ] **Step 1: Create `app/api/room/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { generateRoomCode } from '@/lib/room'

export async function POST() {
  return NextResponse.json({ code: generateRoomCode() })
}
```

- [ ] **Step 2: Create `app/api/slide/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { pusherServer } from '@/lib/pusher-server'

export async function POST(req: NextRequest) {
  const { code, direction } = await req.json() as { code: string; direction: 'next' | 'prev' }

  if (!code || !['next', 'prev'].includes(direction)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  await pusherServer.trigger(`room-${code}`, 'slide:change', { direction })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/room/route.ts app/api/slide/route.ts
git commit -m "feat: api routes for room code and slide control"
```

---

### Task 5: PDF rendering hook

**Files:**
- Create: `lib/use-pdf.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Configure webpack for pdf.js worker in `next.config.ts`**

Replace the file contents with:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias['pdfjs-dist/build/pdf.worker.entry'] =
      'pdfjs-dist/build/pdf.worker.min.mjs'
    return config
  },
}

export default nextConfig
```

- [ ] **Step 2: Create `lib/use-pdf.ts`**

```typescript
'use client'
import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export function usePdf(file: File | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    pdfjsLib.getDocument(url).promise.then((pdf) => {
      pdfRef.current = pdf
      setTotalPages(pdf.numPages)
      setCurrentPage(1)
    })
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    const pdf = pdfRef.current
    const canvas = canvasRef.current
    if (!pdf || !canvas) return

    pdf.getPage(currentPage).then((page) => {
      const viewport = page.getViewport({ scale: 1 })
      const scale = Math.min(
        canvas.parentElement!.clientWidth / viewport.width,
        canvas.parentElement!.clientHeight / viewport.height
      )
      const scaled = page.getViewport({ scale })
      canvas.width = scaled.width
      canvas.height = scaled.height
      page.render({ canvasContext: canvas.getContext('2d')!, viewport: scaled })
    })
  }, [currentPage, totalPages])

  function goNext() {
    setCurrentPage((p) => Math.min(p + 1, totalPages))
  }

  function goPrev() {
    setCurrentPage((p) => Math.max(p - 1, 1))
  }

  return { canvasRef, currentPage, totalPages, goNext, goPrev }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/use-pdf.ts next.config.ts
git commit -m "feat: pdf.js rendering hook"
```

---

### Task 6: Home page (upload + generate room)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  async function handleStart() {
    if (!file) return
    setLoading(true)
    const res = await fetch('/api/room', { method: 'POST' })
    const { code } = await res.json()
    sessionStorage.setItem(`pdf-${code}`, await toBase64(file))
    router.push(`/present/${code}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 bg-gray-950 text-white">
      <h1 className="text-4xl font-bold tracking-tight">Move Your Slides</h1>
      <p className="text-gray-400">Upload a PDF and control slides from your phone.</p>

      <label className="cursor-pointer border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl p-10 text-center transition-colors">
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <span className="text-blue-400 font-medium">{file.name}</span>
        ) : (
          <span className="text-gray-400">Click to select a PDF</span>
        )}
      </label>

      <button
        onClick={handleStart}
        disabled={!file || loading}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg font-semibold transition-colors"
      >
        {loading ? 'Starting…' : 'Start Presentation'}
      </button>
    </main>
  )
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: home page with pdf upload"
```

---

### Task 7: Presenter page

**Files:**
- Create: `app/present/[code]/page.tsx`

- [ ] **Step 1: Create `app/present/[code]/page.tsx`**

```tsx
'use client'
import { useEffect, useState, use } from 'react'
import { usePdf } from '@/lib/use-pdf'
import { getPusherClient } from '@/lib/pusher-client'
import QRCode from 'qrcode.react'

export default function PresentPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [file, setFile] = useState<File | null>(null)
  const [showQr, setShowQr] = useState(true)
  const { canvasRef, currentPage, totalPages, goNext, goPrev } = usePdf(file)

  // Load PDF from sessionStorage
  useEffect(() => {
    const data = sessionStorage.getItem(`pdf-${code}`)
    if (!data) return
    fetch(data)
      .then((r) => r.blob())
      .then((blob) => setFile(new File([blob], 'slides.pdf', { type: 'application/pdf' })))
  }, [code])

  // Listen for remote slide changes
  useEffect(() => {
    const pusher = getPusherClient()
    const channel = pusher.subscribe(`room-${code}`)
    channel.bind('slide:change', ({ direction }: { direction: 'next' | 'prev' }) => {
      if (direction === 'next') goNext()
      else goPrev()
    })
    return () => pusher.unsubscribe(`room-${code}`)
  }, [code, goNext, goPrev])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev])

  const remoteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/remote/${code}`
    : ''

  return (
    <div className="relative w-screen h-screen bg-black flex items-center justify-center">
      <canvas ref={canvasRef} className="max-w-full max-h-full" />

      {/* Slide counter */}
      {totalPages > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
          {currentPage} / {totalPages}
        </div>
      )}

      {/* Room code + QR toggle */}
      <button
        onClick={() => setShowQr((v) => !v)}
        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1 rounded-lg"
      >
        {code}
      </button>

      {showQr && remoteUrl && (
        <div className="absolute top-12 right-4 bg-white p-3 rounded-xl shadow-xl">
          <QRCode value={remoteUrl} size={140} />
          <p className="text-center text-xs text-gray-500 mt-1">{code}</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/present/
git commit -m "feat: presenter page with pdf rendering, pusher listener, and qr code"
```

---

### Task 8: Remote control page

**Files:**
- Create: `app/remote/[code]/page.tsx`

- [ ] **Step 1: Create `app/remote/[code]/page.tsx`**

```tsx
'use client'
import { use, useState } from 'react'

export default function RemotePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [feedback, setFeedback] = useState<'next' | 'prev' | null>(null)

  async function send(direction: 'next' | 'prev') {
    setFeedback(direction)
    setTimeout(() => setFeedback(null), 200)
    await fetch('/api/slide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, direction }),
    })
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6 p-8 select-none">
      <p className="text-gray-400 text-sm tracking-widest uppercase">Room {code}</p>

      <div className="flex gap-6 w-full max-w-sm">
        <button
          onPointerDown={() => send('prev')}
          className={`flex-1 h-40 rounded-2xl text-3xl font-bold transition-colors ${
            feedback === 'prev' ? 'bg-blue-400' : 'bg-gray-800 active:bg-gray-700'
          }`}
        >
          ←
        </button>
        <button
          onPointerDown={() => send('next')}
          className={`flex-1 h-40 rounded-2xl text-3xl font-bold transition-colors ${
            feedback === 'next' ? 'bg-blue-400' : 'bg-gray-800 active:bg-gray-700'
          }`}
        >
          →
        </button>
      </div>

      <p className="text-gray-600 text-xs">Tap to control slides</p>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/remote/
git commit -m "feat: phone remote page with next/prev controls"
```

---

### Task 9: Final polish and push

**Files:**
- Modify: `app/layout.tsx` — set dark background, good meta title
- Modify: `app/globals.css` — ensure dark defaults

- [ ] **Step 1: Update `app/layout.tsx` metadata**

Find the `metadata` export and replace it with:

```typescript
export const metadata: Metadata = {
  title: 'Move Your Slides',
  description: 'Control your presentation from your phone',
}
```

Also add `className="bg-gray-950 text-white"` to the `<body>` tag if not already present.

- [ ] **Step 2: Run the app locally and smoke test**

```bash
npm run dev
```

1. Open `http://localhost:3000` — upload a PDF, click Start
2. You should see the first slide rendered + a QR code
3. Open `http://localhost:3000/remote/[code]` in another tab
4. Tap Next/Prev — slide should advance on the presenter tab

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: room.test.ts passes (3 tests).

- [ ] **Step 4: Final commit and push**

```bash
git add -A
git commit -m "feat: final polish and layout"
git push origin main
```
