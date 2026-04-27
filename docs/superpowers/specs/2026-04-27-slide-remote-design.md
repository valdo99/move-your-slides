# Slide Remote — Design Spec
**Date:** 2026-04-27

## Overview
A Next.js web app where a computer displays PDF slides and a phone acts as a remote control (next/prev) via a shareable room code.

## Stack
- **Framework:** Next.js (App Router)
- **Real-time:** Pusher free tier (client-side only, no server middleware)
- **Slide rendering:** PDF.js (client-side, no server processing)
- **QR code:** qrcode.react
- **Slide format:** PDF only (PPTX users export to PDF first)

## Pages
- `/` — Upload PDF, generate room code, redirect to presenter view
- `/present/[code]` — Full-screen slide display (computer)
- `/remote/[code]` — Prev/Next remote control (phone)

## API Routes
- `POST /api/room` — Generates a random 6-digit room code and returns it

## Data Flow
1. Presenter uploads PDF on `/`
2. PDF rendered in browser via PDF.js
3. Room code generated via `/api/room`
4. Presenter view shows QR code linking to `/remote/[code]`
5. Phone opens `/remote/[code]`, connects to Pusher channel `room-{code}`
6. Phone taps Next/Prev → Pusher event `slide:change` with `{ direction: "next" | "prev" }`
7. Presenter listens on same channel, advances or retreats slide

## Environment Variables
- `NEXT_PUBLIC_PUSHER_KEY`
- `NEXT_PUBLIC_PUSHER_CLUSTER`
- `PUSHER_APP_ID`
- `PUSHER_SECRET`

## Constraints
- No user accounts or auth
- Room state is ephemeral (in-browser only)
- PPTX not supported
